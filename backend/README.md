# Backend

검증된 코스 조회와 추천 API를 담당합니다.

FastAPI로 API를 제공하며, 코스 데이터와 추천 규칙은 API 전달 계층과
분리합니다. 제품 명세에 없는 코스를 임의로 생성하지 않습니다.

## FastAPI 실행

```bash
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload
```

주요 엔드포인트:

- `GET /health`
- `GET /api/courses/{course_id}`

## 이동 피로도 계산

`src/recommendations/fatigue.ts`는 총 도보시간, 환승 횟수, 왕복 포함 총
이동시간을 기준으로 이동 피로도를 계산합니다.

- 총 도보시간: 15분 이하 `LOW`, 15~35분 `MEDIUM`, 35분 초과 `HIGH`
- 환승 횟수: 0회 `LOW`, 1회 `MEDIUM`, 2회 이상 `HIGH`
- 왕복 이동시간: 90분 이하 `LOW`, 90~180분 `MEDIUM`, 180분 초과 `HIGH`

종합 점수는 도보 40%, 환승 35%, 왕복 이동시간 25% 가중치로 계산합니다.
점수는 1에 가까울수록 낮은 부담, 3에 가까울수록 높은 부담입니다.

`src/recommendations/candidate.ts`는 이동 수치가 있는 코스 후보에
`fatigueLevel`, `fatigueScore`, `fatigueFactors`를 자동으로 붙입니다.
실제 코스 데이터가 확정되면 코스별 도보시간, 환승 횟수, 왕복 이동시간만
채우고 이 함수를 통과시키면 됩니다.

## 추천 후보 필터링

`src/recommendations/filtering.ts`는 추천 점수 계산 전에 이용 불가능한 코스를
제외합니다.

- 선택한 출발지에서 출발할 수 없는 코스 제외
- 선택한 가능 시간을 초과하는 코스 제외
- 당일 귀가 가능성이 검증되지 않은 코스 제외

기본 가능 시간은 `SIX_HOURS` 360분, `FULL_DAY` 720분입니다. 하루 종일의
시간 기준이 바뀌면 `durationLimits` 옵션으로 덮어쓸 수 있습니다. 제외된
코스는 `UNSUPPORTED_DEPARTURE`, `TIME_LIMIT_EXCEEDED`,
`RETURN_NOT_FEASIBLE` 사유를 함께 반환합니다.

## 추천 순위 산정

`src/recommendations/ranking.ts`는 하드 필터를 통과한 코스 후보를 같은
기준으로 점수화하고 높은 점수순으로 정렬합니다.

- 취향 일치도 40%: 사용자가 선택한 취향 중 코스 취향 태그와 일치한 비율
- 이동 부담 적합도 30%: 이동 피로도 점수를 0~1 점수로 변환한 값
- 지역 음식·문화 적합도 20%: 검증 데이터가 제공하는 0~1 점수
- 기록 적합도 10%: 장면 기록에 적합한 정도를 나타내는 0~1 점수

여행로그 패턴 점수는 MVP 데이터가 검증되기 전까지 순위 산정에 포함하지
않습니다. 데이터가 없는 근거를 임의로 점수화하지 않기 위해
`localResourceScore`와 `recordFitScore`는 반드시 0~1 범위의 값이어야 합니다.

```bash
node --experimental-strip-types --test backend/tests/*.test.ts
python -m unittest discover -s backend/tests -p "test_*.py"
```

## 코스 상세 API와 카카오맵 링크

`backend/app/main.py`는 FastAPI 앱을 정의합니다. `GET /api/courses/{course_id}`는
코스 상세 정보를 반환하고, 없는 코스 ID에는 404를 반환합니다.

`backend/app/courses/kakao_map.py`는 Kakao 지도 URL 패턴을 사용해 장소 보기와
길찾기 링크를 생성합니다.

- 장소 보기: `https://map.kakao.com/link/map/{이름},{위도},{경도}`
- 길찾기: `https://map.kakao.com/link/to/{이름},{위도},{경도}`

현재 `backend/app/courses/data.py`의 코스 데이터는 프론트엔드 mock data와 맞춘
MVP seed data입니다. 실제 코스 담당자가 검증한 좌표와 장소 ID를 제공하면 이
파일을 코스 DB 또는 저장소 연동으로 교체합니다.
