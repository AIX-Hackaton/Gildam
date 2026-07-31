import type { Course, CourseSummary } from '../types/course.ts'

type CourseDetails = Omit<Course, keyof CourseSummary>

export const mockCourseDetails: Record<string, CourseDetails> = {
  'damyang-slow-walk': {
    description:
      '천천히 걷고, 담양의 자연과 골목을 오롯이 느낄 수 있는 코스예요.',
    itinerary: [
      {
        id: 'damyang-1',
        time: '09:30',
        name: '광주송정역 출발',
        type: 'transport',
        durationMinutes: 70,
        note: '대중교통으로 담양 이동',
      },
      {
        id: 'damyang-2',
        time: '10:40',
        name: '관방제림',
        type: 'place',
        durationMinutes: 50,
        note: '강변을 따라 천천히 산책해요.',
      },
      {
        id: 'damyang-3',
        time: '12:00',
        name: '메타세쿼이아길',
        type: 'place',
        durationMinutes: 60,
        note: '나무 사이로 이어지는 길을 걸어요.',
      },
      {
        id: 'damyang-4',
        time: '13:20',
        name: '담양 국수거리',
        type: 'food',
        durationMinutes: 60,
        note: '멸치국수와 삶은 달걀을 맛봐요.',
      },
      {
        id: 'damyang-5',
        time: '14:30',
        name: '골목 자유 산책',
        type: 'place',
        durationMinutes: 40,
        note: '작은 가게와 오래된 골목을 둘러봐요.',
      },
    ],
    localFood: [
      {
        id: 'damyang-noodle',
        name: '담양 멸치국수',
        description: '진한 멸치 육수와 넉넉한 고명이 어우러진 국수예요.',
        tags: ['담양', '국수'],
      },
    ],
    localPoints: [
      {
        id: 'damyang-point',
        title: '나무와 골목이 이어지는 하루',
        description: '관방제림의 그늘과 담양 골목의 느린 분위기를 비교해보세요.',
        tags: ['산책', '골목'],
      },
    ],
    scenePrompts: [
      '전남에서 내가 먹은 음식은?',
      '오래된 간판이나 골목의 색감',
      '걷다가 발견한 풍경',
    ],
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=%EB%8B%B4%EC%96%91+%EA%B4%80%EB%B0%A9%EC%A0%9C%EB%A6%BC',
    directionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=%EB%8B%B4%EC%96%91+%EA%B4%80%EB%B0%A9%EC%A0%9C%EB%A6%BC',
  },
  'damyang-market-trip': {
    description: '담양의 시장 음식과 오래된 골목을 가볍게 잇는 코스예요.',
    itinerary: [
      { id: 'damyang-market-1', time: '10:00', name: '유스퀘어 출발', type: 'transport', durationMinutes: 50 },
      { id: 'damyang-market-2', time: '11:00', name: '담양시장', type: 'food', durationMinutes: 70, note: '시장 간식과 제철 먹거리를 둘러봐요.' },
      { id: 'damyang-market-3', time: '12:30', name: '담주예술구', type: 'place', durationMinutes: 60, note: '창작 공간과 골목 전시를 만나요.' },
      { id: 'damyang-market-4', time: '14:00', name: '죽녹원 주변 산책', type: 'place', durationMinutes: 50 },
    ],
    localFood: [{ id: 'damyang-snack', name: '담양 시장 간식', description: '시장 골목에서 계절마다 다른 지역 간식을 만나보세요.' }],
    localPoints: [{ id: 'damyang-market-point', title: '시장과 예술 골목', description: '생활 시장과 새로 생긴 문화 공간이 나란히 이어져요.' }],
    scenePrompts: ['시장 안에서 가장 눈에 띈 색은?', '골목에서 발견한 작은 가게', '오늘 맛본 담양의 한입'],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=%EB%8B%B4%EC%96%91%EC%8B%9C%EC%9E%A5',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=%EB%8B%B4%EC%96%91%EC%8B%9C%EC%9E%A5',
  },
  'naju-history-walk': {
    description: '나주 읍성의 역사와 원도심의 맛을 환승 없이 만나는 코스예요.',
    itinerary: [
      { id: 'naju-history-1', time: '10:00', name: '광주송정역 출발', type: 'transport', durationMinutes: 25 },
      { id: 'naju-history-2', time: '10:40', name: '나주 금성관', type: 'place', durationMinutes: 50, note: '나주 읍성의 중심 공간을 살펴봐요.' },
      { id: 'naju-history-3', time: '12:00', name: '곰탕거리', type: 'food', durationMinutes: 60 },
      { id: 'naju-history-4', time: '13:20', name: '나주읍성 골목', type: 'place', durationMinutes: 70 },
    ],
    localFood: [{ id: 'naju-gomtang', name: '나주곰탕', description: '맑고 깊은 국물로 알려진 나주의 대표 음식이에요.' }],
    localPoints: [{ id: 'naju-history-point', title: '읍성 안의 오래된 시간', description: '금성관과 골목의 건축 요소를 천천히 살펴보세요.' }],
    scenePrompts: ['오래된 건물에서 찾은 무늬', '나주곰탕의 첫인상', '읍성 골목의 빛과 그림자'],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=%EB%82%98%EC%A3%BC+%EA%B8%88%EC%84%B1%EA%B4%80',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=%EB%82%98%EC%A3%BC+%EA%B8%88%EC%84%B1%EA%B4%80',
  },
  'naju-riverside-day': {
    description: '영산강의 풍경과 나주의 먹거리를 여유롭게 즐기는 하루 코스예요.',
    itinerary: [
      { id: 'naju-river-1', time: '09:30', name: '광주 출발', type: 'transport', durationMinutes: 45 },
      { id: 'naju-river-2', time: '10:30', name: '영산강 둔치', type: 'place', durationMinutes: 80, note: '강바람을 맞으며 평탄한 길을 걸어요.' },
      { id: 'naju-river-3', time: '12:20', name: '나주곰탕 식사', type: 'food', durationMinutes: 60 },
      { id: 'naju-river-4', time: '14:00', name: '빛가람 전망대', type: 'place', durationMinutes: 70 },
    ],
    localFood: [{ id: 'naju-river-food', name: '나주곰탕', description: '강변 산책 뒤 든든하게 즐기기 좋은 지역 음식이에요.' }],
    localPoints: [{ id: 'naju-river-point', title: '영산강의 넓은 시야', description: '시간에 따라 달라지는 강물과 하늘의 색을 살펴보세요.' }],
    scenePrompts: ['강변에서 가장 오래 바라본 장면', '오늘의 하늘색', '나주에서 기억하고 싶은 맛'],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=%EB%82%98%EC%A3%BC+%EC%98%81%EC%82%B0%EA%B0%95',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=%EB%82%98%EC%A3%BC+%EC%98%81%EC%82%B0%EA%B0%95',
  },
  'mokpo-port-culture': {
    description: '목포의 근대문화 거리와 항구의 맛을 이어 걷는 코스예요.',
    itinerary: [
      { id: 'mokpo-port-1', time: '09:00', name: '광주송정역 출발', type: 'transport', durationMinutes: 55 },
      { id: 'mokpo-port-2', time: '10:10', name: '목포 근대역사관', type: 'place', durationMinutes: 70 },
      { id: 'mokpo-port-3', time: '12:00', name: '항구 백반 식사', type: 'food', durationMinutes: 60 },
      { id: 'mokpo-port-4', time: '13:30', name: '근대문화 거리', type: 'place', durationMinutes: 80 },
      { id: 'mokpo-port-5', time: '15:20', name: '목포항 산책', type: 'place', durationMinutes: 50 },
    ],
    localFood: [{ id: 'mokpo-baekban', name: '목포 항구 백반', description: '제철 해산물 반찬을 한 상에서 만날 수 있어요.' }],
    localPoints: [{ id: 'mokpo-port-point', title: '근대 건축과 항구 풍경', description: '오래된 건물의 외벽과 항구의 색을 함께 비교해보세요.' }],
    scenePrompts: ['근대 건물에서 발견한 디테일', '항구의 소리와 색', '목포에서 맛본 한 접시'],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=%EB%AA%A9%ED%8F%AC+%EA%B7%BC%EB%8C%80%EC%97%AD%EC%82%AC%EA%B4%80',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=%EB%AA%A9%ED%8F%AC+%EA%B7%BC%EB%8C%80%EC%97%AD%EC%82%AC%EA%B4%80',
  },
  'mokpo-seaside-day': {
    description: '목포의 바다와 언덕 풍경을 천천히 이어보는 하루 코스예요.',
    itinerary: [
      { id: 'mokpo-sea-1', time: '09:00', name: '광주 출발', type: 'transport', durationMinutes: 70 },
      { id: 'mokpo-sea-2', time: '10:30', name: '고하도 해상데크', type: 'place', durationMinutes: 90 },
      { id: 'mokpo-sea-3', time: '12:40', name: '목포 해산물 식사', type: 'food', durationMinutes: 70 },
      { id: 'mokpo-sea-4', time: '14:30', name: '유달산 둘레길', type: 'place', durationMinutes: 100 },
    ],
    localFood: [{ id: 'mokpo-seafood', name: '목포 해산물', description: '바다 가까운 식당에서 계절 해산물을 경험해보세요.' }],
    localPoints: [{ id: 'mokpo-sea-point', title: '바다와 도시가 만나는 시선', description: '고하도와 유달산에서 서로 다른 목포의 전경을 만나요.' }],
    scenePrompts: ['바다 위에서 발견한 빛', '멀리 보이는 목포의 윤곽', '오늘 가장 오래 걸은 길'],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=%EB%AA%A9%ED%8F%AC+%EA%B3%A0%ED%95%98%EB%8F%84',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=%EB%AA%A9%ED%8F%AC+%EA%B3%A0%ED%95%98%EB%8F%84',
  },
}
