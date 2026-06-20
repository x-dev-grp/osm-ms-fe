import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-mill-machine-maintenance-redirect',
  standalone: true,
  template: ''
})
export class MillMachineMaintenanceRedirectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/maintenance/new'], {
      queryParams: {
        assetType: 'MILL_MACHINE',
        assetId: id
      },
      replaceUrl: true
    });
  }
}
