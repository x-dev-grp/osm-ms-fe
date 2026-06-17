// angular import
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SharedModule } from 'src/app/shared/shared.module';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-error',
  imports: [TranslateModule, CommonModule, SharedModule, RouterModule],
  templateUrl: './error.component.html',
  styleUrls: ['../maintenance.scss', './error.component.scss']
})
export class ErrorComponent {}
