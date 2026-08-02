from typing import Literal

from pydantic import BaseModel, Field, HttpUrl

FatigueLevel = Literal["LOW", "MEDIUM", "HIGH"]
ItineraryItemType = Literal["transport", "place", "food"]


class ItineraryItem(BaseModel):
    id: str
    name: str
    type: ItineraryItemType
    time: str | None = None
    durationMinutes: int | None = None
    note: str | None = None


class LocalFood(BaseModel):
    id: str
    name: str
    description: str
    tags: list[str] = Field(default_factory=list)


class LocalPoint(BaseModel):
    id: str
    title: str
    description: str
    tags: list[str] = Field(default_factory=list)


class CourseDestination(BaseModel):
    name: str
    latitude: float
    longitude: float


class CourseDetailResponse(BaseModel):
    id: str
    title: str
    region: str
    thumbnailUrl: str
    tags: list[str]
    fatigueLevel: FatigueLevel
    fatigueScore: float
    durationMinutes: int
    walkingMinutes: int
    transferCount: int
    roundTripTransitMinutes: int
    recommendationReasons: list[str]
    description: str
    itinerary: list[ItineraryItem]
    localFood: list[LocalFood]
    localPoints: list[LocalPoint]
    scenePrompts: list[str]
    primaryDestination: CourseDestination
    mapUrl: HttpUrl
    directionsUrl: HttpUrl
    kakaoMapUrl: HttpUrl
    kakaoDirectionsUrl: HttpUrl
