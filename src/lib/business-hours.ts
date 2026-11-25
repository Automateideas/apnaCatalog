import type { BusinessHour } from "@/db/schema";

const IST_OFFSET = 5.5 * 60;

function istNow() {
  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = (utcMinutes + IST_OFFSET) % (24 * 60);
  const istDay = new Date(now.getTime() + IST_OFFSET * 60_000).getUTCDay();
  return { minutes: istMinutes, day: istDay };
}

const DAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function isOpenNow(hours: BusinessHour[]): { open: boolean; label: string } {
  const { minutes, day } = istNow();
  const today = hours.find((h) => DAY_INDEX[h.day.toLowerCase()] === day);
  if (!today || today.closed) return { open: false, label: "Closed today" };
  const openMin = toMinutes(today.open);
  const closeMin = toMinutes(today.close);
  if (minutes >= openMin && minutes < closeMin) {
    return { open: true, label: `Open · Closes ${today.close}` };
  }
  if (minutes < openMin) return { open: false, label: `Closed · Opens ${today.open}` };
  return { open: false, label: `Closed · Opens tomorrow` };
}
