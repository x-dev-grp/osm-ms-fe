// angular import
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SharedModule } from 'src/app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  imports: [TranslateModule, CommonModule, SharedModule],
  templateUrl: './footer.component.html',
  standalone: true,
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {}
