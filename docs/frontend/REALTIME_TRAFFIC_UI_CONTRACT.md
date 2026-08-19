# Realtime Traffic UI Contract

프론트엔드는 `POST /api/recommendations` 응답의 추천 순서와 실시간 교통 상태만
읽어 표시한다. 교통 판단은 백엔드가 끝낸다.

## 1. TIGHT 표시

추천 코스의 `returnFeasibility.status` 또는 `trafficStatus`가 `"TIGHT"`이면 카드와
상세에 `실시간 교통 주의`를 표시한다. `returnFeasibility.status`는 기존 일정 여유와
실시간 교통 반영 후 여유를 모두 포함한 최종 귀가 판정이고, `trafficStatus`는 실시간
교통 조회가 직접 만든 상태다.

사용 필드:

```ts
course.returnFeasibility.status === 'TIGHT' || course.trafficStatus === 'TIGHT'
course.trafficWarnings
course.returnFeasibility.status
```

표시 문구는 `trafficWarnings[0].message`를 우선 사용한다. 비어 있으면
`returnFeasibility.messages`의 TIGHT 안내를 사용한다.

## 2. BLOCKED 제외 표시

실시간 교통 문제로 제외된 코스는 `courses`에 포함되지 않고 `exclusions`에 남는다.

사용 필드:

```ts
exclusion.trafficStatus === 'BLOCKED'
exclusion.reasons[0].code === 'REALTIME_TRAFFIC_BLOCKED'
exclusion.reasons[0].message
```

결과 화면 상단에는 `일부 코스는 실시간 교통 상황으로 제외됐어요` 수준의 안내를
표시한다.

## 3. 전체 추천 순위 표시

추천 코스는 백엔드가 정렬한 순서 그대로 표시한다. 각 코스의 `rank`를 순위 뱃지나
텍스트에 사용한다.

사용 필드:

```ts
course.rank
course.id
course.title
```

교통 문제로 1순위 후보가 제외되면 다음 후보가 `rank: 1`로 반환된다.

## Response Shape

```json
{
  "courses": [
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
  ],
  "exclusions": [
    {
      "id": "NJ_LOW_01",
      "trafficStatus": "BLOCKED",
      "reasons": [
        {
          "code": "REALTIME_TRAFFIC_BLOCKED",
          "message": "귀가편 도착 예정 차량이 없습니다."
        }
      ]
    }
  ]
}
```
