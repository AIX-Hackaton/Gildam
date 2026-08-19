# Backend

길담 백엔드는 **검증된 코스 데이터(schema v3.1)**를 원천으로, 조건에 맞는 코스를 걸러내고
귀가 가능성을 검증하며, 왜 그 코스를 추천했는지 설명 가능한 형태로 반환합니다.

FastAPI로 구현되어 있고, 계산 규칙(피로도·귀가 가능성·노출 정책)은 프레임워크와 분리된
순수 함수로 두어 DB나 실제 API가 붙어도 그대로 재사용할 수 있습니다.

데이터가 어디서 왔고 어떤 규칙으로 검증되는지는 [`docs/DATA_INTEGRATION.md`](../docs/DATA_INTEGRATION.md),
Track #1 원자료의 실제 사용상태는 [`docs/DATA_PROVENANCE.md`](../docs/DATA_PROVENANCE.md)를 참고하세요.

## Quick Start

```bash
python -m pip install -r backend/requirements.txt
export TOUR_API_SERVICE_KEY="<공공데이터포털 일반 인증키>"
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001
```

확인 URL:

- `http://127.0.0.1:8001/health` — 서버 상태 + 데이터 정합성 요약
- `http://127.0.0.1:8001/api/meta/conditions` — 조건 선택지 정의
- `http://127.0.0.1:8001/api/meta/data-lineage` — Track #1 원자료→시트→코드→화면 계보
- `http://127.0.0.1:8001/api/tour/search?keyword=죽녹원` — TourAPI 키워드 검색
- `http://127.0.0.1:8001/api/courses/NJ_LOW_01`
- `http://127.0.0.1:8001/docs`

### 환경 변수

| 변수 | 기본값 | 설명 |
|---|---|---|
| `GILDAM_EXPOSURE_MODE` | `INTERNAL` | `PUBLIC`이면 `DEMO_ONLY` 코스도 숨깁니다. `BLOCKED`는 어느 모드에서도 노출되지 않습니다. |
| `GILDAM_ALLOWED_ORIGINS` | `http://localhost:5173` | 쉼표로 구분한 CORS 허용 오리진 |
| `GILDAM_DEMO_FAILURE` | (없음) | `1`이면 `?simulate=server_error\|not_found` 장애 주입 활성화 (시연용) |
| `TOUR_API_SERVICE_KEY` | (필수) | 공공데이터포털 TourAPI 일반 인증키. 코드와 프론트엔드에 저장하지 않습니다. |
| `TOUR_API_BASE_URL` | `https://apis.data.go.kr/B551011/KorService2` | TourAPI 4.0 KorService2 기본 URL |
| `TOUR_API_MOBILE_OS` | `WEB` | TourAPI 필수 파라미터 `MobileOS` |
| `TOUR_API_MOBILE_APP` | `Gildam` | TourAPI 필수 파라미터 `MobileApp` |
| `TOUR_API_TIMEOUT_SECONDS` | `8` | TourAPI 호출 타임아웃 |

## Tests

```bash
python -m backend.app.courses.schema                                   # 데이터 정합성
python -m backend.app.courses.lineage                                  # 데이터 계보 정합성
python -m unittest discover -s backend/tests -t . -p "test_*.py"       # 전체 테스트
python scripts/export_openapi.py --check                               # 명세 동기화 확인
```

검증 범위:

- 공식 귀가편 미확인 코스의 INTERNAL 조건부 추천과 2차 확인 경고
- 조건 조합 전수 테스트로 `BLOCKED` 코스 비노출 보장
- 귀가 가능성 판정(시간 초과는 제외, 이용일 귀가편은 2차 확인 경고)
- 이동 부담(mobility) 필터 반응성
- 스키마 위반 코스가 앱을 죽이지 않고 조용히 제외되는지
- 결과 없음일 때 실제로 가능한 대안 개수 산출
- 오류 응답 규격(`code`/`message`)과 장애 주입
- TourAPI 요청 파라미터 구성, 응답 정규화, provider 오류 처리

## API

### `GET /health`

서버 상태와 함께 **데이터 정합성 요약**을 반환합니다. 배포 후 데이터가 깨졌는지
바로 확인할 수 있게 하기 위한 것입니다.

```json
{
  "status": "ok",
  "dataSnapshotDate": "2026-08-19",
  "schemaVersion": "3.1",
  "managedCourseCount": 7,
  "primaryCourseCount": 6,
  "blockedCourseCount": 1,
  "publishableCourseCount": 0,
  "schemaInvalidCount": 0,
  "blockedCourseIds": ["MP_NORMAL_01"],
  "fatigueMismatches": [...],
  "dataLineage": {
    "catalogDatasetCount": 19,
    "traceableUsedCount": 0,
    "referenceOnlyCount": 1,
    "evidenceRequiredCount": 3,
    "lineageInvalidCount": 0
  }
}
```

`fatigueMismatches`는 계산된 피로도와 스프레드시트 표기값이 다른 코스입니다.
숨기지 않고 드러내며, 값 자체는 **더 보수적인 쪽**을 채택합니다.

### `GET /api/meta/conditions`

조건 선택지(출발지·시간·취향·이동 부담)의 단일 정의입니다. 프론트엔드 하드코딩이
백엔드와 어긋나는 것을 막습니다.

### `GET /api/meta/data-lineage`

주제개요서의 `A-DS01`~`A-DS19` 전체와 초기 기획의 선택 여부, 현재 실제 사용·증거 필요·
보류·범위외 상태, 시트→코드→API→화면 경로를 반환합니다. 원본 레코드 키가 없는
데이터는 `TRACEABLE_USED`로 표시하지 않습니다.

### `GET /api/courses/{course_id}`

코스 상세를 조회합니다. `?duration=SIX_HOURS|FULL_DAY`를 주면 그 조건 기준으로
귀가 가능성을 다시 판정합니다.

```bash
curl "http://127.0.0.1:8001/api/courses/NJ_LOW_01?duration=SIX_HOURS"
```

없는 코스와 **노출 등급이 `BLOCKED`인 코스는 모두 `404`**입니다. 직접 URL을 알아도
접근할 수 없습니다.

응답 주요 필드:

- 기본 정보: `id`, `schemaVersion`, `title`, `region`, `tags`
- 이동 정보: `durationMinutes`, `walkingMinutes`, `transferCount`,
  `totalMinutes`, `walkingMinutesRange`
- 피로도: `fatigueLevel`, `fatigueScore`, `fatigueExplanation`(요소별 기여도·임계값·산식)
- 귀가 가능성: `returnFeasibility`(상태, 신뢰도, 허용 시간, 최악값, 여유 시간,
  `returnTransport` 배차형·계획회차형·예약형)
- 데이터 근거: `verificationStatus`, `verifiedDate`, `manualChecks`, `cautions`, `sources`
- 지도: `kakaoMapUrl`, `kakaoDirectionsUrl`, `routeLinks`(구간별 링크 배열)
- 콘텐츠: `description`, `itinerary`, `localFood`, `localPoints`, `scenePrompts`
- 노출 안내: `exposureNotice`(내부 검토 중인 코스일 때만)

### TourAPI 프록시

서버가 `TOUR_API_SERVICE_KEY`를 보관하고 한국관광공사 TourAPI 4.0 `KorService2`를
호출합니다. 응답은 길담에서 쓰기 쉬운 필드(`contentId`, `contentTypeId`, `title`,
`addr1`, `mapX`, `mapY`, `firstImage`, `copyrightType`)로 정규화하고, 원본 레코드는
`raw`에 보존해 A-DS13 계보 증거로 남길 수 있게 했습니다.

```bash
curl "http://127.0.0.1:8001/api/tour/search?keyword=죽녹원&contentTypeId=12"
curl "http://127.0.0.1:8001/api/tour/nearby?mapX=126.9865&mapY=35.3216&radius=1000"
curl "http://127.0.0.1:8001/api/tour/places/126499"
```

- `/api/tour/search` → TourAPI `searchKeyword2`
- `/api/tour/nearby` → TourAPI `locationBasedList2` (`radius`는 최대 20km)
- `/api/tour/places/{content_id}` → TourAPI `detailCommon2`

TourAPI 인증키가 없으면 `503 TOUR_API_NOT_CONFIGURED`, TourAPI provider 오류나 네트워크
문제는 `502` 계열 구조화 오류로 반환합니다.

### `POST /api/recommendations`

```bash
curl -X POST http://127.0.0.1:8001/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"departure":"USQUARE","duration":"SIX_HOURS","preferences":["HISTORY_CULTURE","FOOD_MARKET"],"mobility":"MIN_TRANSFER"}'
```

요청값:

| 필드 | 값 |
|---|---|
| `departure` | `USQUARE`, `GWANGJU_SONGJEONG` |
| `duration` | `SIX_HOURS`, `FULL_DAY` |
| `preferences` | `NATURE_WALK`, `HISTORY_CULTURE`, `FOOD_MARKET`, `MEMORY` (1개 이상) |
| `mobility` | `MIN_TRANSFER`(환승 0회), `LOW_BURDEN`(도보 40분·환승 1회 이하), `ANY` |

응답:

- `courses` — 최대 3건. **모두 시간 안에 돌아올 수 있는 코스만** 들어갑니다.
- `exclusions` — 제외된 코스와 사유 코드
- `suggestions` — 결과가 없을 때, 조건을 하나씩 완화해 **실제로 가능한 개수를 계산한** 대안
- `meta` — 데이터 기준일, 평가한 코스 수, 노출 제외 수, 스키마 위반 수

제외 사유 코드:

`UNSUPPORTED_DEPARTURE`, `DAY_NOT_SUPPORTED`, `TIME_LIMIT_EXCEEDED`,
`RETURN_NOT_FEASIBLE`, `MOBILITY_LIMIT_EXCEEDED`, `PREFERENCE_MISMATCH`,
`BLOCKED_BY_EXPOSURE_POLICY`, `SCHEMA_INVALID`

## 오류 응답 규격

모든 오류는 같은 모양입니다. 프론트엔드가 코드로 분기할 수 있습니다.

```json
{ "code": "NOT_FOUND", "message": "요청한 코스를 찾을 수 없습니다.", "detail": null }
```

| 상태 | code |
|---|---|
| 404 | `NOT_FOUND` |
| 422 | `INVALID_REQUEST` |
| 502 | `TOUR_API_PROVIDER_ERROR`, `TOUR_API_UNAVAILABLE`, `TOUR_API_ERROR` |
| 503 | `TOUR_API_NOT_CONFIGURED` |
| 500 | `SERVER_ERROR` |

## Structure

```text
backend/
├─ app/
│  ├─ main.py                    앱 생성, 라우트, 오류 규격, health, 조건 메타
│  ├─ courses/
│  │  ├─ data.py                 스프레드시트 스냅샷 (주력 6건 + 보류 1건)
│  │  ├─ schema.py               데이터 정합성 검증 (+ CLI)
│  │  ├─ exposure.py             노출 정책 단일 판단 지점
│  │  ├─ feasibility.py          귀가 가능성 판정
│  │  ├─ lineage.py              Track #1 원자료 레지스트리·사용 계보 검증
│  │  ├─ fatigue.py              피로도 계산과 설명
│  │  ├─ kakao_map.py            지도·구간별 길찾기 링크
│  │  ├─ models.py               Pydantic 응답 모델
│  │  └─ service.py              조회와 응답 조립
│  ├─ tour_api/
│  │  ├─ client.py               TourAPI KorService2 호출·정규화
│  │  └─ models.py               TourAPI 프록시 응답 모델
│  └─ recommendations/
│     ├─ models.py               요청/응답 모델, 제외 사유·제안 코드
│     └─ service.py              6단계 추천 파이프라인
├─ tests/                        pytest/unittest 테스트
└─ requirements.txt
```

## Recommendation Pipeline

```text
검증된 코스 DB (schema v3.1)
→ ① 스키마 검증 통과 코스만 남김
→ ② 노출 정책 적용 (BLOCKED 제거)
→ ③ 출발지 / 운영 요일 필터
→ ④ 가능 시간 + 귀가 가능성 필터 (최악값 + 배차/계획회차/예약 정책)
→ ⑤ 이동 부담(mobility) 필터
→ ⑥ 취향 필터 후 가중 점수 산정
→ 상위 3건 + 제외 사유 + (없으면) 대안 제안
```

조건을 만족하는 코스가 없으면 **기준을 낮춰 억지로 채우지 않고 빈 목록을 반환**합니다.
대신 어떤 조건을 바꾸면 몇 개를 볼 수 있는지 계산해서 알려줍니다.

## Fatigue Calculation

| 항목 | LOW | MEDIUM | HIGH | 가중치 |
|---|---:|---:|---:|---:|
| 총 도보시간 | 15분 이하 | 15-35분 | 35분 초과 | 40% |
| 환승 횟수 | 0회 | 1회 | 2회 이상 | 35% |
| 왕복 교통시간 | 90분 이하 | 90-180분 | 180분 초과 | 25% |

점수는 1에 가까울수록 낮은 부담, 3에 가까울수록 높은 부담입니다.
계산값과 데이터 표기값이 다르면 **더 보수적인 쪽**을 채택하고, 차이는 `/health`에 남깁니다.

## Ranking

| 기준 | 가중치 |
|---|---:|
| 취향 일치도 | 35% |
| 이동 부담 적합도 | 30% |
| 귀가 여유 | 15% |
| 지역 자원 적합도 | 12% |
| 기록 적합도 | 8% |

`scoreBreakdown`에 요소별 원점수·가중치·기여도·설명이 모두 담기며, 가중 점수의 합은
`recommendationScore`와 일치합니다.

## Kakao Map Links

Kakao API 서버 호출 없이 지도 URL 패턴만 사용하므로 API key가 필요 없습니다.

- 장소 보기: `https://map.kakao.com/link/map/{이름},{위도},{경도}`
- 길찾기: `sName`/`sX`/`sY` + `eName`/`eX`/`eY` 파라미터로 **출발지가 미리 채워진** 링크

코스 전체 링크 하나가 아니라 `routeLinks`로 구간별(출발지→1번→2번→…→복귀) 링크를
제공하며, 구간마다 대중교통·도보 링크가 따로 있습니다.

## Data Replacement

`backend/app/courses/data.py`는 스프레드시트 스냅샷입니다. 갱신 절차는
[`docs/DATA_INTEGRATION.md`](../docs/DATA_INTEGRATION.md) 9절을 따르세요.
