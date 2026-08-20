from pydantic import BaseModel, Field, field_validator

from backend.app.recommendations.models import MobilityId, PreferenceId


class AiPreferenceInterpretationRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)

    @field_validator("text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("text must not be blank")
        return stripped


class AiPreferenceInterpretationResponse(BaseModel):
    preferences: list[PreferenceId]
    mobility: MobilityId

    @field_validator("preferences")
    @classmethod
    def deduplicate_preferences(
        cls, values: list[PreferenceId]
    ) -> list[PreferenceId]:
        return list(dict.fromkeys(values))
