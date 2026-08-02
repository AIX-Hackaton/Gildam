# Backend

길담 백엔드는 검증된 코스 데이터를 기반으로 추천 후보를 걸러내고, 이동 피로도와
추천 순위를 계산하며, 코스 상세 정보와 Kakao 지도 링크를 제공한다.

현재 API 서버는 FastAPI로 구현되어 있다. 추천 계산 로직은 프레임워크와 분리된
순수 함수로 두어, 추후 DB나 실제 API가 붙어도 계산 규칙을 그대로 재사용할 수
있게 했다.

## Quick Start

```bash
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

확인 URL:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/api/courses/damyang-slow-walk`
- `http://127.0.0.1:8000/docs`

## Tests

```bash
node --experimental-strip-types --test backend/tests/*.test.ts
python -m unittest discover -s backend/tests -p "test_*.py"
```

현재 검증 범위:

- 시간 초과, 출발지 불일치, 귀가 불가 코스 필터링
- 이동 피로도 계산
- 취향 기반 추천 순위 산정
- 코스 상세 API
- Kakao 지도 장소 보기와 길찾기 링크 생성

## API

### `GET /health`

서버 상태 확인용 엔드포인트다.

```json
{
  "status": "ok"
}
```

### `GET /api/courses/{course_id}`

추천 코스 상세 정보를 조회한다. 없는 코스 ID는 `404`를 반환한다.

예시:

```bash
curl http://127.0.0.1:8000/api/courses/damyang-slow-walk
```

응답에는 다음 정보가 포함된다.

- 코스 기본 정보: `id`, `title`, `region`, `thumbnailUrl`, `tags`
- 이동 정보: `durationMinutes`, `walkingMinutes`, `transferCount`,
  `roundTripTransitMinutes`
- 자동 계산된 피로도: `fatigueLevel`, `fatigueScore`
- 상세 콘텐츠: `description`, `itinerary`, `localFood`, `localPoints`,
  `scenePrompts`
- 지도 연결: `mapUrl`, `directionsUrl`, `kakaoMapUrl`, `kakaoDirectionsUrl`

## Structure

```text
backend/
├─ app/                         FastAPI API 서버
│  ├─ main.py                   앱 생성, health, course detail route
│  └─ courses/
│     ├─ data.py                MVP seed course detail data
│     ├─ fatigue.py             상세 API 응답용 피로도 계산
│     ├─ kakao_map.py           Kakao 지도 URL 생성
│     ├─ models.py              Pydantic response models
│     └─ service.py             course_id 조회와 응답 조립
├─ src/recommendations/          추천 엔진 순수 로직
│  ├─ fatigue.ts                이동 피로도 계산
│  ├─ candidate.ts              코스 후보에 피로도 필드 자동 부착
│  ├─ filtering.ts              추천 후보 하드 필터링
│  └─ ranking.ts                취향 기반 추천 순위 산정
├─ tests/
│  ├─ *.test.ts                 추천 엔진 테스트
│  └─ test_*.py                 FastAPI와 Kakao 링크 테스트
└─ requirements.txt             FastAPI 실행 의존성
```

## Recommendation Flow

추천 목록을 만들 때의 의도된 흐름은 아래와 같다.

```text
검증된 코스 DB
→ 출발지, 가능 시간, 귀가 가능성 하드 필터
→ 이동 피로도 자동 계산
→ 취향, 이동 부담, 지역성, 기록 적합도 가중 점수 계산
→ 상위 1순위와 대안 코스 반환
```

상세 조회 API는 이미 선택된 코스의 정보를 보여주는 역할이다.

```text
course_id
→ seed data에서 코스 상세 조회
→ 이동 피로도 계산
→ Kakao 지도 링크 생성
→ 프론트 상세 화면용 응답 반환
```

## Filtering

`src/recommendations/filtering.ts`는 점수 계산 전에 이용 불가능한 코스를 제외한다.

- 선택한 출발지에서 출발할 수 없는 코스 제외
- 선택한 가능 시간을 초과하는 코스 제외
- 당일 귀가 가능성이 검증되지 않은 코스 제외

기본 가능 시간은 `SIX_HOURS` 360분, `FULL_DAY` 720분이다. 제외된 코스는 다음
사유를 함께 반환한다.

- `UNSUPPORTED_DEPARTURE`
- `TIME_LIMIT_EXCEEDED`
- `RETURN_NOT_FEASIBLE`

## Fatigue Calculation

이동 피로도는 총 도보시간, 환승 횟수, 왕복 포함 총 이동시간을 기준으로 계산한다.

| 항목 | LOW | MEDIUM | HIGH |
|---|---:|---:|---:|
| 총 도보시간 | 15분 이하 | 15-35분 | 35분 초과 |
| 환승 횟수 | 0회 | 1회 | 2회 이상 |
| 왕복 이동시간 | 90분 이하 | 90-180분 | 180분 초과 |

가중치:

- 도보시간 40%
- 환승 횟수 35%
- 왕복 이동시간 25%

점수는 1에 가까울수록 낮은 부담, 3에 가까울수록 높은 부담이다.

## Ranking

하드 필터를 통과한 후보는 아래 기준으로 0-1 점수화한다.

| 기준 | 가중치 | 설명 |
|---|---:|---|
| 취향 일치도 | 40% | 사용자가 선택한 취향 중 코스 태그와 일치한 비율 |
| 이동 부담 적합도 | 30% | 피로도 점수를 0-1 점수로 변환 |
| 지역 음식·문화 적합도 | 20% | 검증 데이터가 제공하는 0-1 점수 |
| 기록 적합도 | 10% | 장면 기록에 적합한 정도 |

여행로그 패턴 점수는 MVP 데이터가 검증되기 전까지 순위 산정에 포함하지 않는다.
없는 데이터를 근거처럼 쓰지 않기 위해 `localResourceScore`와 `recordFitScore`는
반드시 0-1 범위로 받는다.

## Kakao Map Links

MVP에서는 Kakao API 서버 호출을 하지 않고 Kakao 지도 URL 패턴을 사용한다.
따라서 별도 API key가 필요 없다.

- 장소 보기: `https://map.kakao.com/link/map/{이름},{위도},{경도}`
- 길찾기: `https://map.kakao.com/link/to/{이름},{위도},{경도}`

`backend/app/courses/kakao_map.py`는 장소명을 URL 인코딩하고, 좌표가 유효한지
검증한 뒤 링크를 생성한다.

## Data Replacement

현재 `backend/app/courses/data.py`는 프론트엔드 mock data와 맞춘 MVP seed data다.
실제 코스 담당자가 검증한 아래 정보가 들어오면 이 파일을 DB 또는 별도 데이터
저장소로 교체하면 된다.

- 코스 ID, 제목, 지역, 이미지
- 총 소요시간, 도보시간, 환승 횟수, 왕복 이동시간
- 귀가 가능 여부
- 대표 목적지 이름, 위도, 경도
- 일정 타임라인
- 지역 음식, 로컬 포인트, 오늘 담아볼 장면

상세 설명서는 `docs/backend/IMPLEMENTATION_GUIDE.md`를 참고한다.
