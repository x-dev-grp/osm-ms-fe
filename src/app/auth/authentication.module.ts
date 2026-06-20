import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthenticationRoutingModule } from './authentication-routing.module';
import { ResetConfirmComponent } from './reset-confirm/reset-confirm.component';
import { UpdatePasswordComponent } from './update-password/update-password.component';

@NgModule({
  declarations: [],
  imports: [CommonModule, AuthenticationRoutingModule, ResetConfirmComponent, ResetConfirmComponent, UpdatePasswordComponent]
})
export class AuthenticationModule {}
