function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayIsoDate(): string {
  return toIsoDate(new Date());
}

export function shiftIsoDate(isoDate: string, days: number): string {
  const nextDate = parseIsoDate(isoDate);
  nextDate.setDate(nextDate.getDate() + days);
  return toIsoDate(nextDate);
}

export function formatIsoDate(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function isTodayIsoDate(isoDate: string): boolean {
  return isoDate === getTodayIsoDate();
}
