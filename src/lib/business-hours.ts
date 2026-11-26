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

const DAY_LABELS: Record<string, string> = {
  sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat",
};

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function fmt12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${ampm}` : `${h12} ${ampm}`;
}

export function isOpenNow(hours: BusinessHour[]): { open: boolean; label: string } {
  const { minutes, day } = istNow();
  const today = hours.find((h) => DAY_INDEX[h.day.toLowerCase()] === day);
  if (!today || today.closed) return { open: false, label: "Closed today" };
  const openMin = toMinutes(today.open);
  const closeMin = toMinutes(today.close);
  if (minutes >= openMin && minutes < closeMin) {
    return { open: true, label: `Open · Closes ${fmt12(today.close)}` };
  }
  if (minutes < openMin) return { open: false, label: `Closed · Opens ${fmt12(today.open)}` };
  return { open: false, label: `Closed · Opens tomorrow` };
}

export type DaySchedule = {
  day: string;   // short label e.g. "Mon"
  hours: string; // e.g. "9 AM – 9 PM" or "Closed"
  isToday: boolean;
};

export function weeklySchedule(hours: BusinessHour[]): DaySchedule[] {
  const { day: todayIdx } = istNow();
  const ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  return ORDER.map((d) => {
    const entry = hours.find((h) => h.day.toLowerCase() === d);
    return {
      day: DAY_LABELS[d],
      hours: !entry || entry.closed ? "Closed" : `${fmt12(entry.open)} – ${fmt12(entry.close)}`,
      isToday: DAY_INDEX[d] === todayIdx,
    };
  });
}
