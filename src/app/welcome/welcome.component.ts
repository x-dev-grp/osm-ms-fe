import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { CardComponent } from '../theme/components/card/card.component';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: true,
  imports: [MatCard, MatIcon, CardComponent, TranslatePipe, MatButton],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomeComponent {}
