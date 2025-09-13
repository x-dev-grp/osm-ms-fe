// angular import
import { CommonModule } from '@angular/common';
import { Component, effect, inject, output } from '@angular/core';
import { RouterModule } from '@angular/router';

// third party
import { TranslateService } from '@ngx-translate/core';

// project import
import { AuthenticationService } from 'src/app/auth/services/authentication.service';
import { ThemeLayoutService } from 'src/app/theme/services/theme-layout.service';
import { AbleProConfig } from 'src/app/app-config';
import { SharedModule } from 'src/app/shared/shared.module';
import { RTL } from '../../../const';
import { ThemeConfigService } from '../../../../shared/services/theme-config.service';

@Component({
  selector: 'app-nav-right',
  imports: [SharedModule, CommonModule, RouterModule],
  templateUrl: './toolbar-right.component.html',
  standalone: true,
  styleUrls: ['./toolbar-right.component.scss']
})
export class NavRightComponent {
  authenticationService = inject(AuthenticationService);
  // public props
  readonly HeaderBlur = output();
  direction: string = 'ltr';
  cards = [
    {
      icon: 'custom-layer',
      time: '2 min ago',
      position: 'UI/UX Design',
      description:
        "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley oftype and scrambled it to make a type"
    },
    {
      icon: 'custom-sms',
      time: '1 hour ago',
      position: 'Message',
      description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500."
    }
  ];
  cards2 = [
    {
      icon: 'custom-document-text',
      time: '12 hour ago',
      position: 'Forms',
      description:
        "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley oftype and scrambled it to make a type"
    },
    {
      icon: 'custom-security-safe',
      time: '18 hour ago',
      position: 'Security',
      description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500."
    }
  ];
  notification = [
    {
      sub_title: 'Improvement',
      time: '12 hour ago',
      title: 'Widgets update',
      img: 'assets/images/layout/img-announcement-3.png'
    },
    {
      sub_title: 'New Feature',
      time: '18 hour ago',
      title: 'Coming soon dark mode',
      img: 'assets/images/layout/img-announcement-4.png'
    }
  ];
  private translate = inject(TranslateService);
  private themeService = inject(ThemeLayoutService);

  // public method
  private themeDirection = inject(ThemeConfigService);

  // constructor
  constructor() {
    const translate = this.translate;

    // Load language from localStorage if available
    const savedLang = localStorage.getItem('app_language');
    if (savedLang) {
      translate.use(savedLang);

      if (savedLang === 'ar') {
        this.themeService.directionChange.set(RTL);
        this.themeDirection.applyrtl(
          true
        );
      }else {
        this.themeDirection.applyrtl(
          false
        );
      }
    } else {
      translate.setDefaultLang(AbleProConfig.i18n);
    }
    effect(() => {
      this.isRtlTheme(this.themeService.directionChange());
    });
  }

  // user according language change of sidebar menu item
  useLanguage(language: string) {
    this.translate.use(language);
    localStorage.setItem('app_language', language);
    window.location.reload()
  }

  headerBlur() {
    this.HeaderBlur.emit();
  }

  // user Logout
  logout() {
    this.authenticationService.logout();
  }

  // private methods
  private isRtlTheme(direction: string) {
    this.direction = direction;
  }
}
