/**
 * Advanced Scheduler Module
 * 
 * Provides enhanced scheduling capabilities including:
 * - Cron expression parsing and validation
 * - Timezone support for global operations
 * - Holiday scheduling with locale awareness
 * - Dynamic conditional scheduling
 */

import { DateTime } from 'luxon';
import cronParser from 'cron-parser';

export interface ScheduleConfig {
  cronExpression?: string;
  timezone: string;
  excludeHolidays?: boolean;
  holidayLocale?: string;
  conditions?: ScheduleCondition[];
  startDate?: Date;
  endDate?: Date;
  maxExecutions?: number;
}

export interface ScheduleCondition {
  type: 'time_window' | 'day_of_month' | 'business_hours' | 'custom';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  timezone?: string;
}

export interface NextExecution {
  date: Date;
  timezone: string;
  localTime: string;
  utcTime: string;
  isHoliday: boolean;
  conditionsMet: boolean;
}

export class AdvancedScheduler {
  private config: ScheduleConfig;
  private executionCount: number = 0;
  
  constructor(config: ScheduleConfig) {
    this.config = config;
    this.validateConfig();
  }

  private validateConfig(): void {
    if (this.config.cronExpression) {
      try {
        cronParser.parseExpression(this.config.cronExpression);
      } catch (error) {
        throw new Error(`Invalid cron expression: ${this.config.cronExpression}`);
      }
    }

    if (!this.isValidTimezone(this.config.timezone)) {
      throw new Error(`Invalid timezone: ${this.config.timezone}`);
    }
  }

  private isValidTimezone(timezone: string): boolean {
    try {
      DateTime.now().setZone(timezone);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the next execution time based on schedule configuration
   */
  public getNextExecution(fromDate?: Date): NextExecution | null {
    const startDate = fromDate || new Date();
    
    // Check if we've exceeded max executions
    if (this.config.maxExecutions && this.executionCount >= this.config.maxExecutions) {
      return null;
    }

    // Check date range constraints
    if (this.config.endDate && startDate > this.config.endDate) {
      return null;
    }

    let nextDate: Date | null = null;

    if (this.config.cronExpression) {
      nextDate = this.getNextCronExecution(startDate);
    }

    if (!nextDate) return null;

    // Apply timezone
    const zonedDate = DateTime.fromJSDate(nextDate).setZone(this.config.timezone);
    
    // Check if it's a holiday
    const isHoliday = this.isHoliday(zonedDate);
    if (this.config.excludeHolidays && isHoliday) {
      // Recursively find next non-holiday execution
      return this.getNextExecution(new Date(zonedDate.plus({ days: 1 }).toMillis()));
    }

    // Check dynamic conditions
    const conditionsMet = this.checkConditions(zonedDate);
    if (!conditionsMet) {
      // Find next execution that meets conditions
      return this.getNextExecution(new Date(zonedDate.plus({ minutes: 1 }).toMillis()));
    }

    return {
      date: nextDate,
      timezone: this.config.timezone,
      localTime: zonedDate.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ'),
      utcTime: zonedDate.toUTC().toISO()!,
      isHoliday,
      conditionsMet
    };
  }

  private getNextCronExecution(fromDate: Date): Date | null {
    try {
      const interval = cronParser.parseExpression(this.config.cronExpression!, {
        currentDate: fromDate,
        tz: this.config.timezone
      });
      return interval.next().toDate();
    } catch (error) {
      console.error('Error parsing cron expression:', error);
      return null;
    }
  }

  private isHoliday(date: DateTime): boolean {
    // This would integrate with a holiday API or database
    // For now, we'll check common US holidays as an example
    const holidays = this.getHolidaysForYear(date.year);
    const dateStr = date.toFormat('MM-dd');
    
    return holidays.some(holiday => {
      const holidayDate = DateTime.fromISO(holiday.date);
      return holidayDate.toFormat('MM-dd') === dateStr;
    });
  }

  private getHolidaysForYear(year: number): Array<{ date: string; name: string }> {
    // This would be replaced with actual holiday data source
    // Using US federal holidays as example
    return [
      { date: `${year}-01-01`, name: "New Year's Day" },
      { date: `${year}-07-04`, name: "Independence Day" },
      { date: `${year}-12-25`, name: "Christmas Day" },
      // Add more holidays based on locale
    ];
  }

  private checkConditions(date: DateTime): boolean {
    if (!this.config.conditions || this.config.conditions.length === 0) {
      return true;
    }

    return this.config.conditions.every(condition => {
      switch (condition.type) {
        case 'time_window':
          return this.checkTimeWindow(date, condition);
        case 'day_of_month':
          return this.checkDayOfMonth(date, condition);
        case 'business_hours':
          return this.checkBusinessHours(date, condition);
        case 'custom':
          return this.checkCustomCondition(date, condition);
        default:
          return true;
      }
    });
  }

  private checkTimeWindow(date: DateTime, condition: ScheduleCondition): boolean {
    const hour = date.hour;
    const value = condition.value;

    switch (condition.operator) {
      case 'in':
        return hour >= value.start && hour <= value.end;
      case 'not_in':
        return hour < value.start || hour > value.end;
      default:
        return true;
    }
  }

  private checkDayOfMonth(date: DateTime, condition: ScheduleCondition): boolean {
    const day = date.day;
    
    switch (condition.operator) {
      case 'equals':
        return day === condition.value;
      case 'not_equals':
        return day !== condition.value;
      case 'greater_than':
        return day > condition.value;
      case 'less_than':
        return day < condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(day);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(day);
      default:
        return true;
    }
  }

  private checkBusinessHours(date: DateTime, condition: ScheduleCondition): boolean {
    const hour = date.hour;
    const dayOfWeek = date.weekday; // 1 = Monday, 7 = Sunday
    
    // Standard business hours: Mon-Fri, 9 AM - 5 PM
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isBusinessHour = hour >= 9 && hour < 17;
    
    return condition.operator === 'equals' 
      ? (isWeekday && isBusinessHour) 
      : !(isWeekday && isBusinessHour);
  }

  private checkCustomCondition(date: DateTime, condition: ScheduleCondition): boolean {
    // This would be extended to support custom condition logic
    // For now, always return true
    return true;
  }

  /**
   * Get multiple upcoming executions
   */
  public getUpcomingExecutions(count: number = 10): NextExecution[] {
    const executions: NextExecution[] = [];
    let currentDate = new Date();
    
    for (let i = 0; i < count; i++) {
      const next = this.getNextExecution(currentDate);
      if (!next) break;
      
      executions.push(next);
      currentDate = new Date(next.date.getTime() + 60000); // Add 1 minute
    }
    
    return executions;
  }

  /**
   * Build cron expression from user-friendly inputs
   */
  public static buildCronExpression(options: {
    minute?: number | '*';
    hour?: number | '*';
    dayOfMonth?: number | '*';
    month?: number | '*';
    dayOfWeek?: number | '*';
  }): string {
    const {
      minute = '*',
      hour = '*',
      dayOfMonth = '*',
      month = '*',
      dayOfWeek = '*'
    } = options;

    return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  }

  /**
   * Parse and explain a cron expression in human-readable format
   */
  public static explainCronExpression(expression: string): string {
    try {
      const parts = expression.split(' ');
      if (parts.length < 5) {
        return 'Invalid cron expression';
      }

      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
      const explanations: string[] = [];

      // Minute
      if (minute === '*') {
        explanations.push('every minute');
      } else if (minute.includes(',')) {
        explanations.push(`at minutes ${minute}`);
      } else if (minute.includes('/')) {
        explanations.push(`every ${minute.split('/')[1]} minutes`);
      } else {
        explanations.push(`at minute ${minute}`);
      }

      // Hour
      if (hour !== '*') {
        if (hour.includes(',')) {
          explanations.push(`at hours ${hour}`);
        } else if (hour.includes('/')) {
          explanations.push(`every ${hour.split('/')[1]} hours`);
        } else {
          explanations.push(`at ${hour}:00`);
        }
      }

      // Day of month
      if (dayOfMonth !== '*') {
        if (dayOfMonth.includes(',')) {
          explanations.push(`on days ${dayOfMonth}`);
        } else if (dayOfMonth.includes('/')) {
          explanations.push(`every ${dayOfMonth.split('/')[1]} days`);
        } else {
          explanations.push(`on day ${dayOfMonth}`);
        }
      }

      // Month
      if (month !== '*') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (month.includes(',')) {
          const months = month.split(',').map(m => monthNames[parseInt(m) - 1]);
          explanations.push(`in ${months.join(', ')}`);
        } else {
          explanations.push(`in ${monthNames[parseInt(month) - 1]}`);
        }
      }

      // Day of week
      if (dayOfWeek !== '*') {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        if (dayOfWeek.includes(',')) {
          const days = dayOfWeek.split(',').map(d => dayNames[parseInt(d)]);
          explanations.push(`on ${days.join(', ')}`);
        } else {
          explanations.push(`on ${dayNames[parseInt(dayOfWeek)]}`);
        }
      }

      return 'Runs ' + explanations.join(' ');
    } catch (error) {
      return 'Invalid cron expression';
    }
  }

  /**
   * Common cron presets
   */
  public static readonly PRESETS = {
    EVERY_MINUTE: '* * * * *',
    EVERY_HOUR: '0 * * * *',
    DAILY_MIDNIGHT: '0 0 * * *',
    DAILY_NOON: '0 12 * * *',
    WEEKLY_MONDAY: '0 0 * * 1',
    MONTHLY_FIRST: '0 0 1 * *',
    YEARLY: '0 0 1 1 *',
    BUSINESS_HOURS: '0 9-17 * * 1-5',
    WEEKDAYS: '0 0 * * 1-5',
    WEEKENDS: '0 0 * * 0,6'
  };
}

// Export utility functions
export function validateCronExpression(expression: string): boolean {
  try {
    cronParser.parseExpression(expression);
    return true;
  } catch {
    return false;
  }
}

export function getTimezones(): string[] {
  // Return common timezones - this would be expanded with full list
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];
}