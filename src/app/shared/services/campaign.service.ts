import { Injectable } from '@angular/core';
import { CompanyProfile } from '../models/CompanyProfile';
import { CompanyProfileService } from './company-profile.service';

export interface CampaignConfig {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export interface CampaignMonthDayFields {
  campaignStartMonth: number;
  campaignStartDay: number;
  campaignEndMonth: number;
  campaignEndDay: number;
}

@Injectable({ providedIn: 'root' })
export class CampaignService {
  readonly defaultConfig: CampaignConfig = {
    startMonth: 9,
    startDay: 1,
    endMonth: 4,
    endDay: 30
  };

  constructor(private readonly companyProfileService: CompanyProfileService) {}

  getCampaignConfig(profile?: CompanyProfile | null): CampaignConfig {
    const source = profile ?? this.companyProfileService.getProfileFromCache();
    const startAt = this.resolveStartAt(source);
    const endAt = this.resolveEndAt(source, startAt);

    return {
      startMonth: startAt.getMonth() + 1,
      startDay: startAt.getDate(),
      endMonth: endAt.getMonth() + 1,
      endDay: endAt.getDate()
    };
  }

  getCurrentCampaignLabel(referenceDate: Date = new Date(), profile?: CompanyProfile | null): string {
    const source = profile ?? this.companyProfileService.getProfileFromCache();
    const startAt = this.resolveStartAt(source, referenceDate);
    const startYear = startAt.getFullYear();
    return `${startYear}/${startYear + 1}`;
  }

  getCampaignPreview(referenceDate: Date = new Date(), profile?: CompanyProfile | null): string {
    const source = profile ?? this.companyProfileService.getProfileFromCache();
    const startAt = this.resolveStartAt(source, referenceDate);
    const endAt = this.resolveEndAt(source, startAt);
    return `${this.getCurrentCampaignLabel(referenceDate, source)} (${this.formatDateTime(startAt)} -> ${this.formatDateTime(endAt)})`;
  }

  combineDateTime(date: Date | null | undefined, time: string | null | undefined): string | undefined {
    if (!date) {
      return undefined;
    }

    const [hours = '0', minutes = '0'] = (time ?? '00:00').split(':');
    const combined = new Date(date);
    combined.setHours(Number(hours), Number(minutes), 0, 0);
    return combined.toISOString();
  }

  splitDateTime(value?: string | null): { date: Date | null; time: string } {
    if (!value) {
      return { date: null, time: '00:00' };
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return { date: null, time: '00:00' };
    }

    const hours = parsed.getHours().toString().padStart(2, '0');
    const minutes = parsed.getMinutes().toString().padStart(2, '0');
    return {
      date: new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
      time: `${hours}:${minutes}`
    };
  }

  extractMonthDayFields(
    campaignStartAt?: string | null,
    campaignEndAt?: string | null,
    profile?: CompanyProfile | null
  ): CampaignMonthDayFields {
    const source: CompanyProfile = {
      ...(profile ?? {}),
      campaignStartAt: campaignStartAt ?? profile?.campaignStartAt,
      campaignEndAt: campaignEndAt ?? profile?.campaignEndAt
    } as CompanyProfile;

    const startAt = this.resolveStartAt(source);
    const endAt = this.resolveEndAt(source, startAt);

    return {
      campaignStartMonth: startAt.getMonth() + 1,
      campaignStartDay: startAt.getDate(),
      campaignEndMonth: endAt.getMonth() + 1,
      campaignEndDay: endAt.getDate()
    };
  }

  formatDateTime(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return `${this.pad(date.getDate())}/${this.pad(date.getMonth() + 1)}/${date.getFullYear()} ${this.pad(date.getHours())}:${this.pad(date.getMinutes())}`;
  }

  resolveStartDate(profile?: CompanyProfile | null, referenceDate: Date = new Date()): Date {
    return this.resolveStartAt(profile, referenceDate);
  }

  private resolveStartAt(profile?: CompanyProfile | null, referenceDate: Date = new Date()): Date {
    if (profile?.campaignStartAt) {
      const parsed = new Date(profile.campaignStartAt);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    const month = this.normalizeMonth(profile?.campaignStartMonth, this.defaultConfig.startMonth);
    const day = this.normalizeDay(
      profile?.campaignStartDay,
      profile?.campaignStartMonth,
      this.defaultConfig.startDay,
      this.defaultConfig.startMonth
    );
    const startYear = this.resolveSeasonStartYear(referenceDate, month, day);
    return new Date(startYear, month - 1, day, 0, 0, 0, 0);
  }

  private resolveEndAt(profile: CompanyProfile | null | undefined, startAt: Date): Date {
    if (profile?.campaignEndAt) {
      const parsed = new Date(profile.campaignEndAt);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    const month = this.normalizeMonth(profile?.campaignEndMonth, this.defaultConfig.endMonth);
    const day = this.normalizeDay(
      profile?.campaignEndDay,
      profile?.campaignEndMonth,
      this.defaultConfig.endDay,
      this.defaultConfig.endMonth
    );
    const endYear =
      month < startAt.getMonth() + 1 || (month === startAt.getMonth() + 1 && day < startAt.getDate())
        ? startAt.getFullYear() + 1
        : startAt.getFullYear();
    return new Date(endYear, month - 1, day, 23, 59, 0, 0);
  }

  private resolveSeasonStartYear(referenceDate: Date, startMonth: number, startDay: number): number {
    const currentYear = referenceDate.getFullYear();
    const month = referenceDate.getMonth() + 1;
    const day = referenceDate.getDate();
    const startedThisYear = month > startMonth || (month === startMonth && day >= startDay);
    return startedThisYear ? currentYear : currentYear - 1;
  }

  private normalizeMonth(value: number | undefined, fallback: number): number {
    if (!value || value < 1 || value > 12) {
      return fallback;
    }
    return value;
  }

  private normalizeDay(value: number | undefined, monthValue: number | undefined, fallbackDay: number, fallbackMonth: number): number {
    const month = this.normalizeMonth(monthValue, fallbackMonth);
    const maxDay = new Date(2000, month, 0).getDate();
    if (!value || value < 1) {
      return Math.min(fallbackDay, maxDay);
    }
    return Math.min(value, maxDay);
  }

  private pad(value: number): string {
    return value.toString().padStart(2, '0');
  }
}
