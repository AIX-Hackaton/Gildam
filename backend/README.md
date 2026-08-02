# Backend

검증된 코스 조회와 추천 API를 담당합니다.

기술 스택이 정해지기 전에는 프레임워크 초기화 파일을 추가하지 않습니다.
코스 데이터와 추천 규칙은 API 전달 계층과 분리하며, 제품 명세에 없는 코스를
임의로 생성하지 않습니다.

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

```bash
node --experimental-strip-types --test backend/tests/*.test.ts
```
