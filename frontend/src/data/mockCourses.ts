import type { CourseSummary } from '../types/course.ts'
import type {
  DepartureId,
  DurationId,
  PreferenceId,
} from '../types/travelConditions.ts'

export interface MockCourseSummary extends CourseSummary {
  departures: DepartureId[]
  durations: DurationId[]
  preferences: PreferenceId[]
}

export const mockCourses: MockCourseSummary[] = [
  {
    id: 'damyang-slow-walk',
    title: '담양 느린 산책 코스',
    region: '담양',
    thumbnailUrl: '/images/course-damyang.jpeg',
    tags: ['자연·산책', '감성기록', '음식'],
    fatigueLevel: 'LOW',
    durationMinutes: 360,
    walkingMinutes: 24,
    transferCount: 1,
    recommendationReasons: [
      '자연·산책 취향과 주요 장소가 잘 맞아요.',
      '환승이 1회로 비교적 단순해요.',
      '국수거리에서 지역 음식을 즐길 수 있어요.',
    ],
    departures: ['GWANGJU_SONGJEONG', 'USQUARE'],
    durations: ['FULL_DAY'],
    preferences: ['NATURE_WALK', 'FOOD_MARKET', 'MEMORY'],
  },
  {
    id: 'damyang-market-trip',
    title: '담양 시장과 골목 코스',
    region: '담양',
    thumbnailUrl: '/images/course-damyang.jpeg',
    tags: ['음식·시장', '역사·문화'],
    fatigueLevel: 'MEDIUM',
    durationMinutes: 330,
    walkingMinutes: 31,
    transferCount: 1,
    recommendationReasons: [
      '6시간 안에 시장과 골목을 둘러볼 수 있어요.',
      '한 동선에서 지역 음식과 문화를 경험해요.',
    ],
    departures: ['USQUARE'],
    durations: ['SIX_HOURS'],
    preferences: ['FOOD_MARKET', 'HISTORY_CULTURE'],
  },
  {
    id: 'naju-history-walk',
    title: '나주 읍성 시간여행 코스',
    region: '나주',
    thumbnailUrl: '/images/course-naju.svg',
    tags: ['역사·문화', '음식·시장'],
    fatigueLevel: 'LOW',
    durationMinutes: 340,
    walkingMinutes: 20,
    transferCount: 0,
    recommendationReasons: [
      '환승 없이 나주 원도심을 둘러볼 수 있어요.',
      '오래된 골목과 지역 음식을 함께 경험해요.',
    ],
    departures: ['GWANGJU_SONGJEONG'],
    durations: ['SIX_HOURS'],
    preferences: ['HISTORY_CULTURE', 'FOOD_MARKET', 'MEMORY'],
  },
  {
    id: 'naju-riverside-day',
    title: '나주 영산강 하루 코스',
    region: '나주',
    thumbnailUrl: '/images/course-naju.svg',
    tags: ['자연·산책', '음식'],
    fatigueLevel: 'MEDIUM',
    durationMinutes: 430,
    walkingMinutes: 34,
    transferCount: 1,
    recommendationReasons: [
      '강변 산책과 나주 음식을 한 번에 즐겨요.',
      '하루 종일 여유 있게 둘러보기 좋아요.',
    ],
    departures: ['GWANGJU_SONGJEONG', 'USQUARE'],
    durations: ['FULL_DAY'],
    preferences: ['NATURE_WALK', 'FOOD_MARKET'],
  },
  {
    id: 'mokpo-port-culture',
    title: '목포 항구 문화 코스',
    region: '목포',
    thumbnailUrl: '/images/course-mokpo.svg',
    tags: ['역사·문화', '음식·시장', '감성기록'],
    fatigueLevel: 'MEDIUM',
    durationMinutes: 480,
    walkingMinutes: 32,
    transferCount: 1,
    recommendationReasons: [
      '근대문화 거리와 항구 풍경을 함께 만나요.',
      '사진으로 남기기 좋은 골목이 포함되어 있어요.',
    ],
    departures: ['GWANGJU_SONGJEONG'],
    durations: ['FULL_DAY'],
    preferences: ['HISTORY_CULTURE', 'FOOD_MARKET', 'MEMORY'],
  },
  {
    id: 'mokpo-seaside-day',
    title: '목포 바다 산책 코스',
    region: '목포',
    thumbnailUrl: '/images/course-mokpo.svg',
    tags: ['자연·산책', '감성기록'],
    fatigueLevel: 'HIGH',
    durationMinutes: 500,
    walkingMinutes: 42,
    transferCount: 2,
    recommendationReasons: [
      '바다와 도심 풍경을 하루 동안 이어서 만나요.',
      '여행 장면을 기록하기 좋은 장소가 많아요.',
    ],
    departures: ['GWANGJU_SONGJEONG', 'USQUARE'],
    durations: ['FULL_DAY'],
    preferences: ['NATURE_WALK', 'MEMORY'],
  },
]
