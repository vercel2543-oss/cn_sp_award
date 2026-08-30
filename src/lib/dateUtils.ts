/**
 * Thai Date & Time Utilities
 * Provides formatting for Thai Buddhist Era (พ.ศ.), Thai Days, and Thai Months.
 * Example outputs:
 * - Full: "วันจันทร์ที่ 30 มกราคม พ.ศ. 2569"
 * - Standard: "30 มกราคม พ.ศ. 2569"
 * - Short: "30 ม.ค. 2569"
 * - Full DateTime: "วันจันทร์ที่ 30 มกราคม พ.ศ. 2569 เวลา 14:30 น."
 */

export const THAI_DAYS = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์'
];

export const THAI_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.'
];

/**
 * Safely parses any date representation into a JavaScript Date and decomposed components
 */
export function parseDateComponents(dateInput: string | number | Date | null | undefined): {
  dateObj: Date | null;
  dayOfWeek: number;
  day: number;
  month: number; // 0-11
  yearCE: number;
  yearBE: number;
  hours: number;
  minutes: number;
  seconds: number;
  isValid: boolean;
} {
  if (!dateInput) {
    return {
      dateObj: null,
      dayOfWeek: 0,
      day: 1,
      month: 0,
      yearCE: 2026,
      yearBE: 2569,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isValid: false
    };
  }

  // If already Date object
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) {
      return {
        dateObj: null,
        dayOfWeek: 0,
        day: 1,
        month: 0,
        yearCE: 2026,
        yearBE: 2569,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isValid: false
      };
    }
    const year = dateInput.getFullYear();
    const yearBE = year < 2400 ? year + 543 : year;
    const yearCE = year >= 2400 ? year - 543 : year;
    return {
      dateObj: dateInput,
      dayOfWeek: dateInput.getDay(),
      day: dateInput.getDate(),
      month: dateInput.getMonth(),
      yearCE,
      yearBE,
      hours: dateInput.getHours(),
      minutes: dateInput.getMinutes(),
      seconds: dateInput.getSeconds(),
      isValid: true
    };
  }

  // If timestamp number
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const yearBE = year < 2400 ? year + 543 : year;
      const yearCE = year >= 2400 ? year - 543 : year;
      return {
        dateObj: d,
        dayOfWeek: d.getDay(),
        day: d.getDate(),
        month: d.getMonth(),
        yearCE,
        yearBE,
        hours: d.getHours(),
        minutes: d.getMinutes(),
        seconds: d.getSeconds(),
        isValid: true
      };
    }
  }

  // If string
  const str = String(dateInput).trim();

  // Check YYYY-MM-DD pattern
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (ymdMatch) {
    let year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const hours = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0;
    const minutes = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
    const seconds = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0;

    let yearCE = year;
    let yearBE = year;
    if (year < 2400) {
      yearBE = year + 543;
    } else {
      yearCE = year - 543;
    }

    const d = new Date(yearCE, month, day, hours, minutes, seconds);
    return {
      dateObj: d,
      dayOfWeek: d.getDay(),
      day,
      month,
      yearCE,
      yearBE,
      hours,
      minutes,
      seconds,
      isValid: true
    };
  }

  // Check DD-MM-YYYY pattern
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    let yearCE = year;
    let yearBE = year;
    if (year < 2400) {
      yearBE = year + 543;
    } else {
      yearCE = year - 543;
    }
    const d = new Date(yearCE, month, day);
    return {
      dateObj: d,
      dayOfWeek: d.getDay(),
      day,
      month,
      yearCE,
      yearBE,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isValid: true
    };
  }

  // Fallback native parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const yearBE = year < 2400 ? year + 543 : year;
    const yearCE = year >= 2400 ? year - 543 : year;
    return {
      dateObj: parsed,
      dayOfWeek: parsed.getDay(),
      day: parsed.getDate(),
      month: parsed.getMonth(),
      yearCE,
      yearBE,
      hours: parsed.getHours(),
      minutes: parsed.getMinutes(),
      seconds: parsed.getSeconds(),
      isValid: true
    };
  }

  // If completely custom or unrecognized, return fallback with raw string
  return {
    dateObj: null,
    dayOfWeek: 0,
    day: 1,
    month: 0,
    yearCE: 2026,
    yearBE: 2569,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isValid: false
  };
}

/**
 * Formats date into Full Thai format with Day of Week and Buddhist Era:
 * e.g. "วันจันทร์ที่ 30 มกราคม พ.ศ. 2569"
 */
export function formatThaiDateFull(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '-';
  const c = parseDateComponents(dateInput);
  if (!c.isValid) {
    return String(dateInput);
  }
  const dayName = THAI_DAYS[c.dayOfWeek];
  const monthName = THAI_MONTHS_FULL[c.month] || '';
  return `${dayName}ที่ ${c.day} ${monthName} พ.ศ. ${c.yearBE}`;
}

/**
 * Formats date into standard Thai format with or without prefix "พ.ศ.":
 * e.g. "30 มกราคม พ.ศ. 2569" (with prefix) or "30 มกราคม 2569"
 */
export function formatThaiDate(
  dateInput: string | number | Date | null | undefined,
  includePrefixBE: boolean = false
): string {
  if (!dateInput) return '-';
  const c = parseDateComponents(dateInput);
  if (!c.isValid) {
    return String(dateInput);
  }
  const monthName = THAI_MONTHS_FULL[c.month] || '';
  const prefix = includePrefixBE ? 'พ.ศ. ' : '';
  return `${c.day} ${monthName} ${prefix}${c.yearBE}`;
}

/**
 * Formats date into short/compact Thai format:
 * e.g. "30 ม.ค. 2569" or "30 ม.ค. 69"
 */
export function formatThaiDateShort(
  dateInput: string | number | Date | null | undefined,
  shortYear: boolean = false
): string {
  if (!dateInput) return '-';
  const c = parseDateComponents(dateInput);
  if (!c.isValid) {
    return String(dateInput);
  }
  const monthName = THAI_MONTHS_SHORT[c.month] || '';
  const yr = shortYear ? String(c.yearBE).slice(-2) : c.yearBE;
  return `${c.day} ${monthName} ${yr}`;
}

/**
 * Formats date with time in Thai:
 * e.g. "30 ม.ค. 2569 เวลา 14:30 น." or full "วันจันทร์ที่ 30 มกราคม พ.ศ. 2569 เวลา 14:30 น."
 */
export function formatThaiDateTime(
  dateInput: string | number | Date | null | undefined,
  full: boolean = false
): string {
  if (!dateInput) return '-';
  const c = parseDateComponents(dateInput);
  if (!c.isValid) {
    return String(dateInput);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `เวลา ${pad(c.hours)}:${pad(c.minutes)} น.`;

  if (full) {
    const dayName = THAI_DAYS[c.dayOfWeek];
    const monthName = THAI_MONTHS_FULL[c.month] || '';
    return `${dayName}ที่ ${c.day} ${monthName} พ.ศ. ${c.yearBE} ${timeStr}`;
  }

  const monthName = THAI_MONTHS_SHORT[c.month] || '';
  return `${c.day} ${monthName} ${c.yearBE} ${timeStr}`;
}

/**
 * Helper to get current Thai Date string formatted as full or standard
 */
export function getCurrentThaiDateFull(): string {
  return formatThaiDateFull(new Date());
}
