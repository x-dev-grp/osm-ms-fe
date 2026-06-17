import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { CardComponent } from '../theme/components/card/card.component';
import { TranslatePipe, TranslateModule } from '@ngx-translate/core';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: true,
  imports: [TranslateModule, MatCard, MatIcon, CardComponent, TranslatePipe, MatButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomeComponent {}
