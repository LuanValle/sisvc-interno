import test from 'node:test'
import assert from 'node:assert/strict'
import { getMonthRange } from '../api/_availability.js'
import { isValidTimeRange, timeRangesOverlap } from '../api/_schedule.js'

test('calcula corretamente o intervalo de um mes', () => {
  assert.deepEqual(getMonthRange('2026-06'), {
    month: '2026-06',
    start: '2026-06-01',
    end: '2026-06-30',
  })

  assert.equal(getMonthRange('2028-02').end, '2028-02-29')
})

test('rejeita meses invalidos', () => {
  assert.equal(getMonthRange('2026-13'), null)
  assert.equal(getMonthRange('junho'), null)
  assert.equal(getMonthRange(''), null)
})

test('valida o periodo escolhido', () => {
  assert.equal(isValidTimeRange('08:00', '09:30'), true)
  assert.equal(isValidTimeRange('09:30', '09:30'), false)
  assert.equal(isValidTimeRange('10:00', '09:00'), false)
})

test('detecta apenas periodos que realmente se sobrepoem', () => {
  assert.equal(timeRangesOverlap('08:00', '10:00', '09:00', '11:00'), true)
  assert.equal(timeRangesOverlap('08:00', '10:00', '10:00', '11:00'), false)
  assert.equal(timeRangesOverlap('18:00', '19:00', '16:30', '17:30'), false)
})
