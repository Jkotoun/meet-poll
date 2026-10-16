import type { components } from '@/api/schema';

export type TimeSlot = components['schemas']['TimeSlotDto'];

interface Day {
  label: string;
  slots: TimeSlot[];
}

// A fixed locale, so server and browser render the same text.
const LOCALE = 'en-GB';

// Days are the event's calendar days; slots arrive sorted by start.
export function groupByDay(slots: TimeSlot[], timeZone: string): Day[] {
  const dayFormat = new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    dateStyle: 'full',
  });
  const days = new Map<string, TimeSlot[]>();
  for (const slot of slots) {
    const label = dayFormat.format(new Date(slot.startsAt));
    days.set(label, [...(days.get(label) ?? []), slot]);
  }
  return [...days].map(([label, daySlots]) => ({ label, slots: daySlots }));
}

// Not `formatRange`: its separator differs between ICU builds (macOS vs Linux).
export function formatTimeRange(slot: TimeSlot, timeZone: string): string {
  const time = new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return `${time.format(new Date(slot.startsAt))} – ${time.format(new Date(slot.endsAt))}`;
}

export interface SlotRow {
  date: string;
  start: string;
  end: string;
}

// Rows are in the browser's time zone, which also becomes the event's.
export function toSlot({ date, start, end }: SlotRow) {
  return {
    startsAt: new Date(`${date}T${start}`).toISOString(),
    endsAt: new Date(`${date}T${end}`).toISOString(),
  };
}
