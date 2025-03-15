import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard', templateUrl: './dashboard.component.html', styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  constructor(private router: Router) {}

  logout() {
    // Simple example: remove token and navigate back to login
    localStorage.removeItem('jwt_token');
    this.router.navigate(['/login']);
  }

  // In your logout method (e.g., in a header component)

}
