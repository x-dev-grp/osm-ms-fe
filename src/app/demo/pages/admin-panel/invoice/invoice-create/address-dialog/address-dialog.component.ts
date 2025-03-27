import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SharedModule } from 'src/app/demo/shared/shared.module';

@Component({
  selector: 'app-address-dialog',
  imports: [SharedModule, CommonModule],
  templateUrl: './address-dialog.component.html',
  styleUrl: './address-dialog.component.scss'
})
export class AddressDialogComponent {
  addresses = [
    {
      name: 'Ian Carpenter',
      address: '1754 Ureate, RhodSA5 5BO',
      mobile: '+91 1234567890',
      email: 'iacrpt65@gmail.com'
    },
    {
      name: 'Belle J. Richter',
      address: '1300 Mine RoadQuemado, NM 87829',
      mobile: '305-829-7809',
      email: 'belljrc23@gmail.com'
    },
    {
      name: 'Ritika Yohannan',
      address: '3488 Arbutus DriveMiami, FL',
      mobile: '+91 1234567890',
      email: 'rtyhn65@gmail.com'
    },
    {
      name: 'Jesse G. Hassen',
      address: '3488 Arbutus DriveMiami, FL 33012',
      mobile: '+91 1234567890',
      email: 'jessghs78@gmail.com'
    },
    {
      name: 'Ian Carpenter',
      address: '1754 Ureate, RhodSA5 5BO',
      mobile: '+91 1234567890',
      email: 'iacrpt65@gmail.com'
    },
    {
      name: 'Belle J. Richter',
      address: '1300 Mine RoadQuemado, NM 87829',
      mobile: '305-829-7809',
      email: 'belljrc23@gmail.com'
    }
  ];
}
