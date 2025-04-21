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
  
  /**
   * Extends an existing selection when a user clicks on an adjacent time slot
   */
  extendSelection(existingSelection: Selection, newTimeIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection {
    if (!existingSelection) return null;
    
    const { dayIdx, studioIdx, startHourIdx, endHourIdx } = existingSelection;
    
    // Only allow extending in the same day and studio
    if (!this.applies(dayIdx, studioIdx, 0, 23)) {
      return existingSelection; // Can't extend - rules don't apply
    }
    
    // Check if we're trying to extend by adding an adjacent hour
    const isForwardExtension = newTimeIdx === endHourIdx + 1;
    const isBackwardExtension = newTimeIdx === startHourIdx - 1;
    
    if (!isForwardExtension && !isBackwardExtension) {
      return existingSelection; // Only allow extending to adjacent hours
    }
    
    // Base rule allows extending by one hour in either direction
    if (isForwardExtension && !isBooked(dayIdx, newTimeIdx, studioIdx)) {
      return { ...existingSelection, endHourIdx: newTimeIdx };
    }
    
    if (isBackwardExtension && !isBooked(dayIdx, newTimeIdx, studioIdx)) {
      return { ...existingSelection, startHourIdx: newTimeIdx };
    }
    
    return existingSelection; // No change if extending into a booked slot
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
  
  /**
   * For Fixed Slot rules, we allow extending to the next available slot
   * if it's directly adjacent to the current selection.
   */
  extendSelection(existingSelection: Selection, newTimeIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection {
    if (!existingSelection) return null;
    
    const { dayIdx, studioIdx, startHourIdx, endHourIdx } = existingSelection;
    
    // Only allow extending in the same day and studio
    if (!this.applies(dayIdx, studioIdx, 0, 23)) {
      return existingSelection; // Can't extend - rules don't apply
    }
    

    
    // Determine if we're extending forward or backward
    const isForwardExtension = newTimeIdx > endHourIdx;
    const isBackwardExtension = newTimeIdx < startHourIdx;
    
    if (!isForwardExtension && !isBackwardExtension) {
      return existingSelection;
    }
    
    // Check if the current selection spans one or more complete slots
    // First, check if it starts at the beginning of a slot
    const startsAtSlotBeginning = this.slots.some(([start]) => startHourIdx === start);
    
    // Then check if it ends at the end of a slot
    const endsAtSlotEnd = this.slots.some(([_, end]) => endHourIdx === end - 1);
    
    // Alternatively, check if it spans multiple full slots
    const isMultipleOfSlotSize = this.slots.length > 0 && this.slots[0][1] - this.slots[0][0] > 0 && 
                                 (endHourIdx - startHourIdx + 1) % (this.slots[0][1] - this.slots[0][0]) === 0;
    
    if (!startsAtSlotBeginning && !endsAtSlotEnd && !isMultipleOfSlotSize) {
      // Current selection doesn't align with slot boundaries - don't extend
      return existingSelection;
    }
    
    if (isForwardExtension) {
      // Find the next slot after the current slot
      const nextSlot = this.slots.find(([start]) => start === endHourIdx + 1);
      
      if (!nextSlot) {
        return existingSelection; // No adjacent slot
      }
      
      // Check if the next slot is available
      for (let i = nextSlot[0]; i < nextSlot[1]; i++) {
        if (isBooked(dayIdx, i, studioIdx)) {
          return existingSelection; // Slot is partially booked
        }
      }
      
      // Extend to include the next slot
      return {
        dayIdx,
        studioIdx,
        startHourIdx,
        endHourIdx: nextSlot[1] - 1
      };
    }
    
    if (isBackwardExtension) {
      // Find the previous slot before the current slot
      const prevSlot = this.slots.find(([_, end]) => end === startHourIdx);
      
      if (!prevSlot) {
        return existingSelection; // No adjacent slot
      }
      
      // Check if the previous slot is available
      for (let i = prevSlot[0]; i < prevSlot[1]; i++) {
        if (isBooked(dayIdx, i, studioIdx)) {
          return existingSelection; // Slot is partially booked
        }
      }
      
      // Extend to include the previous slot
      return {
        dayIdx,
        studioIdx,
        startHourIdx: prevSlot[0],
        endHourIdx
      };
    }
    
    return existingSelection; // No change
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
  
  /**
   * For FixedDurationRule, extensions must be in blocks of the fixed duration
   */
  extendSelection(existingSelection: Selection, newTimeIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection {
    if (!existingSelection) return null;
    
    const { dayIdx, studioIdx, startHourIdx, endHourIdx } = existingSelection;
    
    // Only allow extending in the same day and studio
    if (!this.applies(dayIdx, studioIdx, 0, 23)) {
      return existingSelection; // Can't extend - rules don't apply
    }
    
    // Check if the current selection is valid for this rule
    const currentDuration = endHourIdx - startHourIdx + 1;
    
    // Allow extending if the current selection is a multiple of the fixed duration
    // This supports multi-block selections (e.g., 8 hours from two 4-hour blocks)
    if (currentDuration % this.duration !== 0) {
      // Current selection doesn't align with the fixed duration blocks
      return existingSelection;
    }
    
    // Determine if we're extending forward or backward
    const isForwardExtension = newTimeIdx === endHourIdx + 1;
    const isBackwardExtension = newTimeIdx === startHourIdx - 1;
    
    if (!isForwardExtension && !isBackwardExtension) {
      return existingSelection; // Only allow extending to adjacent hours
    }
    
    if (isForwardExtension) {
      // For fixed duration, we can only extend by a full block
      const newEndHourIdx = endHourIdx + this.duration;
      
      // Check if extension is within allowed hours
      if (newEndHourIdx >= this.endHour) {
        return existingSelection; // Outside allowed time range
      }
      
      // Check if the extended block is available
      for (let i = endHourIdx + 1; i <= newEndHourIdx; i++) {
        if (isBooked(dayIdx, i, studioIdx)) {
          return existingSelection; // Can't extend - time not available
        }
      }
      
      // Valid extension
      return {
        ...existingSelection,
        endHourIdx: newEndHourIdx
      };
    }
    
    if (isBackwardExtension) {
      // Calculate the new start time (startHourIdx - duration)
      const newStartHourIdx = startHourIdx - this.duration;
      
      // Check if extension is within allowed hours
      if (newStartHourIdx < this.startHour) {
        return existingSelection; // Outside allowed time range
      }
      
      // Check if the extended block is available
      for (let i = newStartHourIdx; i < startHourIdx; i++) {
        if (isBooked(dayIdx, i, studioIdx)) {
          return existingSelection; // Can't extend - time not available
        }
      }
      
      // Valid extension
      return {
        ...existingSelection,
        startHourIdx: newStartHourIdx
      };
    }
    
    return existingSelection; // No change
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
  
  /**
   * For MinMaxDurationRule, extensions are allowed as long as the total duration
   * stays within the min/max range
   */
  extendSelection(existingSelection: Selection, newTimeIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection {
    if (!existingSelection) return null;
    
    const { dayIdx, studioIdx, startHourIdx, endHourIdx } = existingSelection;
    
    // Only allow extending in the same day and studio
    if (!this.applies(dayIdx, studioIdx, 0, 23)) {
      return existingSelection; // Can't extend - rules don't apply
    }
    
    // Check if current selection is within time bounds
    if (startHourIdx < this.startHour || endHourIdx >= this.endHour) {
      return existingSelection; // Outside allowed time range
    }
    
    // Current duration
    const currentDuration = endHourIdx - startHourIdx + 1;
    
    // Determine if we're extending forward or backward
    const isForwardExtension = newTimeIdx === endHourIdx + 1;
    const isBackwardExtension = newTimeIdx === startHourIdx - 1;
    
    if (!isForwardExtension && !isBackwardExtension) {
      return existingSelection; // Only allow extending to adjacent hours
    }
    
    if (isForwardExtension) {
      // Check if adding one more hour exceeds max duration
      if (currentDuration >= this.maxDuration) {
        return existingSelection; // Already at max duration
      }
      
      // Check if extension is within allowed hours
      if (newTimeIdx >= this.endHour) {
        return existingSelection; // Outside allowed time range
      }
      
      // Check if the time slot is available
      if (isBooked(dayIdx, newTimeIdx, studioIdx)) {
        return existingSelection; // Time not available
      }
      
      // Valid extension
      return {
        ...existingSelection,
        endHourIdx: newTimeIdx
      };
    }
    
    if (isBackwardExtension) {
      // Check if adding one more hour exceeds max duration
      if (currentDuration >= this.maxDuration) {
        return existingSelection; // Already at max duration
      }
      
      // Check if extension is within allowed hours
      if (newTimeIdx < this.startHour) {
        return existingSelection; // Outside allowed time range
      }
      
      // Check if the time slot is available
      if (isBooked(dayIdx, newTimeIdx, studioIdx)) {
        return existingSelection; // Time not available
      }
      
      // Valid extension
      return {
        ...existingSelection,
        startHourIdx: newTimeIdx
      };
    }
    
    return existingSelection; // No change
  }
}

/**
 * Time Range Rule - Rules that apply to specific time ranges
 * Example: Early morning hours (before 10am) can be booked in 1-hour increments
 */
export class TimeRangeRule extends BaseRule {
  startHour: number;
  endHour: number;
  incrementSize: number;
  
  constructor(config: {
    name: string;
    days: number[];
    studios: (number | string)[];
    startHour: number;
    endHour: number;
    incrementSize: number;
  }) {
    super(config);
    this.startHour = config.startHour;
    this.endHour = config.endHour;
    this.incrementSize = config.incrementSize;
  }
  
  /**
   * Override the applies method to check if the time is within the specified range
   */
  applies(dayIdx: number, studioIdx: number, startHour: number, endHour: number): boolean {
    const baseApplies = super.applies(dayIdx, studioIdx, startHour, endHour);
    
    // If the base rule doesn't apply, this rule doesn't apply
    if (!baseApplies) return false;
    
    // Check if any part of the time range overlaps with our defined range
    // This ensures early morning rule takes precedence for times before 10am
    const hasOverlap = (
      (startHour >= this.startHour && startHour < this.endHour) || 
      (endHour >= this.startHour && endHour < this.endHour) ||
      (startHour <= this.startHour && endHour >= this.endHour)
    );
    
    return hasOverlap;
  }
  
  validate(dayIdx: number, studioIdx: number, startHour: number, endHour: number): boolean {
    if (!this.applies(dayIdx, studioIdx, startHour, endHour)) return true;
    
    // The duration must be a multiple of the increment size
    const duration = endHour - startHour + 1;
    return duration % this.incrementSize === 0;
  }
  
  calculateSelection(dayIdx: number, timeIdx: number, studioIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection {
    if (!this.applies(dayIdx, studioIdx, timeIdx, timeIdx)) {
      return {
        dayIdx,
        studioIdx,
        startHourIdx: timeIdx,
        endHourIdx: timeIdx
      };
    }
    
    // For increment size of 1, just return single hour selection
    if (this.incrementSize === 1) {
      return {
        dayIdx,
        studioIdx,
        startHourIdx: timeIdx,
        endHourIdx: timeIdx
      };
    }
    
    // For larger increment sizes, calculate a block of that size
    let endHourIdx = timeIdx;
    for (let i = 1; i < this.incrementSize; i++) {
      const nextIdx = timeIdx + i;
      if (nextIdx >= this.endHour) break;
      if (isBooked(dayIdx, nextIdx, studioIdx)) break;
      endHourIdx = nextIdx;
    }
    
    return {
      dayIdx,
      studioIdx,
      startHourIdx: timeIdx,
      endHourIdx
    };
  }
  
  extendSelection(existingSelection: Selection, newTimeIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection {
    if (!existingSelection) return null;
    
    const selection = existingSelection as NonNullable<Selection>;
    const { dayIdx, studioIdx, startHourIdx, endHourIdx } = selection;
    
    // Only allow extending in the same day and studio
    if (!this.applies(dayIdx, studioIdx, Math.min(startHourIdx, newTimeIdx), Math.max(endHourIdx, newTimeIdx))) {
      return existingSelection; // Can't extend - rules don't apply
    }
    
    // Determine if we're extending forward or backward
    const isForwardExtension = newTimeIdx === endHourIdx + 1;
    const isBackwardExtension = newTimeIdx === startHourIdx - 1;
    
    if (!isForwardExtension && !isBackwardExtension) {
      return existingSelection; // Only allow extending to adjacent hours
    }
    
    // For 1-hour increments, allow extending one hour at a time
    if (this.incrementSize === 1) {
      if (isForwardExtension && !isBooked(dayIdx, newTimeIdx, studioIdx)) {
        return {
          dayIdx,
          studioIdx,
          startHourIdx,
          endHourIdx: newTimeIdx
        };
      }
      
      if (isBackwardExtension && !isBooked(dayIdx, newTimeIdx, studioIdx)) {
        return {
          dayIdx,
          studioIdx,
          startHourIdx: newTimeIdx,
          endHourIdx
        };
      }
    } else {
      // For larger increments, extend by that increment size
      if (isForwardExtension) {
        const newEndHourIdx = endHourIdx + this.incrementSize;
        if (newEndHourIdx >= this.endHour) return existingSelection;
        
        // Check if the extended range is available
        for (let i = endHourIdx + 1; i <= newEndHourIdx; i++) {
          if (isBooked(dayIdx, i, studioIdx)) return existingSelection;
        }
        
        return {
          dayIdx,
          studioIdx,
          startHourIdx,
          endHourIdx: newEndHourIdx
        };
      }
      
      if (isBackwardExtension) {
        const newStartHourIdx = startHourIdx - this.incrementSize;
        if (newStartHourIdx < this.startHour) return existingSelection;
        
        // Check if the extended range is available
        for (let i = newStartHourIdx; i < startHourIdx; i++) {
          if (isBooked(dayIdx, i, studioIdx)) return existingSelection;
        }
        
        return {
          dayIdx,
          studioIdx,
          startHourIdx: newStartHourIdx,
          endHourIdx
        };
      }
    }
    
    return existingSelection; // No change
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
  
  getApplicableRules(dayIdx: number, studioIdx: number, timeIdx?: number): BookingRule[] {
    // First, filter rules that apply to this day and studio
    const applicableRules = this.rules.filter(rule => 
      rule.applies(dayIdx, studioIdx, timeIdx !== undefined ? timeIdx : 0, timeIdx !== undefined ? timeIdx : 23)
    );
    
    // If dealing with a specific time, prioritize time-range specific rules
    if (timeIdx !== undefined) {
      const timeRangeRules = applicableRules.filter(rule => rule instanceof TimeRangeRule);
      const otherRules = applicableRules.filter(rule => !(rule instanceof TimeRangeRule));
      
      // Return time range rules first, then other rules
      return [...timeRangeRules, ...otherRules];
    }
    
    return applicableRules;
  }
  
  calculateSelection(dayIdx: number, timeIdx: number, studioIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection {
    // Get applicable rules, prioritizing time-range specific rules if applicable
    const applicableRules = this.getApplicableRules(dayIdx, studioIdx, timeIdx);
    
    if (applicableRules.length === 0) {
      // Default rule (single hour selection)
      return { dayIdx, studioIdx, startHourIdx: timeIdx, endHourIdx: timeIdx };
    }
    
    // Apply the first matching rule (now with proper prioritization)
    return applicableRules[0].calculateSelection(dayIdx, timeIdx, studioIdx, isBooked);
  }
  
  /**
   * Extend an existing selection to include a new time
   */
  extendSelection(existingSelection: Selection, newTimeIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection {
    if (!existingSelection) return null;
    
    const { dayIdx, studioIdx } = existingSelection;
    // Also prioritize time-range rules for extensions
    const applicableRules = this.getApplicableRules(dayIdx, studioIdx, newTimeIdx);
    
    if (applicableRules.length === 0) {
      // No applicable rules, so use default extension behavior
      return this.extendByOneHour(existingSelection, newTimeIdx, isBooked);
    }
    
    // Apply the first rule's extension logic (now with proper prioritization)
    return applicableRules[0].extendSelection(existingSelection, newTimeIdx, isBooked);
  }
  
  /**
   * Default behavior to extend by one hour
   */
  private extendByOneHour(existingSelection: Selection, newTimeIdx: number, isBooked: (dayIdx: number, timeIdx: number, studioIdx: number) => boolean): Selection {
    if (!existingSelection) return null;
    
    // Ensure we have a non-null selection
    const selection = existingSelection as NonNullable<Selection>;
    const { dayIdx, studioIdx, startHourIdx, endHourIdx } = selection;
    
    // Check if we're trying to extend by adding an adjacent hour
    const isForwardExtension = newTimeIdx === endHourIdx + 1;
    const isBackwardExtension = newTimeIdx === startHourIdx - 1;
    
    if (!isForwardExtension && !isBackwardExtension) {
      return existingSelection; // Only allow extending to adjacent hours
    }
    
    if (isForwardExtension && !isBooked(dayIdx, newTimeIdx, studioIdx)) {
      return {
        dayIdx,
        studioIdx,
        startHourIdx,
        endHourIdx: newTimeIdx
      };
    }
    
    if (isBackwardExtension && !isBooked(dayIdx, newTimeIdx, studioIdx)) {
      return {
        dayIdx,
        studioIdx,
        startHourIdx: newTimeIdx,
        endHourIdx
      };
    }
    
    return existingSelection; // No change
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