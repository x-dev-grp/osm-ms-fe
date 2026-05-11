import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
//import { StockDashboardComponent } from './components/dashboard/stock-dashboard/stock-dashboard.component';
import { ArticleListComponent } from './components/article/article-list/article-list.component';
import { ArticleFormComponent } from './components/article/article-form/article-form.component';
import { ArticleDetailComponent } from './components/article/article-detail/article-detail.component';
import { BcListComponent } from './components/bon-commande/bc-list/bc-list.component';
import { BcFormComponent } from './components/bon-commande/bc-form/bc-form.component';
import { BcDetailComponent } from './components/bon-commande/bc-detail/bc-detail.component';
import { MouvementListComponent } from './components/mouvement/mouvement-list/mouvement-list.component';
import {FournisseurListComponent} from "./components/fournisseurs/fournisseur-list/fournisseur-list.component";
import {FournisseurFormComponent} from "./components/fournisseurs/fournisseur-form/fournisseur-form.component";
import {FournisseurDetailComponent} from "./components/fournisseurs/fournisseur-detail/fournisseur-detail.component";
import {SkuListComponent} from "./components/sku/sku-list/sku-list.component";
import {SkuFormComponent} from "./components/sku/sku-form/sku-form.component";
import {SkuDetailComponent} from "./components/sku/sku-detail/sku-detail.component";
import {ClientListComponent} from "../projet/pages/clients/client-list/client-list.component";
import {ClientDetailComponent} from "../projet/pages/clients/client-detail/client-detail.component";
import {ClientFormComponent} from "../projet/pages/clients/client-form/client-form.component";
import {LigneListComponent} from "./components/lignes/ligne-list/ligne-list.component";
import {LigneFormComponent} from "./components/lignes/ligne-form/ligne-form.component";
import {LigneDetailComponent} from "./components/lignes/ligne-detail/ligne-detail.component";
import {EmplacementListComponent} from "./components/emplacement/emplacement-list/emplacement-list.component";
import {EmplacementFormComponent} from "./components/emplacement/emplacement-form/emplacement-form.component";
import {EmplacementDetailComponent} from "./components/emplacement/emplacement-detail/emplacement-detail.component";
import {BomListComponent} from "./components/bom/bom-list/bom-list.component";
import {BomFormComponent} from "./components/bom/bom-form/bom-form.component";
import {BomDetailComponent} from "./components/bom/bom-detail/bom-detail.component";
import {AuditComponent} from "./components/audit/audit.component";

const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      //{ path: 'dashboard', component: StockDashboardComponent },
      { path: 'articles', component: ArticleListComponent },
      { path: 'articles/nouveau', component: ArticleFormComponent },
      { path: 'articles/:id', component: ArticleDetailComponent },
      { path: 'articles/:id/editer', component: ArticleFormComponent },
      { path: 'bons-commande', component: BcListComponent },
      { path: 'bons-commande/nouveau', component: BcFormComponent },
      { path: 'bons-commande/:id/edit', component: BcFormComponent },
      { path: 'bons-commande/:id', component: BcDetailComponent },
      { path: 'mouvements', component: MouvementListComponent },
      { path: 'fournisseurs', component: FournisseurListComponent },
      { path: 'fournisseurs/nouveau', component: FournisseurFormComponent },
      { path: 'fournisseurs/:id', component: FournisseurDetailComponent },
      { path: 'fournisseurs/:id/editer', component: FournisseurFormComponent },

      { path: 'skus', component: SkuListComponent },
      { path: 'skus/nouveau', component: SkuFormComponent },
      { path: 'skus/:id', component: SkuDetailComponent },
      { path: 'skus/:id/edit', component: SkuFormComponent },

      { path: 'clients', component: ClientListComponent },
      { path: 'clients/nouveau', component: ClientFormComponent },
      { path: 'clients/:id', component: ClientDetailComponent },
      { path: 'clients/:id/editer', component: ClientFormComponent },

      { path: 'lignes', component: LigneListComponent },
      { path: 'lignes/nouveau', component: LigneFormComponent },
      { path: 'lignes/:id', component: LigneDetailComponent },
      { path: 'lignes/:id/edit', component: LigneFormComponent },


      { path: 'emplacements', component: EmplacementListComponent },
      { path: 'emplacements/nouveau', component: EmplacementFormComponent },
      { path: 'emplacements/:id', component: EmplacementDetailComponent },
      { path: 'emplacements/:id/edit', component: EmplacementFormComponent },

      { path: 'boms', component: BomListComponent },
      { path: 'boms/nouveau', component: BomFormComponent },
      { path: 'boms/:id/editer', component: BomFormComponent },
      { path: 'boms/:id', component: BomDetailComponent },
      { path: 'audit', component: AuditComponent },




    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StockRoutingModule { }
