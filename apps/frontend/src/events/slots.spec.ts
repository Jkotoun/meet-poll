import { describe, expect, it } from 'bun:test';
import { formatTimeRange, groupByDay, toSlot } from './slots';

const slot = (id: string, startsAt: string, endsAt: string) => ({
  id,
  startsAt,
  endsAt,
});

describe('groupByDay', () => {
  it('groups slots by calendar day in the event time zone', () => {
    const slots = [
      slot('a', '2026-11-02T08:00:00.000Z', '2026-11-02T09:00:00.000Z'),
      slot('b', '2026-11-02T23:30:00.000Z', '2026-11-03T00:30:00.000Z'),
      slot('c', '2026-11-03T08:00:00.000Z', '2026-11-03T09:00:00.000Z'),
    ];

    const days = groupByDay(slots, 'Europe/Prague');

    expect(days).toEqual([
      { label: 'Monday, 2 November 2026', slots: [slots[0]] },
      { label: 'Tuesday, 3 November 2026', slots: [slots[1], slots[2]] },
    ]);
  });
});

describe('formatTimeRange', () => {
  it('shows start and end in the event time zone', () => {
    const range = formatTimeRange(
      slot('a', '2026-11-02T08:00:00.000Z', '2026-11-02T09:30:00.000Z'),
      'Europe/Prague',
    );

    expect(range).toBe('09:00 – 10:30');
  });
});

describe('toSlot', () => {
  it('reads the row in the browser time zone, across a DST change', () => {
    const original = process.env.TZ;
    process.env.TZ = 'Europe/Prague';
    try {
      expect(
        toSlot({ date: '2026-03-29', start: '01:00', end: '04:00' }),
      ).toEqual({
        startsAt: '2026-03-29T00:00:00.000Z',
        endsAt: '2026-03-29T02:00:00.000Z',
      });
    } finally {
      if (original === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = original;
      }
    }
  });
});
