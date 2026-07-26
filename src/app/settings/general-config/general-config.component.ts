import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { CompanyProfileComponent } from '../company/company-profile.component';
import { ProductionConfigComponent } from '../production/production-config.component';
import { CategoryParametersTabComponent } from '../category-parameters-tab/category-parameters-tab.component';
import { ApplicationConfigComponent } from '../application-config/application-config.component';
import { GenericTypeComponent } from '../generic-type/generic-type.component';
import { MatTabChangeEvent } from '@angular/material/tabs';

@Component({
  selector: 'app-general-config',
  standalone: true,
  imports: [
    SharedModule,
    TranslateModule,
    CompanyProfileComponent,
    ProductionConfigComponent,
    CategoryParametersTabComponent,
    ApplicationConfigComponent,
    GenericTypeComponent
  ],
  templateUrl: './general-config.component.html',
  styleUrl: './general-config.component.scss'
})
export class GeneralConfigComponent implements OnInit {
  activeTab = 'company';
  selectedTabIndex = 0;

  readonly knownCategories = ['PRODUCTION', 'FINANCE', 'HR', 'RECEPTION', 'LOCALE', 'PRINT', 'NOTIFICATIONS'];

  private readonly tabIndexByKey: Record<string, number> = {
    company: 0,
    general: 0,
    production: 1,
    finance: 2,
    hr: 3,
    reception: 4,
    locale: 5,
    print: 6,
    notifications: 7,
    types: 8,
    'types-params': 8,
    other: 9
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab')?.toLowerCase();
      if (tab && this.tabIndexByKey[tab] !== undefined) {
        this.selectedTabIndex = this.tabIndexByKey[tab];
        this.activeTab = tab === 'general' ? 'company' : tab;
      }
    });
  }

  onTabChange(event: MatTabChangeEvent) {
    this.selectedTabIndex = event.index;
    const tabLabel = event.tab.textLabel.toLowerCase();

    if (tabLabel.includes('production')) {
      this.activeTab = 'production';
    } else if (tabLabel.includes('general')) {
      this.activeTab = 'company';
    } else if (tabLabel.includes('finance')) {
      this.activeTab = 'finance';
    } else if (tabLabel.includes('rh') || tabLabel.includes('hr')) {
      this.activeTab = 'hr';
    } else if (tabLabel.includes('reception')) {
      this.activeTab = 'reception';
    } else if (tabLabel.includes('locale') || tabLabel.includes('langue')) {
      this.activeTab = 'locale';
    } else if (tabLabel.includes('print') || tabLabel.includes('impression')) {
      this.activeTab = 'print';
    } else if (tabLabel.includes('notif')) {
      this.activeTab = 'notifications';
    } else if (tabLabel.includes('type') || tabLabel.includes('param')) {
      this.activeTab = 'types';
    } else {
      this.activeTab = 'other';
    }
  }
}
