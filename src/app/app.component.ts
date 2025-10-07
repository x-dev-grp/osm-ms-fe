// angular import
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';

// project import
// Angular material
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatProgressBar, TranslateModule],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  activeRoute = inject(ActivatedRoute);
  // public props
  isSpinnerVisible = true;
  mainUrl: string;
  private router = inject(Router);
  private translate = inject(TranslateService);
  private titleService = inject(Title);

  constructor() {
    // Initialize translations
    this.translate.addLangs(['en', 'fr', 'ar']);
    this.translate.setDefaultLang('en');

    // Use saved language from localStorage if available
    const savedLang = localStorage.getItem('app_language');
    if (savedLang) {
      this.translate.use(savedLang);
    } else {
      // Get browser language or use default
      const browserLang = this.translate.getBrowserLang();
      this.translate.use(browserLang?.match(/en|fr/) ? browserLang : 'en');
    }
  }

  ngOnInit() {
    this.router.events.subscribe(
      (event) => {
        if (event instanceof NavigationStart) {
          setTimeout(() => {
            this.isSpinnerVisible = true;
          });
        } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
          setTimeout(() => {
            this.isSpinnerVisible = false;
          });
        }
      },
      () => {
        setTimeout(() => {
          this.isSpinnerVisible = false;
        });
      }
    );
  }
}
