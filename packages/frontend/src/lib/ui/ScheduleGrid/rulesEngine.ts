import {
  BookingRuleEngine,
  FixedDurationRule,
  FixedSlotRule,
  MinMaxDurationRule,
  TimeRangeRule
} from './rules-selection';

/**
 * Establish the rules per studio
 * */
export const ruleEngine = new BookingRuleEngine([
  // Early morning rule: Studios 1-3 can be booked in 1-hour increments before 10am
  new TimeRangeRule({
    name: 'Early morning 1h blocks',
    days: [], // All days
    studios: [0, 1, 2], // Studios 1, 2, 3 (0-indexed)
    startHour: 0,
    endHour: 10,
    incrementSize: 1
  }),
  // Late evening rule: Studios 1-3 can be booked in 1-hour increments after 10pm
  new TimeRangeRule({
    name: 'Late evening 1h blocks',
    days: [], // All days
    studios: [0, 1, 2], // Studios 1, 2, 3 (0-indexed)
    startHour: 22,
    endHour: 24,
    incrementSize: 1
  }),
  // Fixed slot rule example: Studios 1-3 can only be booked in 4-hour blocks at specific times
  new FixedSlotRule({
    name: '3×4h windows',
    days: [], // All days
    studios: [0, 1, 2], // Studios 1, 2, 3 (0-indexed)
    slots: [
      [10, 14],
      [14, 18],
      [18, 22]
    ]
  }),
  // Fixed duration rule example: Weekdays in Studios 1-2 must be booked in 4-hour blocks
  new FixedDurationRule({
    name: 'Weekday 4h fixed blocks',
    days: [1, 2, 3, 4, 5], // Weekdays (Monday = 1)
    studios: [0, 1], // Studios 1-2 (0-indexed)
    startHour: 10,
    endHour: 22,
    duration: 4
  }),
  // Min/Max duration rule: Evening in Studio 3 can be booked for 1-2 hours
  new MinMaxDurationRule({
    name: 'Evening max 2h',
    days: [], // All days
    studios: [2], // Studio 3 (0-indexed)
    startHour: 15,
    endHour: 20,
    minDuration: 1,
    maxDuration: 2
  })
]);
