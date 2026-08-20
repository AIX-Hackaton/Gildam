from __future__ import annotations

import json
import logging
import os
import time
from collections.abc import Iterator
from typing import Any
from urllib.parse import quote

import httpx
from pydantic import ValidationError

from backend.app.ai_preferences.models import AiPreferenceInterpretationResponse

DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_MODEL = "gemini-3.7-flash"
DEFAULT_TIMEOUT_SECONDS = 15.0
logger = logging.getLogger("gildam.ai_preferences")

PREFERENCE_CODES = [
    "NATURE_WALK",
    "HISTORY_CULTURE",
    "FOOD_MARKET",
    "MEMORY",
]
MOBILITY_CODES = ["MIN_TRANSFER", "LOW_BURDEN", "ANY"]

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "preferences": {
            "type": "array",
            "items": {"type": "string", "enum": PREFERENCE_CODES},
        },
        "mobility": {"type": "string", "enum": MOBILITY_CODES},
    },
    "required": ["preferences", "mobility"],
}

SYSTEM_INSTRUCTION = """당신은 길담의 여행 조건 분류기입니다.
사용자의 한국어 문장을 허용된 코드로만 분류하세요.

취향 코드:
- NATURE_WALK: 자연, 풍경, 정원, 산책 자체를 즐기고 싶다는 취향
- HISTORY_CULTURE: 역사, 전통, 고택, 오래된 거리, 문화 공간 취향
- FOOD_MARKET: 지역 음식, 맛집, 시장 취향
- MEMORY: 사진, 기록, 감성적인 장면이나 골목 취향

이동 부담 코드:
- MIN_TRANSFER: 환승을 줄이거나 단순한 교통편을 명시적으로 원함
- LOW_BURDEN: 적게 걷기, 편한 이동, 체력 부담 감소를 명시적으로 원함
- ANY: 이동 방식에 관한 요구가 없음

문장에 드러난 취향만 preferences에 넣으세요. 단순히 '많이 걷기 싫다'고 한 것을
NATURE_WALK 취향으로 해석하지 마세요. 취향이 드러나지 않으면 빈 배열을 반환하세요.
환승 감소와 체력 부담 감소를 모두 요구하면 LOW_BURDEN을 선택하세요.
설명이나 추천 문장을 만들지 말고 지정된 JSON 구조만 반환하세요."""


class GeminiError(RuntimeError):
    """Base error for Gemini preference interpretation failures."""


class GeminiConfigurationError(GeminiError):
    """Raised when required Gemini settings are missing or rejected."""


class GeminiProviderError(GeminiError):
    """Raised when Gemini returns a non-success response."""


class GeminiTransportError(GeminiError):
    """Raised when Gemini cannot be reached."""


class GeminiInvalidResponseError(GeminiError):
    """Raised when Gemini returns an unusable structured response."""


class GeminiPreferenceClient:
    def __init__(
        self,
        *,
        api_key: str,
        model: str = DEFAULT_MODEL,
        base_url: str = DEFAULT_BASE_URL,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self._api_key = api_key.strip()
        self.model = model.strip() or DEFAULT_MODEL
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(timeout=timeout_seconds, transport=transport)

    @classmethod
    def from_env(cls) -> "GeminiPreferenceClient":
        raw_timeout = os.getenv("GEMINI_TIMEOUT_SECONDS")
        timeout = DEFAULT_TIMEOUT_SECONDS
        if raw_timeout:
            try:
                timeout = float(raw_timeout)
            except ValueError:
                timeout = DEFAULT_TIMEOUT_SECONDS

        return cls(
            api_key=os.getenv("GEMINI_API_KEY", ""),
            model=os.getenv("GEMINI_MODEL", DEFAULT_MODEL),
            base_url=os.getenv("GEMINI_API_BASE_URL", DEFAULT_BASE_URL),
            timeout_seconds=timeout,
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "GeminiPreferenceClient":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def interpret(self, text: str) -> AiPreferenceInterpretationResponse:
        if not self._api_key:
            raise GeminiConfigurationError("GEMINI_API_KEY is not configured.")

        encoded_model = quote(self.model, safe="")
        url = f"{self.base_url}/models/{encoded_model}:generateContent"
        payload = {
            "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
            "contents": [{"role": "user", "parts": [{"text": text}]}],
            "generationConfig": {
                "temperature": 0,
                "maxOutputTokens": 512,
                "responseMimeType": "application/json",
                "responseSchema": RESPONSE_SCHEMA,
            },
        }

        started = time.perf_counter()
        try:
            response = self._client.post(
                url,
                headers={"x-goog-api-key": self._api_key},
                json=payload,
            )
        except (httpx.TimeoutException, httpx.TransportError) as exc:
            logger.warning("gemini transport_error=%s", type(exc).__name__)
            raise GeminiTransportError("Gemini request failed.") from exc

        latency_ms = round((time.perf_counter() - started) * 1000, 1)
        logger.info(
            "gemini model=%s status=%s latency_ms=%s",
            self.model,
            response.status_code,
            latency_ms,
        )

        if response.status_code in {401, 403}:
            raise GeminiConfigurationError("Gemini credentials were rejected.")
        if not response.is_success:
            raise GeminiProviderError("Gemini returned a non-success response.")

        return self._parse_response(response)

    @staticmethod
    def _parse_response(response: httpx.Response) -> AiPreferenceInterpretationResponse:
        try:
            payload = response.json()
            candidates = payload["candidates"]
            parts = candidates[0]["content"]["parts"]
            raw_text = next(
                part["text"]
                for part in parts
                if isinstance(part, dict) and isinstance(part.get("text"), str)
            )
            parsed: Any = json.loads(_strip_json_fence(raw_text))
            return AiPreferenceInterpretationResponse.model_validate(parsed)
        except (KeyError, IndexError, StopIteration, TypeError, ValueError, ValidationError) as exc:
            raise GeminiInvalidResponseError(
                "Gemini returned an invalid structured response."
            ) from exc


def _strip_json_fence(value: str) -> str:
    stripped = value.strip()
    if not stripped.startswith("```"):
        return stripped

    lines = stripped.splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()


def get_gemini_preference_client() -> Iterator[GeminiPreferenceClient]:
    with GeminiPreferenceClient.from_env() as client:
        yield client
