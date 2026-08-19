# Realtime Traffic Handoff

실시간 교통 연동은 전체 경로 재탐색이 아니라 **추천 후보의 귀가 교통 구간만**
확인하는 MVP 범위로 구현한다.

## Backend Changes

추가된 백엔드 구조:

- `backend/app/traffic/models.py`
  - `TrafficStatus`: `NORMAL`, `TIGHT`, `BLOCKED`, `UNKNOWN`
  - `TrafficSnapshot`: provider가 돌려주는 원본 상태
  - `TrafficEvaluation`: 추천 엔진이 사용하는 최종 교통 판정
  - `TrafficWarning`: UI 표시용 경고
- `backend/app/traffic/service.py`
  - TAGO 버스도착정보 provider
  - 귀가 구간 실시간 도착예정시간 조회
  - 지연분 계산
  - `NORMAL` / `TIGHT` / `BLOCKED` / `UNKNOWN` 판정
- `backend/app/recommendations/models.py`
  - 추천 코스에 `rank`, `trafficStatus`, `trafficWarnings`, `traffic` 추가
  - 제외 코스에 `trafficStatus` 추가
  - 제외 사유 `REALTIME_TRAFFIC_BLOCKED` 추가
  - `meta`에 실시간 교통 평가 카운트 추가
- `backend/app/recommendations/service.py`
  - 기본 추천 필터 통과 후 실시간 교통 평가 수행
  - `TIGHT`이면 추천 유지 + 경고 추가
  - `BLOCKED`이면 추천 제외 + 다음 후보 추천
  - `UNKNOWN`이면 추천 유지

계산식:

```text
delayMinutes = 실시간 도착예정시간 - 계획 대기시간
projectedTotalMinutes = plannedTotalMinutes + delayMinutes
projectedSlackMinutes = allowedMinutes - projectedTotalMinutes
```

판정 기준:

```text
NORMAL  = 실시간 교통 반영 후 여유 충분
TIGHT   = 실시간 지연 때문에 귀가 여유가 30분 미만
BLOCKED = 도착 예정 차량 없음 또는 가능 시간 초과
UNKNOWN = API 꺼짐, 키 없음, 정류소/노선 매핑 없음, API 장애
```

환경 변수:

```env
TRAFFIC_API_ENABLED=0
TRAFFIC_API_SERVICE_KEY=
TRAFFIC_API_TIMEOUT_SECONDS=5
TRAFFIC_TAGO_BUS_ARRIVAL_BASE_URL=https://apis.data.go.kr/1613000/ArvlInfoInqireService
```

실제 조회를 켜려면 코스 데이터의 `schedule.returnTransport.realtimeTraffic`에
TAGO 매핑이 필요하다.

```json
{
  "provider": "TAGO_BUS_ARRIVAL",
  "cityCode": "...",
  "nodeId": "...",
  "routeId": "...",
  "plannedWaitMinutes": 20
}
```

## Frontend To Do

프론트는 백엔드가 계산한 결과를 표시만 한다. 자체 교통 계산은 하지 않는다.

### 1. TIGHT이면 실시간 교통 주의 표시

조건:

```ts
course.returnFeasibility.status === 'TIGHT' || course.trafficStatus === 'TIGHT'
```

표시:

- 추천 카드에 `실시간 교통 주의`
- 상세 화면에도 같은 경고 표시
- 문구는 `course.trafficWarnings[0]?.message` 우선 사용
- 없으면 `course.returnFeasibility.messages`의 경고 문구 사용

### 2. BLOCKED 제외이면 제외 안내 표시

조건:

```ts
exclusion.trafficStatus === 'BLOCKED'
exclusion.reasons[0]?.code === 'REALTIME_TRAFFIC_BLOCKED'
```

표시:

- 결과 화면 상단에 `일부 코스는 실시간 교통 상황으로 제외됐어요`
- 제외 사유 상세가 필요하면 `exclusion.reasons[0].message` 사용
- `BLOCKED` 코스는 `courses`에 없으므로 카드로 렌더링하지 않는다.

### 3. 전체 추천 순위 표시

조건:

```ts
course.rank
```

표시:

- 추천 카드에 `1위`, `2위`, `3위` 표시
- 배열 index로 순위를 만들지 말고 백엔드의 `rank`를 사용
- 교통 문제로 기존 1순위가 제외되면 다음 후보가 `rank: 1`로 반환된다.

## API Response Fields

추천 코스:

```json
{
  "rank": 1,
  "id": "NJ_LOW_01",
  "trafficStatus": "TIGHT",
  "trafficWarnings": [
    {
      "code": "REALTIME_TRAFFIC_TIGHT",
      "message": "실시간 교통 지연 50분 반영 시 귀가 여유가 21분입니다.",
      "severity": "warning"
    }
  ],
  "returnFeasibility": {
    "status": "TIGHT"
  }
}
```

제외 코스:

```json
{
  "id": "NJ_LOW_01",
  "trafficStatus": "BLOCKED",
  "reasons": [
    {
      "code": "REALTIME_TRAFFIC_BLOCKED",
      "message": "실시간 교통 지연 반영 시 선택한 가능 시간을 넘습니다."
    }
  ]
}
```

## Verification

추가/보강된 테스트:

- 정상 조건에서 `NJ_LOW_01 -> DY_LOW_01` 순위 검증
- 조건 변경 시 실제 추천 순위 변경 검증
- 실시간 교통 `TIGHT`이면 추천 유지 + 경고 반환 검증
- 실시간 교통 `BLOCKED`이면 추천 제외 + 다음 후보 추천 검증

검증 명령:

```powershell
.\.venv\Scripts\python.exe scripts/export_openapi.py --check
.\.venv\Scripts\python.exe -m unittest discover backend/tests
```
