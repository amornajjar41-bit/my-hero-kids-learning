export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function diffDays(aISO: string, bISO: string): number {
  if (!aISO || !bISO) return 0;
  const a = new Date(aISO + "T00:00:00Z").getTime();
  const b = new Date(bISO + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

export function trialDaysLeft(startedAt: string): number {
  if (!startedAt) return 3;
  const start = new Date(startedAt).getTime();
  const elapsed = (Date.now() - start) / 86400000;
  return Math.max(0, Math.ceil(3 - elapsed));
}

export function isBirthdayToday(isoBirthday?: string): boolean {
  if (!isoBirthday) return false;
  const today = new Date();
  const b = new Date(isoBirthday);
  return today.getDate() === b.getDate() && today.getMonth() === b.getMonth();
}

export function dayOfWeekIndex(): number {
  // Sunday = 0
  return new Date().getDay();
}

export function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function timeUntilMidnight(): string {
  const now = new Date();
  const ms =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
    ).getTime() - now.getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
