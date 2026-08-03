# 길담 백엔드 최종 구현 설명서

이 문서는 길담 백엔드 구현 내용을 처음 보는 사람도 이해하고, 해커톤 발표에서
설명할 수 있도록 정리한 최종 설명서다.

## 1. 백엔드가 맡은 역할

길담은 "차 없이 광주에서 전남 당일치기 여행을 실제로 갈 수 있는가"를 먼저
판단하는 서비스다. 백엔드는 이 판단을 위해 다음 다섯 가지를 담당한다.

1. 시간 초과, 귀가 불가 코스 필터링
2. 이동 피로도 계산
3. 취향별 추천 순위 산정
4. 추천 코스 상세 API
5. Kakao 지도 장소 보기와 길찾기 링크 생성

핵심 원칙은 단순하다.

```text
AI가 새로운 코스를 즉석에서 만들지 않는다.
검증된 코스 데이터 안에서만 필터링하고 점수화한다.
추천 이유와 이동 수치를 사용자에게 설명 가능한 형태로 제공한다.
```

## 2. 전체 구조

현재 백엔드는 두 축으로 구성되어 있다.

```text
backend/
├─ src/recommendations/          추천 엔진 순수 로직
│  ├─ filtering.ts              시간, 출발지, 귀가 가능성 필터
│  ├─ fatigue.ts                이동 피로도 계산
│  ├─ candidate.ts              코스 후보에 피로도 결과 부착
│  └─ ranking.ts                취향별 추천 점수와 정렬
├─ app/                          FastAPI API 서버
│  ├─ main.py                   FastAPI 앱과 route
│  ├─ courses/
│     ├─ data.py                MVP 코스 상세 seed data
│     ├─ fatigue.py             상세 API 응답용 피로도 계산
│     ├─ kakao_map.py           Kakao 지도 URL 생성
│     ├─ models.py              API 응답 모델
│     └─ service.py             상세 조회 조립 로직
│  └─ recommendations/
│     ├─ models.py              추천 목록 API 요청/응답 모델
│     └─ service.py             추천 필터링과 순위 산정
└─ tests/                        TypeScript, Python 테스트
```

`src/recommendations/`는 추천 목록을 만들기 위한 엔진이다. 같은 규칙은
FastAPI의 `backend/app/recommendations/`에도 반영되어 프론트 추천 결과 화면에서
실제로 호출할 수 있다.

`app/`은 실제 FastAPI 서버다. 현재 구현된 API는 추천 목록 조회와 코스 상세
조회이고, 응답에 자동 계산된 이동 피로도와 Kakao 지도 링크를 포함한다.

## 3. 추천 흐름

추천 목록은 다음 순서로 처리하도록 설계되어 있다.

```text
사용자 조건 입력
→ 검증된 코스 seed data 조회
→ 하드 필터링
→ 이동 피로도 계산
→ 취향 기반 추천 점수 계산
→ 1순위와 대안 코스 반환
```

여기서 하드 필터링은 점수 계산보다 먼저 일어난다. 갈 수 없는 코스는 낮은 점수를
주는 것이 아니라 후보에서 제외한다.

## 4. 시간 초과, 귀가 불가 코스 필터링

파일: `backend/src/recommendations/filtering.ts`

필터링은 사용자가 선택한 조건으로 실제 추천 후보가 될 수 없는 코스를 먼저
제외한다.

제외 기준:

| 기준 | 설명 | 제외 사유 코드 |
|---|---|---|
| 출발지 불일치 | 선택한 출발지에서 시작할 수 없는 코스 | `UNSUPPORTED_DEPARTURE` |
| 가능 시간 초과 | 선택한 가능 시간보다 오래 걸리는 코스 | `TIME_LIMIT_EXCEEDED` |
| 귀가 불가 | 당일 귀가 가능성이 검증되지 않은 코스 | `RETURN_NOT_FEASIBLE` |

기본 시간 기준:

- `SIX_HOURS`: 360분
- `FULL_DAY`: 720분

필터링 함수는 통과한 후보만 반환하지 않고, 제외된 코스와 사유도 함께 반환한다.
그래서 결과 없음 화면이나 운영 로그에서 "왜 추천되지 않았는지"를 설명할 수 있다.

## 5. 이동 피로도 계산

파일:

- `backend/src/recommendations/fatigue.ts`
- `backend/app/courses/fatigue.py`

이동 피로도는 세 가지 수치로 계산한다.

| 항목 | LOW | MEDIUM | HIGH |
|---|---:|---:|---:|
| 총 도보시간 | 15분 이하 | 15-35분 | 35분 초과 |
| 환승 횟수 | 0회 | 1회 | 2회 이상 |
| 왕복 이동시간 | 90분 이하 | 90-180분 | 180분 초과 |

가중치:

- 총 도보시간: 40%
- 환승 횟수: 35%
- 왕복 이동시간: 25%

각 항목은 `LOW=1`, `MEDIUM=2`, `HIGH=3`으로 환산한다. 최종 피로도 점수는
가중합으로 계산한다.

```text
fatigueScore =
  도보 점수 * 0.40
  + 환승 점수 * 0.35
  + 왕복 이동시간 점수 * 0.25
```

최종 등급:

- `score < 1.5`: `LOW`
- `1.5 <= score < 2.35`: `MEDIUM`
- `score >= 2.35`: `HIGH`

예시:

```text
담양 느린 산책 코스
도보 24분 → MEDIUM → 2점
환승 1회 → MEDIUM → 2점
왕복 이동 130분 → MEDIUM → 2점

최종 점수 = 2.0
최종 등급 = MEDIUM
```

## 6. 취향별 추천 순위 산정

파일: `backend/src/recommendations/ranking.ts`

하드 필터를 통과한 코스는 설명 가능한 가중합 방식으로 순위를 매긴다.

| 기준 | 가중치 | 계산 방식 |
|---|---:|---|
| 취향 일치도 | 40% | 선택한 취향 중 코스 취향 태그와 일치한 비율 |
| 이동 부담 적합도 | 30% | 피로도 점수를 낮을수록 좋은 0-1 점수로 변환 |
| 지역 음식·문화 적합도 | 20% | 검증 데이터가 제공하는 0-1 점수 |
| 기록 적합도 | 10% | 장면 기록에 적합한 정도를 나타내는 0-1 점수 |

이동 부담 적합도는 아래처럼 변환한다.

```text
mobilityScore = (3 - fatigueScore) / 2
```

예시:

- `fatigueScore = 1.0` → `mobilityScore = 1.0`
- `fatigueScore = 2.0` → `mobilityScore = 0.5`
- `fatigueScore = 3.0` → `mobilityScore = 0.0`

여행로그 패턴 점수는 MVP 단계에서는 제외했다. 아직 실제 여행로그 데이터가
검증되지 않았기 때문에, 없는 근거를 추천 점수에 넣지 않는 것이 더 정직하고
설명 가능하다.

## 7. 추천 목록 API와 추천 코스 상세 API

추천 목록 API:

```text
POST /api/recommendations
```

요청으로 `departure`, `duration`, `preferences`를 받는다. 서버는 코스 seed data에
추천 메타데이터를 붙여 출발지, 가능 시간, 귀가 가능성을 먼저 필터링하고, 남은
후보에 이동 피로도와 취향별 추천 점수를 계산한다. 응답은 추천된 `courses`와
제외된 코스의 사유를 담은 `exclusions`를 함께 반환한다.

프론트 추천 결과 화면은 이 API를 호출한다.

```text
조건 선택 화면
→ POST /api/recommendations
→ 추천 목록 화면
```

파일:

- `backend/app/main.py`
- `backend/app/courses/service.py`
- `backend/app/courses/models.py`
- `backend/app/courses/data.py`

상세 조회 API:

```http
GET /api/courses/{course_id}
```

예시:

```http
GET /api/courses/damyang-slow-walk
```

동작:

1. `course_id`로 MVP seed data에서 코스를 찾는다.
2. 코스의 도보시간, 환승 횟수, 왕복 이동시간으로 피로도를 계산한다.
3. 대표 목적지 좌표를 사용해 Kakao 지도 링크를 생성한다.
4. 프론트 상세 화면에서 필요한 정보를 한 번에 반환한다.
5. 없는 코스 ID는 `404 Course not found.`를 반환한다.

대표 응답 필드:

```json
{
  "id": "damyang-slow-walk",
  "title": "담양 느린 산책 코스",
  "region": "담양",
  "fatigueLevel": "MEDIUM",
  "fatigueScore": 2.0,
  "durationMinutes": 360,
  "walkingMinutes": 24,
  "transferCount": 1,
  "roundTripTransitMinutes": 130,
  "recommendationReasons": [
    "자연·산책 취향과 주요 장소가 잘 맞아요.",
    "환승이 1회로 비교적 단순해요.",
    "국수거리에서 지역 음식을 즐길 수 있어요."
  ],
  "itinerary": [],
  "localFood": [],
  "localPoints": [],
  "scenePrompts": [],
  "kakaoMapUrl": "https://map.kakao.com/link/map/...",
  "kakaoDirectionsUrl": "https://map.kakao.com/link/to/..."
}
```

실제 응답의 `itinerary`, `localFood`, `localPoints`, `scenePrompts`는 seed data에
있는 값이 채워진다.

## 8. Kakao 지도 링크 구현

파일: `backend/app/courses/kakao_map.py`

MVP에서는 Kakao REST API를 호출하지 않는다. 대신 Kakao 지도 URL 패턴을 사용한다.
이 방식은 API key가 필요 없고, 프론트에서는 받은 URL을 버튼 링크로 열기만 하면
된다.

사용한 URL 패턴:

```text
장소 보기:
https://map.kakao.com/link/map/{장소명},{위도},{경도}

길찾기:
https://map.kakao.com/link/to/{장소명},{위도},{경도}
```

예시:

```text
https://map.kakao.com/link/map/%EB%8B%B4%EC%96%91%20%EA%B4%80%EB%B0%A9%EC%A0%9C%EB%A6%BC,35.3216,126.9865
https://map.kakao.com/link/to/%EB%8B%B4%EC%96%91%20%EA%B4%80%EB%B0%A9%EC%A0%9C%EB%A6%BC,35.3216,126.9865
```

구현 세부사항:

- 장소명은 URL path segment로 안전하게 인코딩한다.
- 위도와 경도는 유한한 숫자인지 검사한다.
- 좌표는 불필요한 0을 제거해 짧고 안정적인 문자열로 만든다.
- 빈 검색어 또는 빈 장소명은 `ValueError`로 막는다.

## 9. API 실행 방법

PowerShell 기준:

```powershell
cd "C:\Users\limjm\OneDrive\ドキュメント\길담\Gildam"
python -m pip install -r backend\requirements.txt
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

브라우저에서 확인:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/api/courses/damyang-slow-walk
http://127.0.0.1:8000/docs
```

PowerShell에서 확인:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/courses/damyang-slow-walk" |
  ConvertTo-Json -Depth 10
```

## 10. 검증 방법

FastAPI와 Kakao 링크 테스트:

```bash
python -m unittest discover -s backend/tests -p "test_*.py"
```

추천 엔진 테스트:

```bash
node --experimental-strip-types --test backend/tests/*.test.ts
```

검증 내용:

- 정상 코스 상세 조회는 `200`을 반환한다.
- 정상 추천 목록 조회는 `200`을 반환한다.
- 추천 목록 응답은 필터링 후 순위가 계산된 `courses`를 포함한다.
- 없는 코스는 `404`를 반환한다.
- 상세 응답에 계산된 `fatigueLevel`, `fatigueScore`가 포함된다.
- Kakao 장소 보기와 길찾기 링크가 올바른 URL 패턴으로 생성된다.
- 기존 필터링, 피로도 계산, 추천 순위 산정 테스트도 통과한다.

## 11. 발표용 설명 흐름

발표에서는 아래 순서로 설명하면 된다.

1. "길담 백엔드는 검증된 코스 안에서 실제로 갈 수 있는 코스만 추천합니다."
2. "먼저 출발지, 가능 시간, 귀가 가능성으로 불가능한 코스를 제거합니다."
3. "남은 코스는 도보시간, 환승 횟수, 왕복 이동시간으로 이동 피로도를 계산합니다."
4. "그 다음 취향 일치도와 이동 부담, 지역성, 기록 적합도를 가중합해 순위를 정합니다."
5. "사용자가 코스를 선택하면 FastAPI 상세 API가 일정, 지역 음식, 로컬 포인트,
   오늘 담아볼 장면을 반환합니다."
6. "마지막 이동 행동은 Kakao 지도 링크로 연결합니다. 앱 안에서 지도를 직접 구현하지
   않고, 장소 보기와 길찾기 URL을 제공해 MVP 범위를 지켰습니다."

짧은 발표 문장:

```text
백엔드는 코스를 새로 생성하지 않고 검증된 6개 코스 seed data 안에서 작동합니다.
시간 초과와 귀가 불가 코스는 먼저 제외하고, 남은 코스에 대해 이동 피로도와
취향 점수를 계산합니다. 상세 API는 선택된 코스의 일정, 지역 음식, 로컬 포인트,
기록 장면과 Kakao 지도 링크를 반환해서 사용자가 바로 이동 판단을 할 수 있게
합니다.
```

## 12. 현재 한계와 다음 작업

현재 구현은 MVP seed data 기반이다. 다음 단계에서 실제 코스 담당자가 검증한
데이터가 들어오면 아래 작업을 하면 된다.

- `backend/app/courses/data.py`를 실제 DB 또는 JSON 데이터 저장소로 교체
- Kakao 장소 ID가 확보되면 URL 정확도 개선
- CI에서 Python 테스트와 Node 테스트를 함께 실행

현재 구조는 이 확장을 위해 계산 로직, 데이터, API 응답 조립을 분리해두었다.
