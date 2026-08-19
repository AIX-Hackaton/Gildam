from typing import Literal, TypedDict

FatigueLevel = Literal["LOW", "MEDIUM", "HIGH"]


class FatigueMetrics(TypedDict):
    walkingMinutes: int
    transferCount: int
    roundTripTransitMinutes: int


class FatigueResult(TypedDict):
    level: FatigueLevel
    score: float


FATIGUE_LEVEL_SCORES: dict[FatigueLevel, int] = {
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 3,
}


def _assert_non_negative_number(name: str, value: int | float) -> None:
    if not isinstance(value, (int, float)) or value < 0:
        raise ValueError(f"{name} must be a non-negative number.")


def classify_walking_burden(walking_minutes: int) -> FatigueLevel:
    _assert_non_negative_number("walkingMinutes", walking_minutes)

    if walking_minutes <= 15:
        return "LOW"
    if walking_minutes <= 35:
        return "MEDIUM"
    return "HIGH"


def classify_transfer_burden(transfer_count: int) -> FatigueLevel:
    _assert_non_negative_number("transferCount", transfer_count)

    if not isinstance(transfer_count, int):
        raise ValueError("transferCount must be an integer.")

    if transfer_count == 0:
        return "LOW"
    if transfer_count == 1:
        return "MEDIUM"
    return "HIGH"


def classify_round_trip_transit_burden(
    round_trip_transit_minutes: int,
) -> FatigueLevel:
    _assert_non_negative_number(
        "roundTripTransitMinutes", round_trip_transit_minutes
    )

    if round_trip_transit_minutes <= 90:
        return "LOW"
    if round_trip_transit_minutes <= 180:
        return "MEDIUM"
    return "HIGH"


def _classify_overall_fatigue(score: float) -> FatigueLevel:
    if score < 1.5:
        return "LOW"
    if score < 2.35:
        return "MEDIUM"
    return "HIGH"


def calculate_fatigue(metrics: FatigueMetrics) -> FatigueResult:
    walking_level = classify_walking_burden(metrics["walkingMinutes"])
    transfer_level = classify_transfer_burden(metrics["transferCount"])
    transit_level = classify_round_trip_transit_burden(
        metrics["roundTripTransitMinutes"]
    )

    score = (
        FATIGUE_LEVEL_SCORES[walking_level] * 0.4
        + FATIGUE_LEVEL_SCORES[transfer_level] * 0.35
        + FATIGUE_LEVEL_SCORES[transit_level] * 0.25
    )
    rounded_score = round(score, 2)

    return {
        "level": _classify_overall_fatigue(rounded_score),
        "score": rounded_score,
    }


# ----------------------------------------------------------------------
# 설명 가능성(explainability) 확장
# 멘토 피드백 3번: 피로도가 "어떤 기준으로" 정해졌는지 화면에서 설명할 수 있어야
# 합니다. 아래 함수는 요소별 값·등급·가중치·기여도를 그대로 노출합니다.
# ----------------------------------------------------------------------

FATIGUE_WEIGHTS: dict[str, float] = {
    "walking": 0.4,
    "transfer": 0.35,
    "transit": 0.25,
}

FATIGUE_THRESHOLDS: dict[str, str] = {
    "walking": "15분 이하 LOW · 35분 이하 MEDIUM · 초과 HIGH",
    "transfer": "0회 LOW · 1회 MEDIUM · 2회 이상 HIGH",
    "transit": "90분 이하 LOW · 180분 이하 MEDIUM · 초과 HIGH",
}

FATIGUE_FACTOR_LABELS: dict[str, str] = {
    "walking": "이동 도보",
    "transfer": "환승 횟수",
    "transit": "왕복 교통시간",
}


class FatigueFactor(TypedDict):
    key: str
    label: str
    value: int
    unit: str
    level: FatigueLevel
    levelScore: int
    weight: float
    contribution: float
    threshold: str


class FatigueBreakdown(TypedDict):
    level: FatigueLevel
    score: float
    factors: list[FatigueFactor]
    formula: str


def calculate_fatigue_breakdown(metrics: FatigueMetrics) -> FatigueBreakdown:
    """피로도 점수를 요소별 기여도까지 분해해 돌려줍니다."""

    levels: dict[str, FatigueLevel] = {
        "walking": classify_walking_burden(metrics["walkingMinutes"]),
        "transfer": classify_transfer_burden(metrics["transferCount"]),
        "transit": classify_round_trip_transit_burden(
            metrics["roundTripTransitMinutes"]
        ),
    }
    values: dict[str, int] = {
        "walking": metrics["walkingMinutes"],
        "transfer": metrics["transferCount"],
        "transit": metrics["roundTripTransitMinutes"],
    }
    units = {"walking": "분", "transfer": "회", "transit": "분"}

    factors: list[FatigueFactor] = []
    score = 0.0

    for key in ("walking", "transfer", "transit"):
        level_score = FATIGUE_LEVEL_SCORES[levels[key]]
        weight = FATIGUE_WEIGHTS[key]
        contribution = round(level_score * weight, 2)
        score += level_score * weight

        factors.append(
            FatigueFactor(
                key=key,
                label=FATIGUE_FACTOR_LABELS[key],
                value=values[key],
                unit=units[key],
                level=levels[key],
                levelScore=level_score,
                weight=weight,
                contribution=contribution,
                threshold=FATIGUE_THRESHOLDS[key],
            )
        )

    rounded_score = round(score, 2)

    return FatigueBreakdown(
        level=_classify_overall_fatigue(rounded_score),
        score=rounded_score,
        factors=factors,
        formula="도보(0.4) + 환승(0.35) + 왕복교통(0.25) 가중합, 1.5 미만 LOW · 2.35 미만 MEDIUM · 이상 HIGH",
    )
