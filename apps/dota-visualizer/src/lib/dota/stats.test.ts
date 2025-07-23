import { scores } from './stats';
import { expect, test } from 'vitest';

test('basic case', () => {
  expect(scores([100, 120, 110, 130])).toEqual([0.09, 0.67, 0.33, 0.91]);
});

test('all same values', () => {
  expect(scores([115, 115, 115, 115, 115, 115])).toEqual([
    0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
  ]);
});

test('with duplicates', () => {
  expect(scores([100, 120, 120, 120, 130])).toEqual([
    0.03, 0.58, 0.58, 0.58, 0.89,
  ]);
});
