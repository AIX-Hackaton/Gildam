# 길담 UI 구현 명세서

> 이 문서는 초기 UI 설계 참고본입니다. 현재 실데이터·API·노출 정책은
> `docs/Gildam_PRODUCT_SPEC.md`, `docs/DATA_INTEGRATION.md`,
> `docs/DATA_PROVENANCE.md`를 우선합니다. 아래 Mock Data 단계는 이미 종료되었습니다.

> 기준 이미지: `docs/reference/gildam-ui-reference.png`  
> 이 문서는 길담 모바일 웹/PWA의 UI를 Codex가 일관되게 구현할 수 있도록 화면 구조, 디자인 토큰, 컴포넌트, 상태, 데이터 계약과 완료 조건을 정의한다.  
> 구현 전 `PRODUCT_SPEC.md`와 이 문서를 함께 읽는다.

---

## 0. 구현 원칙

1. 기준 이미지는 시각적 방향을 위한 레퍼런스다.
2. 화면 구조와 정보 위계는 유지하되, 모바일 접근성과 실제 웹 구현에 맞게 조정한다.
3. 컴포넌트에 특정 지역명이나 코스 내용을 직접 하드코딩하지 않는다.
4. 모든 화면은 mock data로 먼저 구현하고, 추후 실제 API로 교체할 수 있도록 service layer를 둔다.
5. 같은 역할의 버튼, 칩, 카드, 지표는 공통 컴포넌트로 재사용한다.
6. 모바일 퍼스트로 구현하며 기준 프레임은 `390 × 844px`이다.
7. 현재 디자인은 친근하고 둥근 여행 앱을 기본으로 하되, 불필요한 그림자와 장식은 줄인다.
8. 브랜드색은 `#23C1CB`, 주요 CTA는 대비를 위해 `#117E85`를 사용한다.
9. 색상만으로 선택, 오류, 피로도 상태를 전달하지 않는다.
10. 기획에 없는 기능을 임의로 추가하지 않는다.

---

# 1. 화면 범위

## 1.1 우선순위

### P0 — 반드시 구현

| 화면 | Route | 설명 |
|---|---|---|
| 홈 | `/` | 서비스 소개 및 조건 입력 진입 |
| 조건 입력 | `/plan` | 출발지, 시간, 취향 선택 |
| 추천 결과 | `/results` | 1순위 추천과 대안 코스 표시 |
| 코스 상세 | `/courses/:courseId` | 일정, 이동 정보, 지역 음식, 로컬 포인트 |
| 결과 없음 | `/results`의 empty state | 조건에 맞는 코스가 없을 때 안내 |
| 로딩·오류 | 각 화면 상태 | skeleton, retry, 404 처리 |

### P1 — P0 완료 후 구현

| 화면 | Route | 설명 |
|---|---|---|
| 로컬 포인트·오늘 담아볼 장면 | `/courses/:courseId/guide` | 지역 이해와 기록 가이드 |
| 오늘의 장면 카드 | `/memory/:courseId` | 사진 6장으로 기록 카드 생성 |
| 기록 보관 | `/memories` | 현재는 UI 진입만 가능, 영구 저장은 후순위 |

---

# 2. 핵심 사용자 흐름

## 2.1 정상 흐름

```text
홈
→ 조건 입력
→ 추천 결과
→ 코스 상세
→ 로컬 포인트·오늘 담아볼 장면
→ 오늘의 장면 카드
```

## 2.2 실제 이동 흐름

```text
코스 상세
→ 지도에서 보기
또는
→ 길찾기 열기
→ 외부 지도 서비스
```

## 2.3 결과 없음 흐름

```text
조건 입력
→ 추천 결과 없음
→ 조건 수정 안내
→ 조건 다시 선택
```

---

# 3. 디자인 콘셉트

## 3.1 핵심 문장

> 차 없이 갈 수 있는지 쉽게 확인하고, 지역의 하루를 친근하게 기록하는 여행 큐레이터

## 3.2 디자인 키워드

- Rounded
- Friendly
- Curated
- Travel
- Clear
- Trustworthy

## 3.3 시각적 우선순위

1. 코스명과 대표 사진
2. 이동 피로도, 총 소요시간, 도보시간, 환승 횟수
3. 추천 이유
4. 코스 순서
5. 지역 음식과 로컬 포인트
6. 기록 가이드와 장면 카드

기록 기능이 이동 가능성 정보보다 먼저 강조되지 않도록 한다.

---

# 4. 디자인 토큰

## 4.1 Color

```css
:root {
  /* Brand */
  --color-primary-50: #F0FBFC;
  --color-primary-100: #DDF7F8;
  --color-primary-300: #86E1E5;
  --color-primary-500: #23C1CB;
  --color-primary-600: #1599A2;
  --color-primary-700: #117E85;
  --color-primary-800: #0F666C;

  /* Neutral */
  --color-background: #F7F8F8;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #F1F4F4;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #66706F;
  --color-text-tertiary: #8A9492;
  --color-border: #E2E8E7;
  --color-disabled: #D6DCDB;

  /* Category accents */
  --color-nature: #23C1CB;
  --color-history: #4E9FD8;
  --color-food: #F39A50;
  --color-memory: #8B79D6;

  /* Status */
  --color-success: #188A5B;
  --color-warning: #D88A1D;
  --color-danger: #D94A4A;
}
```

### 사용 규칙

- `#23C1CB`: 로고, 선택 상태, 활성 아이콘, 작은 강조
- `#117E85`: 주요 CTA 배경
- `#DDF7F8`: 선택 카드, 정보 박스, 활성 칩 배경
- 카테고리 색은 아이콘 또는 작은 배지에만 사용
- 본문 배경 전체에 강한 브랜드색을 사용하지 않는다
- Primary CTA는 `#117E85 + #FFFFFF`
- `#23C1CB` 배경 위에는 `#1A1A1A` 또는 `#0F666C` 계열 텍스트를 사용한다

## 4.2 Typography

기본 폰트는 `Pretendard`다. 로드 실패 시 시스템 sans-serif를 사용한다.

```css
:root {
  --font-family-base: "Pretendard", -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;

  --font-size-display: 28px;
  --font-size-h1: 24px;
  --font-size-h2: 18px;
  --font-size-title: 16px;
  --font-size-body: 14px;
  --font-size-caption: 12px;

  --line-height-display: 1.3;
  --line-height-heading: 1.4;
  --line-height-body: 1.55;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### 적용

| 용도 | 크기 / 굵기 |
|---|---|
| 홈 핵심 카피 | 28px / 700 |
| 페이지 제목 | 24px / 700 |
| 섹션 제목 | 18px / 700 |
| 카드 제목 | 16px / 600~700 |
| 본문 | 14px / 400~500 |
| 보조 정보 | 12px / 400~500 |

## 4.3 Spacing

4px 기반 spacing scale을 사용한다.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
}
```

## 4.4 Radius

```css
:root {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 999px;
}
```

### 적용

- Button: 12px
- Card: 16px
- Hero image: 16px
- Chip: pill
- Icon button: circle
- Memory photo grid: 8px 또는 0px 중 한 스타일로 통일

## 4.5 Shadow

그림자는 최소화한다.

```css
:root {
  --shadow-card: 0 4px 16px rgba(15, 72, 73, 0.08);
  --shadow-floating: 0 8px 28px rgba(15, 72, 73, 0.12);
}
```

- 일반 카드는 border만 사용
- 대표 추천 카드와 하단 고정 CTA에만 약한 shadow 사용
- 중첩 카드에는 그림자를 사용하지 않는다

## 4.6 Icon

- 1.5px stroke
- rounded cap / rounded join
- 20px 기본
- 24px 주요 액션
- 한 화면에 불필요한 아이콘을 과도하게 사용하지 않는다

---

# 5. 공통 레이아웃

## 5.1 모바일 기준

```css
.app-shell {
  width: 100%;
  min-height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
  background: var(--color-surface);
}

.page-content {
  padding: 20px;
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
}
```

## 5.2 Header

### Home Header

- 좌측: 길담 로고
- 우측: 알림 아이콘
- 높이: 56px
- 좌우 padding: 20px

### Inner Page Header

- 좌측: 뒤로가기
- 중앙 또는 좌측: 페이지 제목
- 우측: 찜, 공유 등 선택 액션
- 높이: 56px
- 헤더 내부 border-bottom은 필요할 때만 사용

## 5.3 Bottom Navigation

기준 이미지에 따라 4개 탭을 사용한다.

```text
홈 / 코스 추천 / 기록 / 마이
```

단, P0에서 기록·마이 기능이 실제 구현되지 않았다면:

- disabled 처리하지 말고 메뉴 자체를 숨기거나
- P1 완료 후 Bottom Navigation을 활성화한다.

P0 단계에서는 상단 헤더 + 하단 CTA만 사용하는 것을 우선한다.

---

# 6. 재사용 컴포넌트

## 6.1 Base UI

### `Button`

```ts
type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "medium" | "large";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}
```

#### 상태

- default
- hover
- pressed
- focus-visible
- disabled
- loading

### `IconButton`

```ts
interface IconButtonProps {
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  selected?: boolean;
}
```

반드시 `aria-label`을 제공한다.

### `SelectableChip`

```ts
interface SelectableChipProps {
  label: string;
  selected: boolean;
  icon?: React.ReactNode;
  onSelect: () => void;
}
```

- 단일 선택 또는 복수 선택에 사용
- `button` 요소와 `aria-pressed` 사용
- 선택 상태는 배경색, 테두리, 체크 아이콘을 함께 사용

### `Badge`

용도:

- 1순위 추천
- 지역명
- 취향 태그
- 이동 피로도
- 장소 유형

### `PageHeader`

```ts
interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  rightActions?: React.ReactNode;
}
```

### `SectionHeader`

```ts
interface SectionHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
}
```

### `StickyBottomCTA`

- 하단 safe-area 대응
- 한 화면의 주 행동만 배치
- 1개 또는 최대 2개 버튼

---

## 6.2 Travel Domain

### `ConditionGroup`

출발지, 가능 시간, 취향 입력 영역을 묶는다.

### `PreferenceCard`

- 아이콘
- 라벨
- 선택 체크
- 선택 상태
- 2열 또는 4열 responsive grid

### `CourseCard`

```ts
interface CourseCardProps {
  course: CourseSummary;
  featured?: boolean;
  rank?: number;
  onOpen: () => void;
}
```

표시 요소:

- 대표 이미지
- 추천 배지
- 코스명
- 태그
- 이동 지표
- 추천 이유
- 상세 보기 CTA
- 선택적 찜 버튼

### `TravelMetric`

```ts
interface TravelMetricProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
  emphasis?: "default" | "positive" | "warning";
}
```

### `TravelMetricGroup`

다음 지표를 3~4열로 표시한다.

- 이동 피로도
- 환승
- 총 도보
- 예상 소요시간

### `FatigueBadge`

```ts
type FatigueLevel = "LOW" | "MEDIUM" | "HIGH";
```

표시:

- LOW: `낮음`
- MEDIUM: `보통`
- HIGH: `높음`

색상 외에 텍스트와 아이콘을 함께 사용한다.

### `RecommendationReasonList`

2~3개의 짧은 추천 이유를 표시한다.

### `ItineraryTimeline`

```ts
interface ItineraryItem {
  id: string;
  time?: string;
  name: string;
  type: "transport" | "place" | "food" | "free";
  durationMinutes?: number;
  note?: string;
}
```

### `LocalFoodCard`

- 음식 이미지
- 음식명
- 짧은 설명
- 지역 태그
- 지도 연결 선택 가능

### `LocalPointCard`

- 제목
- 설명
- 해시태그 또는 키워드
- 선택적 이미지

### `ScenePromptCard`

- 아이콘
- 질문형 문구
- 선택/완료 상태
- 예: `전남에서 내가 먹은 음식은?`

### `MemoryPhotoGrid`

- 2×3 grid
- 업로드 전 placeholder
- 업로드 후 이미지
- 이미지 재배치 및 삭제는 P2

---

## 6.3 Feedback Components

- `CourseCardSkeleton`
- `DetailSkeleton`
- `NoResultsState`
- `ErrorState`
- `NotFoundState`
- `InlineErrorMessage`

---

# 7. 화면별 명세

## 7.1 홈 `/`

### 목적

서비스 핵심 가치를 전달하고 조건 입력으로 진입시킨다.

### 구조

1. Home Header
2. 메인 카피
3. 보조 설명
4. 여행 일러스트 또는 대표 이미지
5. Primary CTA
6. Secondary CTA
7. Bottom Navigation — P1 이후

### 카피 예시

```text
차 없이도 충분한
전남 당일치기 여행

출발지와 시간, 취향만 선택하면
완주 가능한 코스를 추천해드려요.
```

### CTA

- Primary: `내 여행 조건 입력하기`
- Secondary: `지난 여행 기록 보기` — P1 전에는 숨김

### 완료 조건

- 첫 화면에서 서비스 목적을 이해할 수 있다.
- 390×844에서 핵심 카피, 이미지, CTA가 과도한 스크롤 없이 보인다.
- CTA 선택 시 `/plan`로 이동한다.

---

## 7.2 조건 입력 `/plan`

### 목적

최소한의 선택으로 추천 조건을 완성한다.

### 구조

1. Inner Header
2. 제목과 설명
3. 출발지
4. 가능 시간
5. 취향
6. Sticky Bottom CTA

### 입력값

#### 출발지 — 단일 선택

- 광주송정역
- 유스퀘어

#### 가능 시간 — 단일 선택

- 6시간
- 하루 종일

#### 취향 — 복수 선택

- 자연·산책
- 역사·문화
- 음식·시장
- 감성기록

### 동작

- 출발지와 시간은 단일 선택
- 취향은 1개 이상 선택
- 필수값 완료 전 CTA disabled
- 선택값은 `sessionStorage`에 유지
- 제출 중 중복 클릭 방지
- 제출 시 `/results`로 이동

### 완료 조건

- 선택 상태가 명확하다.
- keyboard와 screen reader로 조작할 수 있다.
- 뒤로 이동 후 다시 들어오면 선택값이 유지된다.

---

## 7.3 추천 결과 `/results`

### 목적

사용자가 1순위 코스와 대안을 빠르게 비교한다.

### 구조

1. Inner Header
2. 선택 조건 요약 chip
3. 1순위 CourseCard
4. pagination 또는 순위 표시
5. 대안 코스 목록
6. Bottom Navigation — P1 이후

### 1순위 카드 필수 정보

- 1순위 추천 badge
- 대표 이미지
- 찜 버튼
- 코스명
- 취향 tag
- 이동 피로도
- 환승
- 도보
- 예상 소요시간
- 추천 이유 2~3개
- `코스 자세히 보기`
- 선택적 지도 icon button

### 대안 코스

- 최대 2개
- 대표 이미지 thumbnail
- 코스명
- 핵심 지표 2~3개
- 상세 페이지 이동

### 결과 없음

`courses.length === 0`이면 `NoResultsState` 표시.

```text
조건에 맞는 코스를 찾지 못했어요.

가능 시간을 늘리거나,
취향 조건을 줄여 다시 찾아보세요.
```

CTA:

- `조건 다시 선택하기`
- `홈으로 돌아가기`

### 완료 조건

- 1순위와 대안 코스의 위계가 분명하다.
- 카드 상단에서 이동 가능성을 빠르게 파악할 수 있다.
- 추천 이유가 짧은 문장으로 제공된다.

---

## 7.4 코스 상세 `/courses/:courseId`

### 목적

사용자가 이 코스를 실제로 선택할지 최종 판단한다.

### 구조

1. Inner Header
   - back
   - share
   - favorite
2. 코스명
3. 한 줄 설명
4. TravelMetricGroup
5. ItineraryTimeline
6. Sticky Bottom CTA

### 지표

- 총 소요시간
- 총 도보시간
- 환승 횟수
- 이동 피로도

### Timeline

각 항목:

- 시간
- 장소명
- 유형 badge
- 머무는 시간 또는 이동시간
- 선택적 thumbnail

### 하단 CTA

- Secondary: `지도에서 보기`
- Primary: `길찾기 열기`

외부 지도는 새 창 또는 앱 딥링크로 연다.

### 완료 조건

- 잘못된 `courseId`는 `NotFoundState`를 표시한다.
- 코스 정보는 전부 data object에서 렌더링된다.
- 하단 CTA가 콘텐츠를 가리지 않는다.

---

## 7.5 로컬 포인트·오늘 담아볼 장면 `/courses/:courseId/guide`

### 목적

사용자가 지역의 음식과 장소를 더 잘 관찰하고 기록하도록 돕는다.

### 구조

1. Inner Header
2. `로컬 포인트`
3. LocalFoodCard 또는 LocalPointCard
4. `오늘 담아볼 장면`
5. ScenePromptCard 목록
6. Primary CTA

### Scene Prompt 예시

- 전남에서 내가 먹은 음식은?
- 오래된 간판이나 골목의 색감
- 걷다가 발견한 풍경
- 나만의 작은 순간

### CTA

- `기록하기`
- 클릭 시 `/memory/:courseId`

### 완료 조건

- 미션처럼 강제적으로 보이지 않는다.
- 모든 장면 prompt는 건너뛸 수 있다.
- 문장은 짧고 관찰을 유도하는 질문형으로 작성한다.

---

## 7.6 오늘의 장면 카드 `/memory/:courseId`

### 목적

사용자가 여행 사진을 하나의 기록 카드로 완성한다.

### 구조

1. Inner Header
2. 제목
3. 코스명
4. 날짜
5. MemoryPhotoGrid
6. 지역 tag
7. 저장 / 공유 CTA

### 사진 grid

- 6개 슬롯
- 2×3 또는 3×2
- 비율은 1:1
- 업로드 전 placeholder
- 업로드 후 object-fit: cover

### CTA

- Secondary: `저장하기`
- Primary: `공유하기`

### P1 범위

- File input
- 이미지 미리보기
- `html2canvas` 기반 이미지 저장
- Web Share API 지원 시 공유

### 완료 조건

- 사진이 없어도 레이아웃이 깨지지 않는다.
- 공유 API 미지원 환경에서는 이미지 저장으로 대체한다.
- 모바일 사진 접근 권한 실패를 처리한다.

---

# 8. 상태 처리

## 8.1 Loading

```tsx
if (isLoading) return <CourseCardSkeleton />;
```

- 레이아웃 shift 최소화
- 추천 요청 중 CTA disabled
- 700ms 이상 걸리는 요청에는 skeleton 표시

## 8.2 Empty

- 사용자 잘못처럼 표현하지 않는다
- 조건 완화 방법을 제안한다
- 재입력 CTA 제공

## 8.3 Error

```text
코스를 불러오지 못했어요.
잠시 후 다시 시도해주세요.
```

CTA:

- `다시 시도`
- `조건 입력으로 돌아가기`

## 8.4 Not Found

잘못된 route와 courseId 처리.

---

# 9. 데이터 타입

```ts
type FatigueLevel = "LOW" | "MEDIUM" | "HIGH";

type DepartureId = "GWANGJU_SONGJEONG" | "USQUARE";
type DurationId = "SIX_HOURS" | "FULL_DAY";
type PreferenceId =
  | "NATURE_WALK"
  | "HISTORY_CULTURE"
  | "FOOD_MARKET"
  | "MEMORY";

interface TravelConditions {
  departure: DepartureId | null;
  duration: DurationId | null;
  preferences: PreferenceId[];
}

interface CourseSummary {
  id: string;
  title: string;
  region: string;
  thumbnailUrl: string;
  tags: string[];
  fatigueLevel: FatigueLevel;
  durationMinutes: number;
  walkingMinutes: number;
  transferCount: number;
  recommendationReasons: string[];
}

interface Course extends CourseSummary {
  description: string;
  itinerary: ItineraryItem[];
  localFood: LocalFood[];
  localPoints: LocalPoint[];
  scenePrompts: string[];
  mapUrl: string;
  directionsUrl: string;
}

interface LocalFood {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  tags?: string[];
}

interface LocalPoint {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  tags?: string[];
}
```

---

# 10. Mock Data 원칙

폴더 구조:

```text
src/
├─ data/
│  └─ mockCourses.ts
├─ services/
│  └─ recommendationService.ts
├─ types/
│  ├─ course.ts
│  └─ travelConditions.ts
```

화면 컴포넌트는 `mockCourses`를 직접 import하지 않는다.

```ts
export async function getRecommendations(
  conditions: TravelConditions
): Promise<CourseSummary[]> {
  return getMockRecommendations(conditions);
}
```

추후 실제 API로 교체할 때 service 내부만 수정한다.

---

# 11. 권장 폴더 구조

```text
src/
├─ app/
│  ├─ App.tsx
│  └─ router.tsx
├─ pages/
│  ├─ HomePage/
│  ├─ PlanPage/
│  ├─ ResultsPage/
│  ├─ CourseDetailPage/
│  ├─ CourseGuidePage/
│  ├─ MemoryCardPage/
│  └─ NotFoundPage/
├─ components/
│  ├─ common/
│  ├─ course/
│  ├─ plan/
│  ├─ guide/
│  ├─ memory/
│  └─ feedback/
├─ contexts/
│  └─ TravelConditionsContext.tsx
├─ data/
│  └─ mockCourses.ts
├─ services/
│  └─ recommendationService.ts
├─ types/
├─ styles/
│  ├─ tokens.css
│  ├─ globals.css
│  └─ reset.css
└─ assets/
```

---

# 12. 반응형

## Breakpoints

- 최소: 320px
- 기본: 390px
- 태블릿: 768px
- 데스크톱: 1024px 이상

## 규칙

- 320px에서 가로 스크롤이 없어야 한다.
- 데스크톱에서는 모바일 프레임을 무작정 늘리지 않고 최대 폭을 유지한다.
- 768px 이상에서는 추천 카드 목록을 2열로 확장할 수 있다.
- 고정 CTA는 safe-area를 반영한다.
- 긴 한국어 제목이 잘리지 않아야 한다.
- 이미지에는 `aspect-ratio`와 `object-fit: cover`를 사용한다.

---

# 13. 접근성

- 모든 클릭 요소는 실제 `button` 또는 `a`
- 최소 터치 영역 44×44px
- `focus-visible` 스타일 유지
- `SelectableChip`에 `aria-pressed`
- IconButton에 `aria-label`
- 이미지에 적절한 alt
- 색상 외 텍스트와 아이콘으로 상태 전달
- 본문 텍스트 대비 4.5:1 이상
- 큰 텍스트와 핵심 UI 요소 대비 3:1 이상
- 오류 메시지는 `aria-live` 적용
- 로딩 상태에는 screen reader용 텍스트 제공

---

# 14. Codex 작업 순서

## Step 1. 저장소 분석

- 기존 기술 스택 확인
- 기존 라우팅, 스타일링, 상태관리 확인
- 불필요한 신규 라이브러리 추가 금지

## Step 2. Foundation

- tokens.css
- globals.css
- Button
- SelectableChip
- Badge
- PageHeader
- StickyBottomCTA
- 기본 타입

## Step 3. Mock Data와 Service

- `mockCourses.ts`
- `recommendationService.ts`
- loading / empty / error를 테스트할 수 있는 분기

## Step 4. P0 화면

1. Home
2. Plan
3. Results
4. Course Detail
5. No Results
6. Error / 404

## Step 5. P1 화면

1. Course Guide
2. Memory Card
3. 파일 업로드
4. 저장·공유

## Step 6. 검증

- lint
- typecheck
- test
- build
- 320px / 390px / 768px 수동 확인
- keyboard navigation
- 대표 정상 흐름
- 결과 없음 흐름
- 오류 흐름

---

# 15. 완료 체크리스트

## 화면

- [ ] 홈에서 조건 입력으로 이동한다.
- [ ] 조건 입력에서 단일·복수 선택이 올바르게 작동한다.
- [ ] 필수값 완료 전 CTA가 비활성화된다.
- [ ] 추천 결과에서 1순위와 대안 코스가 구분된다.
- [ ] 코스 카드에서 이동 지표와 추천 이유를 확인할 수 있다.
- [ ] 코스 상세에서 일정과 이동 정보를 확인할 수 있다.
- [ ] 지도 및 길찾기 버튼이 외부 URL을 연다.
- [ ] 결과 없음에서 조건을 다시 선택할 수 있다.
- [ ] 로컬 포인트와 장면 가이드가 데이터 기반으로 렌더링된다.
- [ ] 오늘의 장면 카드에서 사진을 선택하고 미리 볼 수 있다.

## 디자인

- [ ] 브랜드색과 CTA 색상이 구분되어 있다.
- [ ] 같은 역할의 UI는 같은 컴포넌트를 사용한다.
- [ ] 카테고리 색을 과도하게 사용하지 않는다.
- [ ] 일반 카드에는 불필요한 그림자가 없다.
- [ ] 390px 기준 이미지와 정보 위계가 기준 이미지와 유사하다.
- [ ] 긴 텍스트가 레이아웃을 깨뜨리지 않는다.

## 접근성

- [ ] 키보드로 핵심 흐름을 이용할 수 있다.
- [ ] focus-visible이 보인다.
- [ ] aria-pressed와 aria-label이 적용되어 있다.
- [ ] 이미지 alt가 작성되어 있다.
- [ ] 색상만으로 선택 상태를 전달하지 않는다.
- [ ] 텍스트 대비 기준을 충족한다.

## 코드

- [ ] TypeScript 오류가 없다.
- [ ] mock data가 UI와 분리되어 있다.
- [ ] service layer를 통해 데이터를 조회한다.
- [ ] 특정 코스가 컴포넌트에 하드코딩되어 있지 않다.
- [ ] lint와 build가 통과한다.

---

# 16. Codex용 핵심 지시문

```md
Before implementing UI, read `PRODUCT_SPEC.md` and `UI_IMPLEMENTATION_SPEC.md`.

Use `docs/reference/gildam-ui-reference.png` as the visual reference.

Implementation priorities:
1. Mobile-first layout at 390×844.
2. Reusable components and centralized design tokens.
3. Home → Plan → Results → Course Detail → Guide → Memory flow.
4. Mock data through a service layer.
5. Loading, empty, error, and not-found states.
6. Responsive behavior and accessibility from the start.

Do not:
- hardcode course-specific text inside components,
- add features not described in the spec,
- introduce a new UI library without explaining why,
- use color alone to communicate state,
- reproduce every decorative detail if it harms accessibility or consistency.

After each task:
- run available lint, typecheck, test, and build commands,
- summarize changed files,
- report remaining issues.
```
