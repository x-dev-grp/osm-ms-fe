// Angular imports
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

// project imports
import { SharedModule } from 'src/app/demo/shared/shared.module';

@Component({
  selector: 'app-online-course-price',
  imports: [SharedModule, CommonModule],
  templateUrl: './online-course-price.component.html',
  styleUrl: './online-course-price.component.scss'
})
export class OnlineCoursePriceComponent {
  // public props
  price: number = 1;

  // public method
  selectPrice(i: number) {
    this.price = i;
  }

  priceList = [
    {
      title: 'FREE',
      type: 'Basic Features',
      price: 0
    },
    {
      title: 'REGULAR',
      type: 'Trending',
      price: 99
    },
    {
      title: 'PRO',
      type: 'For advanced',
      price: 199
    },
    {
      title: 'Business',
      type: 'For advanced',
      price: 299
    }
  ];
}
