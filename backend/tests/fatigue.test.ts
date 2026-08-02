import assert from 'node:assert/strict'
import test from 'node:test'

import {
  calculateFatigue,
  classifyRoundTripTransitBurden,
  classifyTransferBurden,
  classifyWalkingBurden,
} from '../src/recommendations/fatigue.ts'

test('classifies walking burden by product thresholds', () => {
  assert.equal(classifyWalkingBurden(15), 'LOW')
  assert.equal(classifyWalkingBurden(16), 'MEDIUM')
  assert.equal(classifyWalkingBurden(35), 'MEDIUM')
  assert.equal(classifyWalkingBurden(36), 'HIGH')
})

test('classifies transfer burden by product thresholds', () => {
  assert.equal(classifyTransferBurden(0), 'LOW')
  assert.equal(classifyTransferBurden(1), 'MEDIUM')
  assert.equal(classifyTransferBurden(2), 'HIGH')
})

test('classifies round-trip transit burden by product thresholds', () => {
  assert.equal(classifyRoundTripTransitBurden(90), 'LOW')
  assert.equal(classifyRoundTripTransitBurden(91), 'MEDIUM')
  assert.equal(classifyRoundTripTransitBurden(180), 'MEDIUM')
  assert.equal(classifyRoundTripTransitBurden(181), 'HIGH')
})

test('calculates low overall fatigue for easy mobility metrics', () => {
  assert.deepEqual(
    calculateFatigue({
      walkingMinutes: 12,
      transferCount: 0,
      roundTripTransitMinutes: 80,
    }),
    {
      level: 'LOW',
      score: 1,
      factors: {
        walking: { level: 'LOW', score: 1, value: 12, weight: 0.4 },
        transfers: { level: 'LOW', score: 1, value: 0, weight: 0.35 },
        roundTripTransit: { level: 'LOW', score: 1, value: 80, weight: 0.25 },
      },
    },
  )
})

test('calculates medium overall fatigue when one factor is high', () => {
  const result = calculateFatigue({
    walkingMinutes: 10,
    transferCount: 0,
    roundTripTransitMinutes: 181,
  })

  assert.equal(result.level, 'MEDIUM')
  assert.equal(result.score, 1.5)
  assert.equal(result.factors.roundTripTransit.level, 'HIGH')
})

test('calculates high overall fatigue for difficult mobility metrics', () => {
  const result = calculateFatigue({
    walkingMinutes: 42,
    transferCount: 2,
    roundTripTransitMinutes: 181,
  })

  assert.equal(result.level, 'HIGH')
  assert.equal(result.score, 3)
})

test('rejects invalid metrics', () => {
  assert.throws(() => classifyWalkingBurden(-1), RangeError)
  assert.throws(() => classifyTransferBurden(1.5), RangeError)
  assert.throws(() => classifyRoundTripTransitBurden(Number.NaN), RangeError)
})
