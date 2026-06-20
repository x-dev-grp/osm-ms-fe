import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: true,
  imports: [TranslateModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomeComponent {}
