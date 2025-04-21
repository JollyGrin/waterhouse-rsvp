export type Selection = {
	dayIdx: number;
	studioIdx: number;
	startHourIdx: number;
	endHourIdx: number;
} | null;

// Base rule interface
export interface BookingRule {
  name: string;
  days: number[]; // empty means all days
  studios: (number | string)[]; // studio indices or names
  applies(dayIdx: number, studioIdx: number, startHour: number, endHour: number): boolean;
  validate(dayIdx: number, studioIdx: number, startHour: number, endHour: number): boolean;
  calculateSelection(dayIdx: number, timeIdx: number, studioIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection;
}

// Fixed slot rule (only specific time windows)
export interface FixedSlotRuleConfig {
  name: string;
  days: number[]; // empty means all days
  studios: (number | string)[]; // studio indices or names
  slots: [number, number][]; // array of [start, end] pairs
}

// Fixed duration rule (set block size)
export interface FixedDurationRuleConfig {
  name: string;
  days: number[]; // empty means all days
  studios: (number | string)[]; // studio indices or names
  startHour: number;
  endHour: number;
  duration: number;
}

// Min/Max duration rule
export interface MinMaxDurationRuleConfig {
  name: string;
  days: number[]; // empty means all days
  studios: (number | string)[]; // studio indices or names
  startHour: number;
  endHour: number;
  minDuration: number;
  maxDuration: number;
}
