import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { NoResultsState } from './NoResultsState.tsx'

describe('NoResultsState', () => {
  it('추천 API가 계산한 조건 완화 제안을 표시한다', () => {
    render(
      <NoResultsState
        suggestions={[
          '가능 시간을 하루 종일로 바꾸면 2개 코스를 추천할 수 있어요.',
        ]}
        onReset={vi.fn()}
        onHome={vi.fn()}
      />,
    )

    expect(
      screen.getByText(
        '가능 시간을 하루 종일로 바꾸면 2개 코스를 추천할 수 있어요.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('다른 출발지 선택하기'),
    ).not.toBeInTheDocument()
  })
})
