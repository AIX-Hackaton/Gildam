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
