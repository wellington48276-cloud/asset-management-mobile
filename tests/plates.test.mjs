import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRange, folderFromPlates, onlyDigits, replacePlate } from '../src/utils/plates.js';

test('gera intervalo preservando zeros à esquerda', () => {
  assert.deepEqual(buildRange('0008', '0011'), ['0008', '0009', '0010', '0011']);
});

test('rejeita intervalo invertido ou maior que o limite', () => {
  assert.deepEqual(buildRange('20', '10'), []);
  assert.deepEqual(buildRange('1', '5001'), []);
});

test('gera o nome exato da pasta', () => {
  assert.equal(folderFromPlates(['2005']), '2005');
  assert.equal(folderFromPlates(['2005', '2006', '2007']), '2005 a 2007');
});

test('substitui uma chapa sem aceitar duplicidade', () => {
  assert.deepEqual(replacePlate(['10', '11'], 1, '12'), ['10', '12']);
  assert.deepEqual(replacePlate(['10', '11'], 1, '10'), ['10', '11']);
});

test('remove caracteres não numéricos', () => {
  assert.equal(onlyDigits('AB-0012'), '0012');
});
