import type { BookingRule, Selection, FixedSlotRuleConfig, FixedDurationRuleConfig, MinMaxDurationRuleConfig } from './types';

/**
 * Base rule class that implements common functionality
 */
export class BaseRule implements BookingRule {
  name: string;
  days: number[];
  studios: (number | string)[];
  
  constructor(config: { name: string; days: number[]; studios: (number | string)[] }) {
    this.name = config.name || '';
    this.days = config.days || [];
    this.studios = config.studios || [];
  }
  
  /**
   * Checks if this rule applies to the given day, studio, and time range
   */
  applies(dayIdx: number, studioIdx: number, startHour: number, endHour: number): boolean {
    // Check if this rule applies to this day and studio
    const allDays = this.days.length === 0;
    const allStudios = this.studios.length === 0;
    
    return (allDays || this.days.includes(dayIdx)) && 
           (allStudios || this.studios.includes(studioIdx) || 
            typeof this.studios[0] === 'string' && this.studios.includes(`Studio ${studioIdx + 1}`));
  }
  
  /**
   * Validates whether a selection satisfies this rule
   */
  validate(dayIdx: number, studioIdx: number, startHour: number, endHour: number): boolean {
    // Base validation just checks if rule applies
    return this.applies(dayIdx, studioIdx, startHour, endHour);
  }
  
  /**
   * Calculates a selection based on the rule
   */
  calculateSelection(dayIdx: number, timeIdx: number, studioIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection {
    // Default implementation - single hour selection
    return {
      dayIdx,
      studioIdx,
      startHourIdx: timeIdx,
      endHourIdx: timeIdx
    };
  }
}

/**
 * Fixed Slot Rule - Only allows booking in specific fixed time slots
 * Example: Studios 1-3 can only be booked in 4-hour blocks: 10-14, 14-18, 18-22
 */
export class FixedSlotRule extends BaseRule {
  slots: [number, number][];
  
  constructor(config: FixedSlotRuleConfig) {
    super(config);
    this.slots = config.slots || [];
  }
  
  validate(dayIdx: number, studioIdx: number, startHour: number, endHour: number): boolean {
    if (!this.applies(dayIdx, studioIdx, startHour, endHour)) return true;
    
    // Must match one of the predefined slots exactly
    return this.slots.some(([slotStart, slotEnd]) => 
      startHour === slotStart && endHour === slotEnd - 1
    );
  }
  
  calculateSelection(dayIdx: number, timeIdx: number, studioIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection {
    if (!this.applies(dayIdx, studioIdx, 0, 23)) {
      return {
        dayIdx,
        studioIdx,
        startHourIdx: timeIdx,
        endHourIdx: timeIdx
      };
    }
    
    // Find the slot that contains this time
    const slot = this.slots.find(([start, end]) => 
      timeIdx >= start && timeIdx < end
    );
    
    if (!slot) {
      // Find the closest slot
      const nextSlot = this.slots.find(([start]) => start > timeIdx);
      if (nextSlot) {
        // Check if any part of the slot is booked
        for (let i = nextSlot[0]; i < nextSlot[1]; i++) {
          if (isBooked(dayIdx, i, studioIdx)) {
            // If slot is partially booked, return single hour selection
            return { dayIdx, studioIdx, startHourIdx: timeIdx, endHourIdx: timeIdx };
          }
        }
        
        return {
          dayIdx,
          studioIdx,
          startHourIdx: nextSlot[0],
          endHourIdx: nextSlot[1] - 1
        };
      }
      // Default to single hour if no matching slot
      return { dayIdx, studioIdx, startHourIdx: timeIdx, endHourIdx: timeIdx };
    }
    
    // Check if any part of the slot is booked
    for (let i = slot[0]; i < slot[1]; i++) {
      if (isBooked(dayIdx, i, studioIdx)) {
        // If slot is partially booked, return single hour selection
        return { dayIdx, studioIdx, startHourIdx: timeIdx, endHourIdx: timeIdx };
      }
    }
    
    return {
      dayIdx,
      studioIdx,
      startHourIdx: slot[0],
      endHourIdx: slot[1] - 1
    };
  }
}

/**
 * Fixed Duration Rule - Enforces a specific block size for bookings
 * Example: Weekdays in Studios 1-2 must be booked in 4-hour blocks between 10-22
 */
export class FixedDurationRule extends BaseRule {
  startHour: number;
  endHour: number;
  duration: number;
  
  constructor(config: FixedDurationRuleConfig) {
    super(config);
    this.startHour = config.startHour;
    this.endHour = config.endHour;
    this.duration = config.duration;
  }
  
  validate(dayIdx: number, studioIdx: number, startHour: number, endHour: number): boolean {
    if (!this.applies(dayIdx, studioIdx, startHour, endHour)) return true;
    
    // Check if within allowed time range
    if (startHour < this.startHour || endHour >= this.endHour) return false;
    
    // Check if duration matches
    return (endHour - startHour + 1) === this.duration;
  }
  
  calculateSelection(dayIdx: number, timeIdx: number, studioIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection {
    if (!this.applies(dayIdx, studioIdx, 0, 23)) {
      return {
        dayIdx,
        studioIdx,
        startHourIdx: timeIdx,
        endHourIdx: timeIdx
      };
    }
    
    // Enforce time constraints
    let start = Math.max(timeIdx, this.startHour);
    let maxPossibleEnd = Math.min(start + this.duration - 1, this.endHour - 1);
    
    // Check for bookings within the range
    let end = start;
    for (let i = 1; i < this.duration; i++) {
      if (start + i > maxPossibleEnd) break;
      if (isBooked(dayIdx, start + i, studioIdx)) break;
      end = start + i;
    }
    
    // If we couldn't get the full duration, check if we can start earlier
    if (end - start + 1 < this.duration && start > this.startHour) {
      // Try to find an earlier starting point
      for (let newStart = start - 1; newStart >= this.startHour; newStart--) {
        if (isBooked(dayIdx, newStart, studioIdx)) break;
        
        // See if this new start gives us the full duration
        let newEnd = end;
        if (newEnd - newStart + 1 < this.duration) {
          for (let i = end + 1; i < newStart + this.duration && i < this.endHour; i++) {
            if (isBooked(dayIdx, i, studioIdx)) break;
            newEnd = i;
            if (newEnd - newStart + 1 === this.duration) break;
          }
        }
        
        if (newEnd - newStart + 1 === this.duration) {
          start = newStart;
          end = newEnd;
          break;
        }
      }
    }
    
    return {
      dayIdx,
      studioIdx,
      startHourIdx: start,
      endHourIdx: end
    };
  }
}

/**
 * Min/Max Duration Rule - Allows flexible duration within constraints
 * Example: Evening hours in Studio 3 can be booked for 1-2 hours between 15-20
 */
export class MinMaxDurationRule extends BaseRule {
  startHour: number;
  endHour: number;
  minDuration: number;
  maxDuration: number;
  
  constructor(config: MinMaxDurationRuleConfig) {
    super(config);
    this.startHour = config.startHour;
    this.endHour = config.endHour;
    this.minDuration = config.minDuration;
    this.maxDuration = config.maxDuration;
  }
  
  validate(dayIdx: number, studioIdx: number, startHour: number, endHour: number): boolean {
    if (!this.applies(dayIdx, studioIdx, startHour, endHour)) return true;
    
    // Check if within allowed time range
    if (startHour < this.startHour || endHour >= this.endHour) return false;
    
    // Check if duration is within min/max
    const duration = endHour - startHour + 1;
    return duration >= this.minDuration && duration <= this.maxDuration;
  }
  
  calculateSelection(dayIdx: number, timeIdx: number, studioIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection {
    if (!this.applies(dayIdx, studioIdx, 0, 23)) {
      return {
        dayIdx,
        studioIdx,
        startHourIdx: timeIdx,
        endHourIdx: timeIdx
      };
    }
    
    let start = Math.max(timeIdx, this.startHour);
    
    // Try to get at least minDuration hours, up to maxDuration
    let end = start;
    const maxToCheck = Math.min(this.maxDuration, this.endHour - start);
    
    for (let i = 1; i < maxToCheck; i++) {
      const nextIdx = start + i;
      if (isBooked(dayIdx, nextIdx, studioIdx)) break;
      end = nextIdx;
      if (end - start + 1 >= this.maxDuration) break;
    }
    
    // If we couldn't get the minimum duration, try starting earlier
    if (end - start + 1 < this.minDuration && start > this.startHour) {
      // Look for an earlier start time
      for (let newStart = start - 1; newStart >= this.startHour; newStart--) {
        if (isBooked(dayIdx, newStart, studioIdx)) break;
        
        if (end - newStart + 1 >= this.minDuration) {
          start = newStart;
          break;
        }
      }
    }
    
    return {
      dayIdx,
      studioIdx,
      startHourIdx: start,
      endHourIdx: end
    };
  }
}

/**
 * Booking Rule Engine - Manages and applies all booking rules
 */
export class BookingRuleEngine {
  private rules: BookingRule[] = [];
  
  constructor(rules: BookingRule[] = []) {
    this.rules = rules;
  }
  
  addRule(rule: BookingRule): void {
    this.rules.push(rule);
  }
  
  getApplicableRules(dayIdx: number, studioIdx: number): BookingRule[] {
    return this.rules.filter(rule => 
      rule.applies(dayIdx, studioIdx, 0, 23)
    );
  }
  
  calculateSelection(dayIdx: number, timeIdx: number, studioIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection {
    const applicableRules = this.getApplicableRules(dayIdx, studioIdx);
    
    if (applicableRules.length === 0) {
      // Default rule (single hour selection)
      return { dayIdx, studioIdx, startHourIdx: timeIdx, endHourIdx: timeIdx };
    }
    
    // Apply the first matching rule (or implement priority logic if needed)
    return applicableRules[0].calculateSelection(dayIdx, timeIdx, studioIdx, isBooked);
  }
  
  validateSelection(selection: Selection): boolean {
    if (!selection) return true;
    
    const applicableRules = this.getApplicableRules(
      selection.dayIdx, 
      selection.studioIdx
    );
    
    // All applicable rules must be satisfied
    return applicableRules.every(rule => 
      rule.validate(
        selection.dayIdx, 
        selection.studioIdx, 
        selection.startHourIdx, 
        selection.endHourIdx
      )
    );
  }
}