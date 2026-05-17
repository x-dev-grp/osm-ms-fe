import { Injectable } from '@angular/core';
import { CompanyProfile } from '../models/CompanyProfile';
import { CompanyProfileService } from './company-profile.service';

export interface CampaignConfig {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
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
    return {
      startMonth: this.normalizeMonth(source?.campaignStartMonth, this.defaultConfig.startMonth),
      startDay: this.normalizeDay(source?.campaignStartDay, source?.campaignStartMonth, this.defaultConfig.startDay, this.defaultConfig.startMonth),
      endMonth: this.normalizeMonth(source?.campaignEndMonth, this.defaultConfig.endMonth),
      endDay: this.normalizeDay(source?.campaignEndDay, source?.campaignEndMonth, this.defaultConfig.endDay, this.defaultConfig.endMonth)
    };
  }

  getCurrentCampaignLabel(referenceDate: Date = new Date(), profile?: CompanyProfile | null): string {
    const config = this.getCampaignConfig(profile);
    const currentYear = referenceDate.getFullYear();
    const month = referenceDate.getMonth() + 1;
    const day = referenceDate.getDate();
    const startedThisYear =
      month > config.startMonth || (month === config.startMonth && day >= config.startDay);
    const startYear = startedThisYear ? currentYear : currentYear - 1;
    return `${startYear}/${startYear + 1}`;
  }

  getCampaignPreview(referenceDate: Date = new Date(), profile?: CompanyProfile | null): string {
    const config = this.getCampaignConfig(profile);
    return `${this.getCurrentCampaignLabel(referenceDate, profile)} (${this.pad(config.startDay)}/${this.pad(config.startMonth)} -> ${this.pad(config.endDay)}/${this.pad(config.endMonth)})`;
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
