from typing import Literal

from pydantic import BaseModel, Field

TrafficStatus = Literal["NORMAL", "TIGHT", "BLOCKED", "UNKNOWN"]
TrafficSnapshotStatus = Literal["NORMAL", "DELAYED", "BLOCKED", "UNKNOWN"]
TrafficWarningSeverity = Literal["info", "warning", "blocking"]
TrafficWarningCode = Literal[
    "REALTIME_TRAFFIC_TIGHT",
    "REALTIME_TRAFFIC_BLOCKED",
    "REALTIME_TRAFFIC_UNKNOWN",
]


class TrafficWarning(BaseModel):
    code: TrafficWarningCode
    message: str
    severity: TrafficWarningSeverity


class TrafficSnapshot(BaseModel):
    """Raw provider result before recommendation rules are applied."""

    status: TrafficSnapshotStatus
    provider: str
    message: str | None = None
    checkedAt: str | None = None
    affectedSegmentId: str | None = None
    delayMinutes: int = 0
    expectedArrivalMinutes: int | None = None
    raw: dict[str, object] = Field(default_factory=dict)


class TrafficEvaluation(BaseModel):
    status: TrafficStatus
    provider: str
    checkedAt: str | None = None
    affectedSegmentId: str | None = None
    delayMinutes: int = 0
    projectedTotalMinutes: int | None = None
    projectedSlackMinutes: int | None = None
    warnings: list[TrafficWarning] = Field(default_factory=list)

