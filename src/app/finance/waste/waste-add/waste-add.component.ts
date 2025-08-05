import {Component} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
    selector: 'app-waste-add',
    imports: [],
    standalone: true,
    templateUrl: './waste-add.component.html',
    styleUrl: './waste-add.component.scss'
})
export class WasteAddComponent {
    wasteId: string
    isEditing: boolean = false;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
    ) {

    }


    ngOnInit() {

    }


}
