import { describe, expect, it } from 'bun:test';
import { rankSlots } from './ranking.js';

describe('rankSlots', () => {
  it('ranks by how many can attend', () => {
    expect(
      rankSlots([
        { yes: 1, ifNeedBe: 0 },
        { yes: 1, ifNeedBe: 2 },
        { yes: 2, ifNeedBe: 0 },
      ]),
    ).toEqual([3, 1, 2]);
  });

  it('breaks a tie in attendance by more yes votes', () => {
    expect(
      rankSlots([
        { yes: 1, ifNeedBe: 2 },
        { yes: 3, ifNeedBe: 0 },
      ]),
    ).toEqual([2, 1]);
  });

  it('gives equal tallies the same rank and skips the next', () => {
    expect(
      rankSlots([
        { yes: 2, ifNeedBe: 1 },
        { yes: 0, ifNeedBe: 1 },
        { yes: 2, ifNeedBe: 1 },
      ]),
    ).toEqual([1, 3, 1]);
  });

  it('ranks slots without votes as equal', () => {
    expect(
      rankSlots([
        { yes: 0, ifNeedBe: 0 },
        { yes: 0, ifNeedBe: 0 },
      ]),
    ).toEqual([1, 1]);
  });

  it('ranks no slots', () => {
    expect(rankSlots([])).toEqual([]);
  });
});
