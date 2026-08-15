# 데이터 연동 기준 (Data Integration)

이 문서는 **화면에 보이는 모든 숫자가 어디서 왔는지**를 설명합니다.
멘토 피드백 1번(실데이터 기반 추천 흐름)과 4번(데이터 오류의 안전한 처리)에 대한 답입니다.

- 데이터 기준일: **2026-08-06**
- 스키마 버전: **v3.1**
- 원천: 길담 코스 검증 스프레드시트 (후보 장소 / 교통 구간 / 코스 일정 / 코스 요약 / 개발 JSON 탭)

---

## 1. 원천 → 코드 반영 경로

```
스프레드시트(정본)
   └─ 코스 요약 · 교통 구간 · 코스 일정 탭
        └─ backend/app/courses/data.py   ← 스냅샷 (손으로 옮기지 않고 탭 값을 그대로 전사)
             ├─ backend/app/courses/schema.py       정합성 검사 (v3.1)
             ├─ backend/app/courses/feasibility.py  귀가 가능성 판정
             ├─ backend/app/courses/fatigue.py      피로도 계산 + 설명
             ├─ backend/app/courses/exposure.py     노출 정책
             └─ backend/app/courses/kakao_map.py    지도/길찾기 링크
```

`data.py`는 **읽기 전용 스냅샷**입니다. 스프레드시트가 갱신되면 이 파일을 갱신하고
`python -m backend.app.courses.schema`로 검증한 뒤 커밋합니다.
Mock 데이터는 저장소에 존재하지 않습니다. (`frontend/src/data/mockCourses.ts`,
`mockCourseDetails.ts`는 삭제됨)

---

## 2. 현재 반영된 코스 7건

| 코스ID | 코스명 | 출발지 | 시간 | 계획(분) | 도보 | 환승 | 피로도 | 검증상태 | 노출등급 |
|---|---|---|---|---|---|---|---|---|---|
| DY_LOW_01 | 담양 읍내 저도보 산책 | 유스퀘어 | 6시간 | 354 (323~396) | 14 | 0 | MEDIUM | PARTIALLY_VERIFIED | MANUAL_REVIEW |
| DY_NORMAL_01 | 담양 대나무 문화 확장 | 유스퀘어 | 하루 | 462 (432~492) | 52 | 0 | HIGH | PARTIALLY_VERIFIED | DEMO_ONLY |
| NJ_LOW_01 | 나주 읍성·곰탕 저환승 | 유스퀘어 | 6시간 | 289 (279~299) | 35 | 0 | MEDIUM | PARTIALLY_VERIFIED | MANUAL_REVIEW |
| NJ_NORMAL_01 | 나주 읍성·영산포 역사 | 유스퀘어 | 하루 | 422 (392~452) | 28 | 2 | HIGH | PARTIALLY_VERIFIED | DEMO_ONLY |
| MP_LOW_01 | 목포역 근대역사·노적봉 | 광주송정역 | 6시간 | 359 (318~396) | 39 | 0 | HIGH | PARTIALLY_VERIFIED | MANUAL_REVIEW |
| MP_NORMAL_02 | 목포역 도보권 근대문화 확장 | 광주송정역 | 하루 | 423 (383~463) | 60 | 0 | HIGH | NEEDS_RECHECK | DEMO_ONLY |
| MP_NORMAL_01 | 목포 갓바위·자연사 (보류) | — | — | 420 | 41 | 2 | HIGH | NEEDS_RECHECK | **BLOCKED** |

괄호 안은 `(최소~최대)`로, 배차 간격과 지연을 반영한 범위입니다.
화면에는 계획값과 함께 최대값을 노출합니다.

---

## 3. 정합성 규칙 (schema v3.1)

`collect_course_problems()`가 코스 1건마다 아래를 검사하고, **하나라도 어기면 그 코스는
추천 후보에서 조용히 제외**됩니다. 앱은 죽지 않고, 제외 사실은 `/health`에 남습니다.

1. 필수 필드 존재 (`id`, `schemaVersion`, `totalMinutes`, `walkingMinutes`, `schedule`, `itinerary` …)
2. `schemaVersion == "3.1"`
3. 모든 범위값에서 `min ≤ plan ≤ max`
4. `sum(itinerary[].durationMinutes) == totalMinutes.plan`
5. `sum(도보 구간) == walkingMinutes.plan`
6. `itinerary`의 환승 표시 개수 == `transferCount`
7. `schedule`에 `lastReturnDeparture`와 그 검증상태 존재

검증: `python -m backend.app.courses.schema` (CI에서 자동 실행)

---

## 4. 귀가 가능성 판정

`feasibility.evaluate_return_feasibility(course, duration)`

- 허용 시간: `SIX_HOURS = 390분`(계획 6시간 + 지연 여유 30분), `FULL_DAY = 720분`
- 여유(`slackMinutes`)는 계획값이 아니라 **최악값(`totalMinutes.max`)** 기준으로 계산합니다.
- 시간 총량만 보지 않고, **마지막 일정 종료 시각이 막차 출발 시각보다 앞서는지**를 함께 검사합니다.
  (막차 시각 − (마지막 일정 종료 + `returnBufferMinutes`) ≥ 0)

| 상태 | 조건 |
|---|---|
| `FEASIBLE` | 최악값 기준으로도 여유가 30분 이상 |
| `TIGHT` | 계획값은 들어오지만 최악값 기준 여유가 30분 미만(음수 포함) |
| `NOT_FEASIBLE` | **계획값**이 허용 시간 초과 / 막차를 놓침 / 막차 정보 미확인 |

`NOT_FEASIBLE`은 추천 결과에서 제외됩니다. `TIGHT`은 제외하지 않되, 왜 빠듯한지를
화면에 그대로 표기합니다. (예: DY_LOW_01 — 계획 354분, 최악 396분, 여유 −6분)

막차 정보가 아예 없으면 "아마 될 것"으로 넘기지 않고 **추천에서 뺍니다.**

| confidence | 의미 |
|---|---|
| `CONFIRMED` | 막차 시각 공식 확인 완료 |
| `NEEDS_DAY_OF_CHECK` | 보수적 추정값 — 이용일 당일 재확인 필요 |
| `UNVERIFIED` | 확인 불가 → `NOT_FEASIBLE` 처리 |

> ⚠️ **현재 한계**: 담양 311(20:00), 나주(21:00), 목포(21:30) 막차 시각은 **보수적 추정값**이며
> `NEEDS_RECHECK` 상태입니다. 공식 시각표 확인 후 갱신해야 합니다.
> 화면에도 이 사실을 그대로 표기합니다.

---

## 5. 피로도 산식 (설명 가능성)

`fatigue.calculate_fatigue_breakdown()`

세 요소의 가중합이며, 화면에서 요소별 기여도와 임계값을 그대로 보여줍니다.

| 요소 | 가중치 | 구간 |
|---|---|---|
| 도보 시간 | 0.40 | ~20분 낮음 / ~40분 보통 / 40분 초과 높음 |
| 환승 횟수 | 0.35 | 0회 낮음 / 1회 보통 / 2회 이상 높음 |
| 총 이동 시간 | 0.25 | ~90분 낮음 / ~150분 보통 / 150분 초과 높음 |

**계산값과 스프레드시트 표기값이 다르면 더 보수적인(높은) 등급을 채택합니다.**
운영 판단(예: "저피로 표기 금지")을 코드가 임의로 뒤집지 않기 위해서입니다.
불일치 건은 `/health`의 `fatigueMismatches`에 그대로 노출됩니다. (현재 6건)

---

## 6. 노출 정책

`exposure.py` 한 곳에서만 판단하며, 추천 API와 상세 API가 같은 함수를 씁니다.

| 노출등급 | 추천 결과 | 직접 URL 접근 |
|---|---|---|
| `MANUAL_REVIEW` | 노출 | 가능 |
| `DEMO_ONLY` | 노출 (`GILDAM_EXPOSURE_MODE=INTERNAL`일 때) | 가능 |
| `BLOCKED` | **절대 노출 안 됨** | **404** |

- `GILDAM_EXPOSURE_MODE`: `INTERNAL`(기본) / `PUBLIC`
- MP_NORMAL_01은 낭만버스 22 토요일 배차 미확인으로 `BLOCKED`이며,
  조건 조합 전수 테스트로 어떤 경로로도 노출되지 않음을 검증합니다.
  (`test_blocked_course_never_appears_in_any_condition_combination`)
- 모든 코스가 `publishable=FALSE`이므로 대외 공개 전 재검증이 필요합니다.

---

## 7. 추천 순위 가중치

| 요소 | 가중치 | 설명 |
|---|---|---|
| 취향 일치 | 0.35 | 선택한 취향과 코스 태그의 겹침 |
| 이동 부담 | 0.30 | 도보·환승이 적을수록 높음 |
| 귀가 여유 | 0.15 | 막차까지 남는 시간 |
| 지역 자원 | 0.12 | 지역 음식·로컬 포인트 밀도 |
| 기록 적합성 | 0.08 | 사진·기록 포인트 |

`scoreBreakdown`으로 요소별 원점수·가중치·기여도가 응답에 포함되며, 합은 총점과 일치합니다.

---

## 8. 지도 링크

멘토 코멘트("카카오맵을 열면 출발지를 직접 입력해야 하고 도착지도 한 곳만 잡힘") 대응:

- `link/to/` 방식 대신 `sName/sX/sY` + `eName/eX/eY` 파라미터를 사용해 **출발지가 미리 채워진 상태**로 열립니다.
- 코스 전체 링크 하나가 아니라 **구간별 링크 배열(`routeLinks`)**을 제공합니다.
  (출발지 → 1번 장소 → 2번 장소 → … → 복귀)
- 각 구간마다 대중교통/도보 링크를 따로 제공합니다.

---

## 9. 갱신 절차

1. 스프레드시트에서 값 수정
2. `backend/app/courses/data.py` 스냅샷 갱신
3. `python -m backend.app.courses.schema` 통과 확인
4. `python -m unittest discover -s backend/tests -t . -p "test_*.py"`
5. 응답 스키마가 바뀌었다면 `python scripts/export_openapi.py`
6. 이 문서의 표와 한계 항목 갱신

---

## 10. 남은 데이터 리스크

| 항목 | 상태 |
|---|---|
| 교통 구간 약 49%가 `NEEDS_RECHECK` | 지도 실측 대기 |
| 막차 시각 3건 | 보수적 추정값, 공식 확인 필요 |
| MP_NORMAL_02 | `NEEDS_RECHECK` — 목포 2024-02 노선 개편 반영 검증 중 |
| MP_NORMAL_01 | `BLOCKED` 유지 |
| 311-1 지선 국도 노선 변경(2026-05) | 담양 코스 영향 모니터링 필요 |
| 전 코스 `publishable=FALSE` | 대외 공개 전 재검증 필요 |
