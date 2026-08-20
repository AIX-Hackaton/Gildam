# 길담 백엔드 구현 설명서

이 문서는 현재 저장소의 FastAPI 구현을 기준으로 합니다. 과거 가상 코스 ID나
삭제된 TypeScript 추천 엔진을 설명하지 않습니다.

## 1. 백엔드의 역할

길담 백엔드는 Google Sheets schema v3.1 스냅샷 안에서 다음을 수행합니다.

1. 스키마와 데이터 계보를 검증합니다.
2. 노출 금지·출발지·요일·시간·이동 부담·취향 조건을 순서대로 적용합니다.
3. 최악 소요시간과 귀가 교통 유형을 분리해 귀가 가능성을 계산합니다.
4. 피로도와 추천 점수를 요소별 기여도까지 계산합니다.
5. 코스 상세, 출처, 구간별 카카오맵 링크를 반환합니다.
6. TourAPI를 서버에서 프록시해 후보 장소의 `contentId`와 원본 응답을 추적합니다.

```text
Google Sheets(정본)
→ backend/app/courses/data.py(읽기 전용 스냅샷)
→ schema.py / lineage.py
→ feasibility.py / fatigue.py / exposure.py
→ recommendations/service.py
→ FastAPI
→ React service layer와 화면
```

## 2. 현재 데이터 범위

| 구분 | 값 |
|---|---|
| 스키마 | v3.1 |
| 데이터 계보 최신 검토일 | 2026-08-19 |
| 주력 | 6개 내부 시연 코스 |
| 보류 | MP_NORMAL_01 1개 |
| 공개 가능 | 0개(`publishable=FALSE`) |
| 출발지 | 유스퀘어, 광주송정역 |
| 지역 | 담양, 나주, 목포 |

“검증 완료 6개”가 아니라 “주력 6개 내부 시연 코스 + 보류 1개”라고 설명해야
합니다. `BLOCKED`는 추천과 직접 URL에서 모두 숨깁니다.

## 3. 추천 파이프라인

파일: `backend/app/recommendations/service.py`

```text
스키마 통과 코스
→ 노출 정책(BLOCKED·비주력 제외)
→ 출발지·토요일·가능 시간
→ 귀가 가능성
→ 이동 부담
→ 취향 일치
→ 최대 3건 점수화·정렬
```

결과가 없으면 조건을 임의로 무시하지 않습니다. 시간·이동 부담·취향·출발지를
한 항목씩 바꿨을 때의 실제 가능 개수를 `suggestions`로 반환합니다.

## 4. 귀가 가능성과 귀가 교통

파일: `backend/app/courses/feasibility.py`

시간 산술과 교통 데이터 준비도를 분리합니다.

- 계획 소요시간이 허용 시간을 넘으면 `NOT_FEASIBLE`
- 계획은 가능하지만 최악값이 넘거나 여유가 30분 미만이면 `TIGHT`
- 그 외는 `FEASIBLE`
- 미확인 토요일 운행·이용일 회차는 INTERNAL에서 차단하지 않고
  `NEEDS_DAY_OF_CHECK`와 `2차 확인 필요` 메시지로 표시

귀가 교통은 시트의 마지막 구간을 다음 세 유형으로 보존합니다.

| 유형 | 예 | 판정 |
|---|---|---|
| `HEADWAY_SERVICE` | 담양311 주말 20분 배차 | 막차를 만들지 않고 당일 BIS 확인 |
| `SCHEDULED_SERVICE` | 나주 13:05, 대체 13:35·13:50 | 마지막 활동 뒤 탑승 가능한 계획·대체 회차 선택 |
| `RESERVATION_REQUIRED` | 목포 왕복 열차 | 이용일 왕복 예매와 역 복귀 여유 안내 |

`returnTransport.segmentId`는 시트 `교통 구간`의 실제 구간ID와 일치해야 합니다.

## 5. 이동 피로도

파일: `backend/app/courses/fatigue.py`

```text
피로도 = 도보 등급 × 0.40 + 환승 등급 × 0.35 + 왕복교통 등급 × 0.25
```

| 항목 | LOW | MEDIUM | HIGH |
|---|---:|---:|---:|
| 이동 도보 | 15분 이하 | 35분 이하 | 35분 초과 |
| 환승 | 0회 | 1회 | 2회 이상 |
| 왕복 교통 | 90분 이하 | 180분 이하 | 180분 초과 |

- 점수 1.5 미만: LOW
- 점수 2.35 미만: MEDIUM
- 그 이상: HIGH

계산 등급과 시트 등급이 다르면 더 높은 피로도를 선택하고 `/health`의
`fatigueMismatches`에 차이를 남깁니다.

## 6. 추천 점수

| 요소 | 가중치 | 근거 |
|---|---:|---|
| 취향 일치 | 0.40 | 선택 취향 중 코스 태그와 일치한 비율 |
| 이동 부담 | 0.30 | 피로도 점수를 0~1 적합도로 변환 |
| 귀가 여유 | 0.18 | 최악 소요시간 기준 여유와 판정 |
| 지역 자원 | 0.12 | 음식·로컬 포인트 두 범주의 충족률과 검증상태 |
| 기록 적합성 | 0.00 | 프론트엔드 호환 필드로만 유지하며 최종 점수에서는 제외 |

지역 자원은 레코드 개수를 세지 않습니다. 같은 값을 여러 행으로 나눈 코스가
유리해지는 데이터 입력 편향을 막기 위해 두 범주의 존재 여부만 사용합니다.

초기 기획의 A-DS05 여행로그 20%는 검증된 표본이 없어 현재 추천식에서 제외했습니다.

## 7. 데이터와 계보 검증

### 코스 스키마

```powershell
python -m backend.app.courses.schema
```

필수 필드, 범위 순서, 일정 합계, 도보 합계, 환승 수, 코스·일정 ID 중복,
출처 URL·확인일, 귀가 교통 유형과 구간 외래키를 검사합니다. 깨진 행은 추천에서
제외되고 `/health.schemaDiagnostics`에 남습니다.

### Track #1 계보

```powershell
python -m backend.app.courses.lineage
```

주제개요서의 A-DS01~A-DS19 전체를 등록하고 사용상태를 검사합니다. 원본 레코드
키·시트 안정 ID·코드·API·화면 경로가 모두 있는 데이터만 `TRACEABLE_USED`입니다.
현재 Track #1 실제 사용 실적은 0건이며, 이 사실을 숨기지 않습니다. 현재 코스는
12개 고유 보조 공식 출처를 사용합니다.

자세한 표: `docs/DATA_PROVENANCE.md`

## 8. API

### 실행

```powershell
python -m pip install -r backend\requirements.txt
$env:TOUR_API_SERVICE_KEY = "<공공데이터포털 일반 인증키>"
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### 확인 URL

- `GET /health` — 서버·스키마·계보 요약
- `GET /api/meta/conditions` — 출발지·시간·취향·이동 부담 선택지
- `GET /api/meta/data-lineage` — Track #1 원자료와 실제 소비처 전체
- `GET /api/tour/search?keyword=죽녹원` — TourAPI `searchKeyword2` 키워드 검색
- `GET /api/tour/nearby?mapX=126.9865&mapY=35.3216&radius=1000` — TourAPI `locationBasedList2`
- `GET /api/tour/places/{content_id}` — TourAPI `detailCommon2`
- `POST /api/recommendations` — 추천·제외 사유·조건 대안
- `GET /api/courses/NJ_LOW_01` — 코스 상세
- `GET /docs` — Swagger UI

대표 요청:

```powershell
$body = @{
  departure = "USQUARE"
  duration = "SIX_HOURS"
  preferences = @("HISTORY_CULTURE", "FOOD_MARKET")
  mobility = "MIN_TRANSFER"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/recommendations" `
  -Method Post `
  -ContentType "application/json; charset=utf-8" `
  -Body $body
```

## 9. 지도 연결

파일: `backend/app/courses/kakao_map.py`

- 출발지와 도착지를 함께 전달하는 카카오맵 URL을 생성합니다.
- 단일 목적지 링크뿐 아니라 일정 장소를 잇는 `routeLinks` 배열을 반환합니다.
- 각 일정 장소에는 개별 `mapUrl`을 제공합니다.
- 서버에서 Kakao REST API를 호출하거나 키를 저장하지 않습니다.

## 10. TourAPI 연결

파일: `backend/app/tour_api/client.py`

- 기본 URL은 `https://apis.data.go.kr/B551011/KorService2`입니다.
- 인증키는 `TOUR_API_SERVICE_KEY` 환경변수에서만 읽습니다. `.env.example`에는 빈 값만 둡니다.
- 모든 요청에 `serviceKey`, `MobileOS`, `MobileApp`, `_type=json`을 붙입니다.
- 이미 URL-encoded 된 일반 인증키는 이중 인코딩하지 않습니다.
- `detailCommon2`에는 삭제된 legacy 플래그(`defaultYN`, `firstImageYN`, `overviewYN` 등)를 보내지 않습니다.
- `response.header.resultCode == "0000"`만 성공으로 보고, 나머지는 구조화된 `502` 오류로 변환합니다.
- `response.body.items.item`이 단일 객체이든 배열이든 같은 `TourApiListResponse`로 정규화합니다.

운영 실행 전:

```powershell
$env:TOUR_API_SERVICE_KEY = "<공공데이터포털 일반 인증키>"
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

## 11. 디렉터리

```text
backend/app/
├─ main.py
├─ courses/
│  ├─ data.py          시트 스냅샷
│  ├─ schema.py        데이터 계약 검증
│  ├─ lineage.py       Track #1 레지스트리·계보
│  ├─ exposure.py      INTERNAL/PUBLIC 노출 정책
│  ├─ feasibility.py   시간·귀가 교통 판정
│  ├─ fatigue.py       피로도 산식
│  ├─ kakao_map.py     지도 링크
│  ├─ models.py        상세·계보 응답 모델
│  └─ service.py       상세 응답 조립
├─ tour_api/
│  ├─ client.py        TourAPI KorService2 호출·오류 매핑·정규화
│  └─ models.py        TourAPI 프록시 응답 모델
└─ recommendations/
   ├─ models.py
   └─ service.py
```

## 12. 전체 검증

```powershell
python -m backend.app.courses.schema
python -m backend.app.courses.lineage
python -m unittest discover -s backend/tests -t . -p "test_*.py"
python scripts/export_openapi.py --check
```

## 13. 발표용 한 문장

> 백엔드는 시트의 주력 6개 코스와 보류 1개를 스키마로 검증한 뒤, 출발지·시간·
> 이동 부담을 먼저 필터링하고 피로도와 5요소 추천 근거를 계산합니다. 귀가편은
> 배차형·계획 회차형·예약형으로 구분하며, Track #1 데이터는 원본 레코드부터
> 화면까지 추적되는 항목만 실제 사용으로 인정합니다.
