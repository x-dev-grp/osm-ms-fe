// angular import
import { OnInit, Component, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, ActivatedRoute, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter, map, mergeMap } from 'rxjs/operators';

// project import

// Angular material
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatProgressBar, TranslateModule],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  activeRoute = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private titleService = inject(Title);

  // public props
  isSpinnerVisible = true;
  mainUrl: string;

  constructor() {
    // Initialize translations
    this.translate.addLangs(['en', 'fr']);
    this.translate.setDefaultLang('en');

    // Force language to English for testing
    this.translate.use('en');

    // Get browser language or use default
    // const browserLang = this.translate.getBrowserLang();
    // this.translate.use(browserLang?.match(/en|fr/) ? browserLang : 'en');
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
    const queryString = window.location.search;
    const params = new URLSearchParams(queryString);


  }
}
