"""노출 정책.

시트 `00_가이드` 의 노출 원칙을 코드로 강제합니다.

- ``PUBLIC``        : 사용자 공개 가능
- ``MANUAL_REVIEW`` : 이용일 검증 후 공개 후보 (내부 시연에서는 노출)
- ``DEMO_ONLY``     : 개발 시연용 (내부 시연에서만 노출)
- ``BLOCKED``       : 추천 결과·사용자 테스트 표본에서 완전히 제외

MP_NORMAL_01처럼 ``isPrimary=False`` 이거나 ``exposureTier="BLOCKED"`` 인 코스는
어떤 조건 조합에서도 추천 결과에 나타나지 않아야 합니다. 이 판정은 한 곳에서만
수행하고, 추천 API와 상세 API가 동일한 함수를 사용합니다.
"""

import os
from typing import Any, Literal

ExposureTier = Literal["PUBLIC", "MANUAL_REVIEW", "DEMO_ONLY", "BLOCKED"]
ExposureMode = Literal["PUBLIC", "INTERNAL"]

#: 절대 노출 금지. 어떤 모드에서도 허용하지 않습니다.
HARD_BLOCKED_TIERS: frozenset[str] = frozenset({"BLOCKED"})

_ALLOWED_TIERS_BY_MODE: dict[str, frozenset[str]] = {
    # 실제 사용자 공개 모드: publishable=True 이고 PUBLIC 등급만 노출합니다.
    "PUBLIC": frozenset({"PUBLIC"}),
    # 해커톤 시연·팀 내부 QA 모드: 공개 직전·시연용까지 노출하되 BLOCKED는 제외합니다.
    "INTERNAL": frozenset({"PUBLIC", "MANUAL_REVIEW", "DEMO_ONLY"}),
}

DEFAULT_EXPOSURE_MODE: ExposureMode = "INTERNAL"


def get_exposure_mode() -> ExposureMode:
    """환경변수 ``GILDAM_EXPOSURE_MODE`` 로 노출 모드를 전환합니다."""

    raw = (os.getenv("GILDAM_EXPOSURE_MODE") or DEFAULT_EXPOSURE_MODE).upper()

    return "PUBLIC" if raw == "PUBLIC" else "INTERNAL"


def is_hard_blocked(course: dict[str, Any]) -> bool:
    """모드와 무관하게 절대 노출 금지인지 판단합니다."""

    if course.get("exposureTier") in HARD_BLOCKED_TIERS:
        return True

    # 주력여부=false 인 대체·보류 코스는 사용자 추천 후보가 아닙니다.
    return not course.get("isPrimary", False)


def is_recommendable(
    course: dict[str, Any], mode: ExposureMode | None = None
) -> bool:
    """추천 후보로 사용할 수 있는 코스인지 판단합니다."""

    if is_hard_blocked(course):
        return False

    effective_mode = mode or get_exposure_mode()
    allowed = _ALLOWED_TIERS_BY_MODE[effective_mode]

    if course.get("exposureTier") not in allowed:
        return False

    if effective_mode == "PUBLIC" and not course.get("publishable", False):
        return False

    return True


def is_directly_accessible(
    course: dict[str, Any], mode: ExposureMode | None = None
) -> bool:
    """URL 직접 입력으로 상세를 열 수 있는지 판단합니다.

    추천 후보와 동일한 정책을 사용합니다. BLOCKED 코스의 상세 URL을 직접 입력해도
    404로 응답해야 하며, 존재 여부를 흘리지 않습니다.
    """

    return is_recommendable(course, mode)


def build_exposure_notice(course: dict[str, Any]) -> dict[str, Any] | None:
    """공개 전 코스에 붙일 사용자 안내 문구를 만듭니다."""

    tier = course.get("exposureTier")

    if tier == "MANUAL_REVIEW":
        return {
            "tier": tier,
            "title": "이용일 확인이 필요한 코스입니다",
            "message": "교통·운영 정보가 날짜에 따라 달라질 수 있어, 아래 재확인 항목을 보고 출발해 주세요.",
        }

    if tier == "DEMO_ONLY":
        return {
            "tier": tier,
            "title": "검증 중인 시연용 코스입니다",
            "message": "일부 교통 구간이 공식 확인 전이라 실제 이용 전에는 반드시 현장 정보를 확인해 주세요.",
        }

    return None
