import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ItineraryTimeline } from './ItineraryTimeline.tsx'

describe('ItineraryTimeline', () => {
  it('대중교통과 도보 일정을 구분해 표시한다', () => {
    render(
      <ItineraryTimeline
        items={[
          {
            id: 'transport',
            name: '유스퀘어 → 나주버스터미널',
            type: 'transport',
          },
          {
            id: 'walk',
            name: '나주버스터미널 → 금성관',
            type: 'walk',
          },
        ]}
      />,
    )

    expect(screen.getByText('대중교통')).toBeInTheDocument()
    expect(screen.getByText('도보')).toBeInTheDocument()
  })
})
