interface TimeRange {
  startsAt: string;
  endsAt: string;
}

interface Day<T> {
  label: string;
  slots: T[];
}

// A fixed locale, so server and browser render the same text.
const LOCALE = 'en-GB';

// Days are the event's calendar days; slots arrive sorted by start.
export function groupByDay<T extends TimeRange>(
  slots: T[],
  timeZone: string,
): Day<T>[] {
  const days = new Map<string, T[]>();
  for (const slot of slots) {
    const label = formatDay(slot, timeZone);
    days.set(label, [...(days.get(label) ?? []), slot]);
  }
  return [...days].map(([label, daySlots]) => ({ label, slots: daySlots }));
}

function formatDay(slot: TimeRange, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    dateStyle: 'full',
  }).format(new Date(slot.startsAt));
}

export function formatSlot(slot: TimeRange, timeZone: string): string {
  return `${formatDay(slot, timeZone)}, ${formatTimeRange(slot, timeZone)}`;
}

// Not `formatRange`: its separator differs between ICU builds (macOS vs Linux).
export function formatTimeRange(slot: TimeRange, timeZone: string): string {
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
