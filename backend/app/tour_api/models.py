from typing import Any

from pydantic import BaseModel, Field


class TourApiItem(BaseModel):
    contentId: str | None = None
    contentTypeId: str | None = None
    title: str | None = None
    addr1: str | None = None
    addr2: str | None = None
    areaCode: str | None = None
    sigunguCode: str | None = None
    mapX: float | None = None
    mapY: float | None = None
    firstImage: str | None = None
    firstImage2: str | None = None
    tel: str | None = None
    createdTime: str | None = None
    modifiedTime: str | None = None
    copyrightType: str | None = None
    raw: dict[str, Any] = Field(default_factory=dict)


class TourApiListResponse(BaseModel):
    source: str = "KTO_TOUR_API"
    endpoint: str
    pageNo: int
    numOfRows: int
    totalCount: int
    items: list[TourApiItem] = Field(default_factory=list)

