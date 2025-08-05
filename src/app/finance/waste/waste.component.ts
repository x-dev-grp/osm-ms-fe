import {Component} from '@angular/core';
import {OsmDashboard} from "../../shared/modules/osm-dashboard/osm-dashboard";
import {DashboardConfig} from "../../shared/modules/osm-dashboard/models/dashboard-config";
import {WASTE_DASHBOARD} from "./WASTE_DASHBOARD";
import {OilSale} from "../models/oil-sale.model";
import {OilSaleService} from "../service/oil-sale.service";
import {CustomerService} from "../service/customer.service";
import {Router} from "@angular/router";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SupplierTypeService} from "../../shared/services/supplier.service";
import {SupplierType} from "../../shared/models/supplier-type";
import {map, Observable, startWith} from "rxjs";
import {FormArray, FormGroup} from "@angular/forms";

@Component({
    selector: 'app-waste',
    imports: [
        OsmDashboard
    ],
    standalone: true,
    templateUrl: './waste.component.html',
    styleUrl: './waste.component.scss'
})
export class WasteComponent {
    suppliers: SupplierType[];
    filteredSuppliers: Observable<SupplierType[]>;
    wasteForm!: FormGroup;

    dashboardConfig: DashboardConfig = WASTE_DASHBOARD;

    constructor(
        private oilSaleService: OilSaleService,
        private customerService: CustomerService,
        private router: Router,
        private snackBar: MatSnackBar,
        private supplierService: SupplierTypeService
    ) {
    }

    get containerSelections(): FormArray {
        return this.wasteForm.get('containerSelections') as FormArray;
    }

    ngOnInit() {
        this.loadSuppliers();
    }


    // load suppliers

    handleAction(event: { action: string; row: OilSale }): void {
        switch (event.action.toUpperCase()) {
            case 'READ':
                break;

            case 'UPDATE':
                break;

            case 'CONFIRM':
                break;

            case 'CANCEL':
                break;

            case 'DELIVER':
                break;
        }
    }

    private loadSuppliers(): void {
        this.supplierService.getAllSuppliers().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.suppliers = Array.isArray(response.data) ? response.data : [response.data];
                    this.setupSupplierAutocomplete();
                }
            },
            error: (error) => {
                console.error('Error loading suppliers:', error);
            }
        });
    }

    private setupSupplierAutocomplete(): void {
        this.filteredSuppliers = this.wasteForm.get('supplierId')!.valueChanges.pipe(
            startWith(''),
            map((value) => this._filterSuppliers(this.suppliers, value))
        );
    }

    private _filterSuppliers(suppliers: SupplierType[], value: string | SupplierType): SupplierType[] {
        if (!value || typeof value === 'object') {
            return suppliers;
        }
        const filterValue = value.toLowerCase();
        return suppliers.filter(
            (supplier) =>
                supplier.supplierInfo.name.toLowerCase().includes(filterValue) || supplier.supplierInfo.lastname.toLowerCase().includes(filterValue)
        );
    }

    //load customers


}
