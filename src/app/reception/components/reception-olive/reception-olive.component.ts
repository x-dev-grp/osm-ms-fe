import { Component } from '@angular/core';
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-reception-olive',
  standalone:true,
  imports: [  MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule],
  templateUrl: './reception-olive.component.html',
  styleUrl: './reception-olive.component.scss'
})
export class ReceptionOliveComponent {

}
