// angular import
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, SharedModule],
  templateUrl: './footer.component.html',
  standalone: true,
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {}
