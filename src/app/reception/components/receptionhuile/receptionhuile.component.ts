import { Component } from '@angular/core';
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-receptionhuile',
  standalone:true,
  imports: [  MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule],
  templateUrl: './receptionhuile.component.html',
  styleUrl: './receptionhuile.component.scss'
})
export class ReceptionhuileComponent {

}
