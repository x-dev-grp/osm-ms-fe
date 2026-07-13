export type DashboardPresetPeriod =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lastYear'
  | 'custom';

export interface DashboardDateRange {
  start: Date;
  end: Date;
  preset: DashboardPresetPeriod;
}

export const DASHBOARD_QUICK_PERIODS: Array<{ value: DashboardPresetPeriod; label: string }> = [
  { value: 'today', label: 'DASHBOARD.DATE_FILTER.TODAY' },
  { value: 'yesterday', label: 'DASHBOARD.DATE_FILTER.YESTERDAY' },
  { value: 'thisWeek', label: 'DASHBOARD.DATE_FILTER.THIS_WEEK' },
  { value: 'lastWeek', label: 'DASHBOARD.DATE_FILTER.LAST_WEEK' },
  { value: 'thisMonth', label: 'DASHBOARD.DATE_FILTER.THIS_MONTH' },
  { value: 'lastMonth', label: 'DASHBOARD.DATE_FILTER.LAST_MONTH' },
  { value: 'thisYear', label: 'DASHBOARD.DATE_FILTER.THIS_YEAR' },
  { value: 'lastYear', label: 'DASHBOARD.DATE_FILTER.LAST_YEAR' }
];

export function stripDashboardDate(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

export function getDashboardPresetDateRange(preset: DashboardPresetPeriod): { start: Date; end: Date } {
  const now = new Date();
  const today = stripDashboardDate(now);

  switch (preset) {
    case 'today':
      return { start: new Date(today), end: new Date(today) };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: yesterday };
    }
    case 'thisWeek': {
      const startOfWeek = new Date(today);
      const dayOfWeek = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return { start: startOfWeek, end: endOfWeek };
    }
    case 'lastWeek': {
      const lastWeekStart = new Date(today);
      const lastWeekDay = lastWeekStart.getDay();
      lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekDay + (lastWeekDay === 0 ? -6 : 1) - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      return { start: lastWeekStart, end: lastWeekEnd };
    }
    case 'thisMonth':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
    case 'lastMonth':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0)
      };
    case 'thisYear':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31)
      };
    case 'lastYear':
      return {
        start: new Date(now.getFullYear() - 1, 0, 1),
        end: new Date(now.getFullYear() - 1, 11, 31)
      };
    default:
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
  }
}

export function getDashboardPresetTranslationKey(preset: DashboardPresetPeriod): string | null {
  const keys: Partial<Record<DashboardPresetPeriod, string>> = {
    today: 'DASHBOARD.DATE_FILTER.TODAY',
    yesterday: 'DASHBOARD.DATE_FILTER.YESTERDAY',
    thisWeek: 'DASHBOARD.DATE_FILTER.THIS_WEEK',
    lastWeek: 'DASHBOARD.DATE_FILTER.LAST_WEEK',
    thisMonth: 'DASHBOARD.DATE_FILTER.THIS_MONTH',
    lastMonth: 'DASHBOARD.DATE_FILTER.LAST_MONTH',
    thisYear: 'DASHBOARD.DATE_FILTER.THIS_YEAR',
    lastYear: 'DASHBOARD.DATE_FILTER.LAST_YEAR'
  };
  return keys[preset] ?? null;
}

export function createDefaultDashboardDateRange(
  preset: DashboardPresetPeriod = 'thisMonth'
): DashboardDateRange {
  const dates = getDashboardPresetDateRange(preset);
  return { ...dates, preset };
}
