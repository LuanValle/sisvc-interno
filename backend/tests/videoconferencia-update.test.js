import test from 'node:test'
import assert from 'node:assert/strict'
import { isCompletionOnlyPatch } from '../api/_validators.js'

test('aceita uma alteracao contendo somente o status de conclusao', () => {
  assert.equal(isCompletionOnlyPatch({ concluida: true }), true)
  assert.equal(isCompletionOnlyPatch({ concluida: false }), true)
})

test('nao confunde edicao de dados com alteracao exclusiva de status', () => {
  assert.equal(isCompletionOnlyPatch({ concluida: true, nome: 'VC alterada' }), false)
  assert.equal(isCompletionOnlyPatch({ concluida: 'true' }), false)
  assert.equal(isCompletionOnlyPatch({}), false)
})
