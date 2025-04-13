import { Component, OnInit } from '@angular/core';
import { MatFormField } from '@angular/material/form-field';
import { SharedModule } from '../../demo/shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-general-config',
  imports: [MatFormField, SharedModule],
  templateUrl: './general-config.component.html',
  standalone: true,
  styleUrl: './general-config.component.scss'
})
export class GeneralConfigComponent implements OnInit {
  millProfileForm: FormGroup;
  constructor(private fb: FormBuilder) {}
  ngOnInit(): void {
    this.millProfileForm = this.fb.group({
      millName: ['', Validators.required],
      registrationNumber: [''],
      email: ['', [Validators.email]],
      phone: [''],
      address: [''],
     });
  }

  onSave(): void {
    if (this.millProfileForm.valid) {
      console.log('Saved mill profile:', this.millProfileForm.value);
      // TODO: send to API
    }
  }

  onReset(): void {
    this.millProfileForm.reset();
  }

}
