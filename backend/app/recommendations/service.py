"""추천 파이프라인.

순서
1. 스키마 검사 통과 코스만 후보로 사용
2. 노출 정책(BLOCKED·비주력) 강제 제외
3. 하드 필터: 출발지 / 적용 요일 / 가능 시간 / 귀가 가능성 / 이동 부담
4. 취향 매칭이 하나도 없으면 제외
5. 남은 코스를 설명 가능한 가중합으로 점수화·정렬
6. 결과가 없으면 "어떤 조건을 바꾸면 몇 개가 나오는지" 대안을 계산

핵심 원칙: **조건을 만족하지 않는 코스를 억지로 끼워 넣지 않습니다.**
결과가 0개면 0개로 응답하고, 대신 조건 재설정 힌트를 함께 돌려줍니다.
"""

from copy import deepcopy
from typing import Any

from backend.app.courses import exposure
from backend.app.courses.data import DATA_SNAPSHOT_DATE
from backend.app.courses.feasibility import (
    DURATION_LIMITS,
    evaluate_return_feasibility,
)
from backend.app.courses.service import (
    get_schema_diagnostics,
    get_valid_courses,
    resolve_fatigue,
)
from backend.app.recommendations.models import (
    CourseRecommendationSummary,
    ExcludedCourse,
    ExclusionReason,
    RecommendationMeta,
    RecommendationRequest,
    RecommendationResponse,
    RecommendationSuggestion,
)
from backend.app.traffic import service as traffic_service
from backend.app.traffic.models import TrafficEvaluation

MAX_RESULTS = 3

RANKING_WEIGHTS: dict[str, float] = {
    "preferenceMatch": 0.35,
    "mobility": 0.30,
    "returnMargin": 0.15,
    "localResource": 0.12,
    "recordFit": 0.08,
}

#: 이동 부담 조건별 허용 상한.
MOBILITY_LIMITS: dict[str, dict[str, Any]] = {
    "MIN_TRANSFER": {
        "label": "환승 최소",
        "maxTransferCount": 0,
        "maxWalkingMinutes": None,
        "maxFatigueScore": None,
    },
    "LOW_BURDEN": {
        "label": "이동 부담 낮게",
        "maxTransferCount": 1,
        "maxWalkingMinutes": 40,
        "maxFatigueScore": 2.35,
    },
    "ANY": {
        "label": "상관없음",
        "maxTransferCount": None,
        "maxWalkingMinutes": None,
        "maxFatigueScore": None,
    },
}

VERIFICATION_QUALITY: dict[str, float] = {
    "VERIFIED": 1.0,
    "VERIFIED_MAP": 0.95,
    "PARTIALLY_VERIFIED": 0.8,
    "NEEDS_RECHECK": 0.6,
    "TEMPORARILY_UNAVAILABLE": 0.3,
}

SERVICE_DAY = "SATURDAY"


def _round(value: float) -> float:
    return round(value, 4)


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def _unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(values))


# ----------------------------------------------------------------------
# 하드 필터
# ----------------------------------------------------------------------


def _collect_exclusion_reasons(
    course: dict[str, Any],
    request: RecommendationRequest,
    feasibility: dict[str, Any],
    fatigue: dict[str, Any],
    mode: exposure.ExposureMode,
) -> list[ExclusionReason]:
    reasons: list[ExclusionReason] = []

    if course["departurePoint"] != request.departure:
        reasons.append(
            ExclusionReason(
                code="UNSUPPORTED_DEPARTURE",
                message="선택한 출발지에서 이용할 수 없는 코스입니다.",
            )
        )

    verification_status = course.get("verificationStatus")
    applicable_days = course.get("applicableDays", [])
    day_is_confirmed_unavailable = verification_status in {
        "TEMPORARILY_UNAVAILABLE",
        "BLOCKED",
    } or (verification_status == "VERIFIED" and SERVICE_DAY not in applicable_days)
    # 데모(INTERNAL)는 토요일 운행 미확인을 2차 확인 경고로 다룹니다.
    # 확인된 미운영 상태와 PUBLIC의 미확인 요일은 계속 차단합니다.
    if day_is_confirmed_unavailable or (
        mode == "PUBLIC" and SERVICE_DAY not in applicable_days
    ):
        reasons.append(
            ExclusionReason(
                code="DAY_NOT_SUPPORTED",
                message="현재 MVP가 검증한 토요일 운행 조건을 만족하지 않는 코스입니다.",
            )
        )

    allowed = DURATION_LIMITS[request.duration]
    if course["totalMinutes"]["plan"] > allowed:
        reasons.append(
            ExclusionReason(
                code="TIME_LIMIT_EXCEEDED",
                message=(
                    f"계획 소요 {course['totalMinutes']['plan']}분으로 "
                    f"선택한 가능 시간({allowed}분)을 초과합니다."
                ),
            )
        )

    if feasibility["status"] == "NOT_FEASIBLE":
        reasons.append(
            ExclusionReason(
                code="RETURN_NOT_FEASIBLE",
                message=(
                    feasibility["messages"][0]
                    if feasibility["messages"]
                    else "선택한 시간 안에 출발지로 돌아올 수 없습니다."
                ),
            )
        )

    limits = MOBILITY_LIMITS[request.mobility]
    max_transfer = limits["maxTransferCount"]
    max_walking = limits["maxWalkingMinutes"]
    max_fatigue = limits["maxFatigueScore"]

    if max_transfer is not None and course["transferCount"] > max_transfer:
        reasons.append(
            ExclusionReason(
                code="MOBILITY_LIMIT_EXCEEDED",
                message=(
                    f"환승 {course['transferCount']}회로 선택한 이동 부담 조건"
                    f"({limits['label']})을 넘습니다."
                ),
            )
        )
    elif max_walking is not None and course["walkingMinutes"]["plan"] > max_walking:
        reasons.append(
            ExclusionReason(
                code="MOBILITY_LIMIT_EXCEEDED",
                message=(
                    f"이동 도보 {course['walkingMinutes']['plan']}분으로 선택한 "
                    f"이동 부담 조건({limits['label']})을 넘습니다."
                ),
            )
        )
    elif max_fatigue is not None and fatigue["score"] > max_fatigue:
        reasons.append(
            ExclusionReason(
                code="MOBILITY_LIMIT_EXCEEDED",
                message=(
                    f"피로도 점수 {fatigue['score']}로 선택한 이동 부담 조건"
                    f"({limits['label']})을 넘습니다."
                ),
            )
        )

    matched = set(course["preferences"]) & set(request.preferences)
    if not matched:
        reasons.append(
            ExclusionReason(
                code="PREFERENCE_MISMATCH",
                message="선택한 취향과 겹치는 요소가 없는 코스입니다.",
            )
        )

    return reasons


# ----------------------------------------------------------------------
# 점수화
# ----------------------------------------------------------------------


def _factor(score: float, key: str, explanation: str) -> dict[str, Any]:
    weight = RANKING_WEIGHTS[key]
    rounded = _round(_clamp(score))

    return {
        "score": rounded,
        "weight": weight,
        "weightedScore": _round(rounded * weight),
        "explanation": explanation,
    }


def _local_resource_score(course: dict[str, Any]) -> tuple[float, str]:
    # 행을 잘게 쪼갠 코스가 점수를 더 받지 않도록 레코드 *개수*가 아니라
    # 음식·로컬 설명 두 범주의 충족 여부를 사용합니다.
    has_food = bool(course.get("localFood"))
    has_local_point = bool(course.get("localPoints"))
    covered_categories = int(has_food) + int(has_local_point)
    coverage = covered_categories / 2
    quality = VERIFICATION_QUALITY.get(course["verificationStatus"], 0.6)
    score = _clamp(0.4 + coverage * 0.6) * quality

    return score, (
        f"지역 음식·로컬 포인트 {covered_categories}/2개 범주, "
        f"데이터 검증상태 {course['verificationStatus']} 반영"
    )


def _record_fit_score(
    course: dict[str, Any], request: RecommendationRequest
) -> tuple[float, str]:
    prompts = len(course.get("scenePrompts", []))
    base = _clamp(prompts / 3)
    wants_memory = "MEMORY" in request.preferences
    supports_memory = "MEMORY" in course["preferences"]

    if wants_memory:
        score = base if supports_memory else base * 0.5
        detail = "감성기록 취향 선택" + (
            " · 코스가 기록 요소를 포함" if supports_memory else " · 코스 기록 요소 약함"
        )
    else:
        score = base * 0.7
        detail = "감성기록 미선택으로 비중 축소"

    return score, f"오늘 담아볼 장면 {prompts}개, {detail}"


def _mobility_score(fatigue: dict[str, Any]) -> float:
    # 피로도 점수는 1(가장 낮음)~3(가장 높음) 범위입니다.
    return (3 - fatigue["score"]) / 2


def _return_margin_score(feasibility: dict[str, Any]) -> float:
    allowed = max(feasibility["allowedMinutes"], 1)
    ratio = feasibility["slackMinutes"] / allowed

    if feasibility["status"] == "TIGHT":
        return _clamp(ratio) * 0.5

    return _clamp(ratio)


def _build_score_breakdown(
    course: dict[str, Any],
    request: RecommendationRequest,
    fatigue: dict[str, Any],
    feasibility: dict[str, Any],
) -> dict[str, Any]:
    selected = _unique(list(request.preferences))
    matched = [item for item in selected if item in set(course["preferences"])]
    preference_score = len(matched) / len(selected)

    local_score, local_explanation = _local_resource_score(course)
    record_score, record_explanation = _record_fit_score(course, request)
    mobility_score = _mobility_score(fatigue)
    margin_score = _return_margin_score(feasibility)

    return {
        "preferenceMatch": {
            **_factor(
                preference_score,
                "preferenceMatch",
                f"선택한 취향 {len(selected)}개 중 {len(matched)}개가 코스와 일치합니다.",
            ),
            "matchedCount": len(matched),
            "selectedCount": len(selected),
            "matchedPreferences": matched,
        },
        "mobility": {
            **_factor(
                mobility_score,
                "mobility",
                (
                    f"이동 도보 {course['walkingMinutes']['plan']}분 · "
                    f"환승 {course['transferCount']}회 · "
                    f"왕복 교통 {course['roundTripTransitMinutes']}분 → "
                    f"피로도 {fatigue['level']}({fatigue['score']})"
                ),
            ),
            "fatigueScore": fatigue["score"],
            "fatigueLevel": fatigue["level"],
            "walkingMinutes": course["walkingMinutes"]["plan"],
            "transferCount": course["transferCount"],
        },
        "returnMargin": {
            **_factor(
                margin_score,
                "returnMargin",
                (
                    f"최악값 {feasibility['worstCaseTotalMinutes']}분 기준 "
                    f"여유 {feasibility['slackMinutes']}분 "
                    f"(판정 {feasibility['status']})"
                ),
            ),
            "slackMinutes": feasibility["slackMinutes"],
            "status": feasibility["status"],
        },
        "localResource": _factor(local_score, "localResource", local_explanation),
        "recordFit": _factor(record_score, "recordFit", record_explanation),
    }


def _total_score(breakdown: dict[str, Any]) -> float:
    return _round(sum(factor["weightedScore"] for factor in breakdown.values()))


def _build_summary(
    course: dict[str, Any],
    request: RecommendationRequest,
    fatigue: dict[str, Any],
    feasibility: dict[str, Any],
    traffic: TrafficEvaluation,
) -> dict[str, Any]:
    breakdown = _build_score_breakdown(course, request, fatigue, feasibility)
    reasons = list(course["recommendationReasons"])

    if feasibility["status"] == "TIGHT":
        reasons.append(
            f"지연 시 최대 {feasibility['worstCaseTotalMinutes']}분까지 늘어날 수 있어 여유를 두고 움직여 주세요."
        )

    if traffic.status == "TIGHT":
        reasons.extend(warning.message for warning in traffic.warnings)

    return {
        "id": course["id"],
        "title": course["title"],
        "region": course["region"],
        "thumbnailUrl": course["thumbnailUrl"],
        "tags": course["tags"],
        "courseType": course["courseType"],
        "fatigueLevel": fatigue["level"],
        "fatigueScore": fatigue["score"],
        "fatigueExplanation": fatigue,
        "durationMinutes": course["totalMinutes"]["plan"],
        "durationMinMinutes": course["totalMinutes"]["min"],
        "durationMaxMinutes": course["totalMinutes"]["max"],
        "walkingMinutes": course["walkingMinutes"]["plan"],
        "transferCount": course["transferCount"],
        "roundTripTransitMinutes": course["roundTripTransitMinutes"],
        "verificationStatus": course["verificationStatus"],
        "exposureTier": course["exposureTier"],
        "recommendationReasons": reasons,
        "recommendationScore": _total_score(breakdown),
        "scoreBreakdown": breakdown,
        "returnFeasibility": feasibility,
        "trafficStatus": traffic.status,
        "trafficWarnings": traffic.warnings,
        "traffic": traffic,
    }


# ----------------------------------------------------------------------
# 결과 없음 대안 계산
# ----------------------------------------------------------------------


def _count_matches(
    courses: list[dict[str, Any]],
    request: RecommendationRequest,
    mode: exposure.ExposureMode,
    traffic_provider: traffic_service.TrafficProvider | None = None,
) -> int:
    count = 0

    for course in courses:
        fatigue = resolve_fatigue(course)
        feasibility = evaluate_return_feasibility(course, request.duration)

        if not _collect_exclusion_reasons(
            course, request, feasibility, fatigue, mode
        ):
            traffic = traffic_service.evaluate_course_traffic(
                course, feasibility, traffic_provider
            )
            if traffic.status == "BLOCKED":
                continue
            count += 1

    return count


def _build_suggestions(
    courses: list[dict[str, Any]],
    request: RecommendationRequest,
    mode: exposure.ExposureMode,
    traffic_provider: traffic_service.TrafficProvider | None = None,
) -> list[RecommendationSuggestion]:
    """조건 하나만 바꿨을 때 결과가 생기는지 실제로 계산해 안내합니다."""

    suggestions: list[RecommendationSuggestion] = []

    if request.duration == "SIX_HOURS":
        relaxed = request.model_copy(update={"duration": "FULL_DAY"})
        count = _count_matches(courses, relaxed, mode, traffic_provider)
        if count:
            suggestions.append(
                RecommendationSuggestion(
                    code="RELAX_DURATION",
                    message=f"가능 시간을 '하루 종일'로 바꾸면 {count}개 코스를 추천할 수 있어요.",
                    availableCount=count,
                )
            )

    if request.mobility != "ANY":
        relaxed = request.model_copy(update={"mobility": "ANY"})
        count = _count_matches(courses, relaxed, mode, traffic_provider)
        if count:
            suggestions.append(
                RecommendationSuggestion(
                    code="RELAX_MOBILITY",
                    message=f"이동 부담 조건을 '상관없음'으로 바꾸면 {count}개 코스를 추천할 수 있어요.",
                    availableCount=count,
                )
            )

    all_preferences = ["NATURE_WALK", "HISTORY_CULTURE", "FOOD_MARKET", "MEMORY"]
    relaxed = request.model_copy(update={"preferences": all_preferences})
    count = _count_matches(courses, relaxed, mode, traffic_provider)
    if count and count > 0 and len(request.preferences) < len(all_preferences):
        suggestions.append(
            RecommendationSuggestion(
                code="ADD_PREFERENCE",
                message=f"취향을 넓게 선택하면 {count}개 코스를 추천할 수 있어요.",
                availableCount=count,
            )
        )

    other_departure = (
        "GWANGJU_SONGJEONG" if request.departure == "USQUARE" else "USQUARE"
    )
    relaxed = request.model_copy(update={"departure": other_departure})
    count = _count_matches(courses, relaxed, mode, traffic_provider)
    if count:
        label = "광주송정역" if other_departure == "GWANGJU_SONGJEONG" else "유스퀘어"
        suggestions.append(
            RecommendationSuggestion(
                code="CHANGE_DEPARTURE",
                message=f"출발지를 '{label}'로 바꾸면 {count}개 코스를 추천할 수 있어요.",
                availableCount=count,
            )
        )

    if not suggestions:
        suggestions.append(
            RecommendationSuggestion(
                code="NO_ALTERNATIVE",
                message="현재 검증이 끝난 코스 범위에서는 대안이 없습니다. 조건을 다시 선택해 주세요.",
                availableCount=0,
            )
        )

    return suggestions


# ----------------------------------------------------------------------
# 진입점
# ----------------------------------------------------------------------


def get_recommendations(
    request: RecommendationRequest,
) -> RecommendationResponse:
    all_courses = get_valid_courses()
    mode = exposure.get_exposure_mode()
    traffic_provider = traffic_service.get_traffic_provider()

    candidates: list[dict[str, Any]] = []
    exclusions: list[ExcludedCourse] = []
    blocked_count = 0
    traffic_evaluated_count = 0
    traffic_blocked_count = 0
    traffic_tight_count = 0
    recommendable: list[dict[str, Any]] = []

    for index, course in enumerate(all_courses):
        if not exposure.is_recommendable(course, mode):
            blocked_count += 1
            exclusions.append(
                ExcludedCourse(
                    id=course["id"],
                    title=course["title"],
                    reasons=[
                        ExclusionReason(
                            code="BLOCKED_BY_EXPOSURE_POLICY",
                            message=(
                                course.get("holdReason")
                                or "검증이 끝나지 않아 추천 결과에서 제외된 코스입니다."
                            ),
                        )
                    ],
                )
            )
            continue

        recommendable.append(course)

        fatigue = resolve_fatigue(course)
        feasibility = evaluate_return_feasibility(course, request.duration)
        reasons = _collect_exclusion_reasons(
            course, request, feasibility, fatigue, mode
        )

        if reasons:
            exclusions.append(
                ExcludedCourse(
                    id=course["id"], title=course["title"], reasons=reasons
                )
            )
            continue

        traffic = traffic_service.evaluate_course_traffic(
            course, feasibility, traffic_provider
        )
        traffic_evaluated_count += 1

        if traffic.status == "BLOCKED":
            traffic_blocked_count += 1
            exclusions.append(
                ExcludedCourse(
                    id=course["id"],
                    title=course["title"],
                    trafficStatus="BLOCKED",
                    reasons=[
                        ExclusionReason(
                            code="REALTIME_TRAFFIC_BLOCKED",
                            message=(
                                traffic.warnings[0].message
                                if traffic.warnings
                                else "실시간 교통 정보상 코스 수행이 어렵습니다."
                            ),
                        )
                    ],
                )
            )
            continue

        if traffic.status == "TIGHT":
            traffic_tight_count += 1

        adjusted_feasibility = traffic_service.apply_traffic_to_feasibility(
            feasibility, traffic
        )
        summary = _build_summary(
            course, request, fatigue, adjusted_feasibility, traffic
        )
        summary["_sourceIndex"] = index
        candidates.append(summary)

    provider_name = type(traffic_provider).__name__

    ranked = sorted(
        candidates,
        key=lambda item: (
            -item["recommendationScore"],
            -item["scoreBreakdown"]["preferenceMatch"]["matchedCount"],
            item["fatigueScore"],
            item["durationMinutes"],
            item["_sourceIndex"],
        ),
    )[:MAX_RESULTS]

    for rank, item in enumerate(ranked, start=1):
        item.pop("_sourceIndex", None)
        item["rank"] = rank

    suggestions = (
        _build_suggestions(recommendable, request, mode, traffic_provider)
        if not ranked
        else []
    )

    close = getattr(traffic_provider, "close", None)
    if callable(close):
        close()

    return RecommendationResponse(
        courses=[CourseRecommendationSummary(**deepcopy(item)) for item in ranked],
        exclusions=exclusions,
        suggestions=suggestions,
        meta=RecommendationMeta(
            exposureMode=mode,
            evaluatedCount=len(all_courses),
            blockedCount=blocked_count,
            schemaInvalidCount=len(get_schema_diagnostics()),
            dataSnapshotDate=DATA_SNAPSHOT_DATE,
            appliedMobility=request.mobility,
            trafficProvider=provider_name,
            trafficEvaluatedCount=traffic_evaluated_count,
            trafficBlockedCount=traffic_blocked_count,
            trafficTightCount=traffic_tight_count,
        ),
    )
