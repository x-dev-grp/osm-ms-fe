import { Component } from '@angular/core';
import {FournisseursComponent} from "../fournisseurs/fournisseurs.component";
import {BonReceptionComponent} from "../bonReception/reception.component";
import {ActivatedRoute, RouterModule} from "@angular/router";
import {MatButton} from "@angular/material/button";
import {MatCard, MatCardContent} from "@angular/material/card";


@Component({
  selector: 'app-reception',
  standalone:true,
  imports: [RouterModule, MatButton, MatCard, MatCardContent],
  templateUrl: './reception.component.html',
  styleUrl: './reception.component.scss'
})
export class ReceptionComponent {

  activeRoute: string = '';


  constructor(private activatedRoute: ActivatedRoute) {}


  ngOnInit(): void {
    // Détecter la route active
    this.activatedRoute.url.subscribe((urlSegments) => {
      this.activeRoute = urlSegments.length > 0 ? urlSegments[0].path : '';
    });
  }
  priceList = [
    {
      id:'recepetionolive',
      border: 'border-success',
      background: 'bg-success-50',
      name: 'Réception Olive',

      color: 'text-success-500',
    },
    {
      id:'recepetionhuile',
      border: 'border-primary',
      background: 'bg-primary-50',
      name: 'Réception Huile',

      color: 'text-primary-500',
    },
  ];


}
