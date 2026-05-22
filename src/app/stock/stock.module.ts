import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StockRoutingModule } from './stock-routing.module';

// Imports des composants standalone
import { ArticleListComponent } from './components/article/article-list/article-list.component';
import { ArticleFormComponent } from './components/article/article-form/article-form.component';
import { ArticleDetailComponent } from './components/article/article-detail/article-detail.component';
import { BcListComponent } from './components/bon-commande/bc-list/bc-list.component';
import { BcFormComponent } from './components/bon-commande/bc-form/bc-form.component';
import { BcDetailComponent } from './components/bon-commande/bc-detail/bc-detail.component';
import { MouvementListComponent } from './components/mouvement/mouvement-list/mouvement-list.component';
import { FournisseurListComponent } from "./components/fournisseurs/fournisseur-list/fournisseur-list.component";
import { FournisseurFormComponent } from "./components/fournisseurs/fournisseur-form/fournisseur-form.component";
import { FournisseurDetailComponent } from "./components/fournisseurs/fournisseur-detail/fournisseur-detail.component";
import { SkuListComponent } from "./components/sku/sku-list/sku-list.component";
import { SkuFormComponent } from "./components/sku/sku-form/sku-form.component";
import { SkuDetailComponent } from "./components/sku/sku-detail/sku-detail.component";
import { ClientListComponent } from "../projet/pages/clients/client-list/client-list.component";
import { ClientDetailComponent } from "../projet/pages/clients/client-detail/client-detail.component";
import { ClientFormComponent } from "../projet/pages/clients/client-form/client-form.component";
import { LigneListComponent } from "./components/lignes/ligne-list/ligne-list.component";
import { LigneFormComponent } from "./components/lignes/ligne-form/ligne-form.component";
import { LigneDetailComponent } from "./components/lignes/ligne-detail/ligne-detail.component";

// Imports pour les emplacements
import { EmplacementListComponent } from "./components/emplacement/emplacement-list/emplacement-list.component";
import { EmplacementFormComponent } from "./components/emplacement/emplacement-form/emplacement-form.component";
import { EmplacementDetailComponent } from "./components/emplacement/emplacement-detail/emplacement-detail.component";
import {BomFormComponent} from "./components/bom/bom-form/bom-form.component";
import {BomListComponent} from "./components/bom/bom-list/bom-list.component";
import {BomDetailComponent} from "./components/bom/bom-detail/bom-detail.component";
import { ProductLabelsComponent } from './components/sku/product-labels/product-labels.component';
//import { StockDashboardComponent } from './components/dashboard/stock-dashboard/stock-dashboard.component';
import { StockDashboardComponent } from './components/dashboard/stock-dashboard/stock-dashboard.component';

@NgModule({
  declarations: [
    // Si vous avez des composants non-standalone, déclarez-les ici
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    StockRoutingModule,
    StockDashboardComponent,
    ArticleListComponent,
    ArticleFormComponent,
    ArticleDetailComponent,
    BcListComponent,
    BcFormComponent,
    BcDetailComponent,
    MouvementListComponent,
    FournisseurListComponent,
    FournisseurFormComponent,
    FournisseurDetailComponent,
    SkuListComponent,
    SkuFormComponent,
    SkuDetailComponent,
    LigneListComponent,
    LigneFormComponent,
    LigneDetailComponent,
    EmplacementListComponent,
    EmplacementFormComponent,
    EmplacementDetailComponent,
    BomListComponent,
    BomFormComponent,
    BomDetailComponent
    ,
    ProductLabelsComponent

  ],
  exports: [
  ]
})
export class StockModule { }
