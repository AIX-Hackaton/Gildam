# 데이터 연동 기준 (Data Integration)

이 문서는 **화면에 보이는 모든 숫자가 어디서 왔는지**를 설명합니다.
멘토 피드백 1번(실데이터 기반 추천 흐름)과 4번(데이터 오류의 안전한 처리)에 대한 답입니다.

- 데이터 계보 최신 검토일: **2026-08-19**
- 코스·교통 조사 기준일: 각 레코드의 `checkedDate`·`verifiedDate`를 사용하며, 계보 검토일과 동일시하지 않음
- 스키마 버전: **v3.1**
- 원천: 길담 코스 검증 스프레드시트 (후보 장소 / 로컬 설명 / 교통 구간 /
  코스 일정 / 코스 요약 / 식사 후보 / 개발 JSON / 대체·보류 코스 탭)
- Track #1 원자료별 사용·보류·증거 상태: [`DATA_PROVENANCE.md`](DATA_PROVENANCE.md)

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

## 2. 현재 반영된 주력 6건 + 보류 1건

| 코스ID | 코스명 | 출발지 | 시간 | 계획(분) | 도보 | 환승 | 피로도 | 검증상태 | 노출등급 |
|---|---|---|---|---|---|---|---|---|---|
| DY_LOW_01 | 초록숲길 반걸음 | 유스퀘어 | 6시간 | 354 (323~396) | 14 | 0 | MEDIUM | PARTIALLY_VERIFIED | MANUAL_REVIEW |
| DY_NORMAL_01 | 대나무숲 온걸음 | 유스퀘어 | 하루 | 462 (432~492) | 52 | 0 | HIGH | PARTIALLY_VERIFIED | DEMO_ONLY |
| NJ_LOW_01 | 한옥고택 반걸음 | 유스퀘어 | 6시간 | 289 (279~299) | 35 | 0 | MEDIUM | PARTIALLY_VERIFIED | MANUAL_REVIEW |
| NJ_NORMAL_01 | 세월옛길 온걸음 | 유스퀘어 | 하루 | 422 (392~452) | 28 | 2 | HIGH | PARTIALLY_VERIFIED | DEMO_ONLY |
| MP_LOW_01 | 근대골목 반걸음 | 광주송정역 | 6시간 | 359 (318~396) | 39 | 0 | HIGH | PARTIALLY_VERIFIED | MANUAL_REVIEW |
| MP_NORMAL_02 | 원도심길 온걸음 | 광주송정역 | 하루 | 423 (383~463) | 60 | 0 | HIGH | NEEDS_RECHECK | DEMO_ONLY |
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
7. 폐기한 `lastReturnDeparture*` 필드가 다시 들어오면 오류 (`returnTransport`만 허용)
8. API가 소비하는 공개·검증·이미지·설명·왕복교통·목적지·출처 필드 존재
9. 귀가 교통 유형별 필수값과 `returnTransport.segmentId`의 시트 구간ID 일치
10. 일정 ID·코스 ID 중복, 출처 URL·확인일 형식

검증: `python -m backend.app.courses.schema` (CI에서 자동 실행)

---

## 4. 귀가 가능성 판정

`feasibility.evaluate_return_feasibility(course, duration)`

- 허용 시간: 제품 명세 그대로 `SIX_HOURS = 360분`, `FULL_DAY = 720분`
- 여유(`slackMinutes`)는 계획값이 아니라 **최악값(`totalMinutes.max`)** 기준으로 계산합니다.
- 시간 총량과 **시트의 마지막 귀가 구간**을 함께 검사합니다.
- 귀가편을 막차 한 필드로 합치지 않고 다음 세 유형으로 보존합니다.

| 유형 | 대상 | 구조화한 값 | 판정 방식 |
|---|---|---|---|
| `HEADWAY_SERVICE` | 담양 | 13:30 이후, 주말 20분 배차, BIS 확인 | 절대 막차를 만들지 않고 당일 확인 경고 |
| `SCHEDULED_SERVICE` | 나주 | 계획·대체 회차, 현장예매 | 마지막 활동 종료+승차 여유 뒤 이용 가능한 회차 선택 |
| `RESERVATION_REQUIRED` | 목포 | 왕복 선예매, 역 복귀 여유 | 고정 시각 대신 이용일 예매편을 정본으로 사용 |

| 상태 | 조건 |
|---|---|
| `FEASIBLE` | 최악값 기준으로도 여유가 30분 이상 |
| `TIGHT` | 계획값은 들어오지만 최악값 기준 여유가 30분 미만(음수 포함) |
| `NOT_FEASIBLE` | **계획값**이 허용 시간 초과 / 확인된 귀가편을 놓침 |

`NOT_FEASIBLE`은 추천 결과에서 제외됩니다. `TIGHT`은 제외하지 않되, 왜 빠듯한지를
화면에 그대로 표기합니다. (예: DY_LOW_01 — 계획 354분, 최악 396분, 여유 −36분)

INTERNAL 데모에서는 막차·토요일 운행 등 미확인 항목을 추천 차단에 사용하지 않고
`2차 확인 필요` 경고로 표시합니다. PUBLIC은 `publishable=TRUE`만 허용합니다.

| confidence | 의미 |
|---|---|
| `CONFIRMED` | 귀가 구간이 공식 확인됐고 이용일 재확인이 필요 없음 |
| `NEEDS_DAY_OF_CHECK` | 공식 확정 전 — INTERNAL 조건부 추천 + 2차 확인 알림 |
| `UNVERIFIED` | 근거 부족 — 현재 데이터에는 사용하지 않으며 2차 확인 대상으로 취급 |

> 시트에 공식 막차 시각은 없지만 귀가 교통 데이터가 없는 것은 아닙니다. 각 코스의
> 마지막 교통 구간에 배차간격·계획/대체 회차·예약 조건이 있습니다. 코드는 이를
> `returnTransport`로 보존하며 INTERNAL에서는 2차 확인 안내를 붙입니다.

---

## 5. 피로도 산식 (설명 가능성)

`fatigue.calculate_fatigue_breakdown()`

세 요소의 가중합이며, 화면에서 요소별 기여도와 임계값을 그대로 보여줍니다.

| 요소 | 가중치 | 구간 |
|---|---|---|
| 도보 시간 | 0.40 | 15분 이하 낮음 / 15~35분 보통 / 35분 초과 높음 |
| 환승 횟수 | 0.35 | 0회 낮음 / 1회 보통 / 2회 이상 높음 |
| 왕복 교통 시간 | 0.25 | 90분 이하 낮음 / 90~180분 보통 / 180분 초과 높음 |

**계산값과 스프레드시트 표기값이 다르면 더 보수적인(높은) 등급을 채택합니다.**
운영 판단(예: "저피로 표기 금지")을 코드가 임의로 뒤집지 않기 위해서입니다.
불일치 건은 `/health`의 `fatigueMismatches`에 그대로 노출됩니다. (현재 6건)

---

## 6. 노출 정책

`exposure.py` 한 곳에서만 판단하며, 추천 API와 상세 API가 같은 함수를 씁니다.

| 노출등급 | 추천 결과 | 직접 URL 접근 |
|---|---|---|
| `MANUAL_REVIEW` | 귀가편 검증 통과 시 내부 노출 | 내부 상세 가능 |
| `DEMO_ONLY` | 귀가편 검증 통과 시 내부 노출 | 내부 상세 가능 |
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
| 귀가 여유 | 0.15 | 사용자가 선택한 가능 시간에서 최악 소요시간을 뺀 여유 |
| 지역 자원 | 0.12 | 지역 음식·로컬 포인트 두 범주의 충족률과 검증상태 |
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
6. `python -m backend.app.courses.lineage`로 계보 레지스트리 검사
7. 이 문서와 `DATA_PROVENANCE.md` 갱신

---

## 10. 남은 데이터 리스크

| 항목 | 상태 |
|---|---|
| 교통 구간 약 49%가 `NEEDS_RECHECK` | 지도 실측 대기 |
| 담양·나주·목포 귀가편 | 배차·계획회차·예약 데이터는 반영, INTERNAL은 2차 확인 경고 |
| MP_NORMAL_02 | `NEEDS_RECHECK` — 목포 2024-02 노선 개편 반영 검증 중 |
| MP_NORMAL_01 | `BLOCKED` 유지 |
| 311-1 지선 국도 노선 변경(2026-05) | 담양 코스 영향 모니터링 필요 |
| 전 코스 `publishable=FALSE` | 대외 공개 전 재검증 필요 |
| Track #1 제품 사용 계보 | 현재 추적 가능한 실사용 0건; A-DS18은 범위 감사만 완료, A-DS13·01·11은 원본 근거 연결 필요 |

## 11. TourAPI 보강과 장애 격리

- TourAPI는 장소 식별·주소·좌표·대표 이미지 보강에만 사용합니다. 추천 시간,
  도보, 환승, 귀가 가능성의 정본은 기존 Sheets 스냅샷입니다.
- 라이브 시트의 `TourAPI 장소 매핑` 탭 기준으로 P0/P1 항목 모두 아직
  `PENDING_CONTENT_ID`입니다. 근거 없는 contentId를 만들지 않았으며 A-DS13은
  `EVIDENCE_REQUIRED`입니다.
- provider 응답 원문은 사용자 API에 노출하지 않습니다. contentId·사용 필드·응답
  해시·장소ID·화면 사용이 모두 연결된 뒤에만 정규화 필드를 상세 API에 추가합니다.
- 429·502·503·504와 timeout만 최대 2회 재시도합니다. 이후에도 실패하거나 키가
  없으면 core 추천·상세는 Sheets 데이터로 정상 응답합니다.
