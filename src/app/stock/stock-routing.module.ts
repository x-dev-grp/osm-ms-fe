import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StockDashboardComponent } from './components/dashboard/stock-dashboard/stock-dashboard.component';
import { ArticleListComponent } from './components/article/article-list/article-list.component';
import { ArticleFormComponent } from './components/article/article-form/article-form.component';
import { ArticleDetailComponent } from './components/article/article-detail/article-detail.component';
import { BcListComponent } from './components/bon-commande/bc-list/bc-list.component';
import { BcFormComponent } from './components/bon-commande/bc-form/bc-form.component';
import { BcDetailComponent } from './components/bon-commande/bc-detail/bc-detail.component';
import { MouvementListComponent } from './components/mouvement/mouvement-list/mouvement-list.component';
import { MouvementDetailComponent } from './components/mouvement/mouvement-detail/mouvement-detail.component';
import { MaterielSupplierListComponent } from './components/materiel-suppliers/materiel-supplier-list/materiel-supplier-list.component';
import { MaterielSupplierFormComponent } from './components/materiel-suppliers/materiel-supplier-form/materiel-supplier-form.component';
import { MaterielSupplierDetailComponent } from './components/materiel-suppliers/materiel-supplier-detail/materiel-supplier-detail.component';
import { SkuListComponent } from './components/sku/sku-list/sku-list.component';
import { SkuFormComponent } from './components/sku/sku-form/sku-form.component';
import { SkuDetailComponent } from './components/sku/sku-detail/sku-detail.component';
import { ClientListComponent } from '../projet/pages/clients/client-list/client-list.component';
import { ClientDetailComponent } from '../projet/pages/clients/client-detail/client-detail.component';
import { ClientFormComponent } from '../projet/pages/clients/client-form/client-form.component';
import { LigneListComponent } from './components/lignes/ligne-list/ligne-list.component';
import { LigneFormComponent } from './components/lignes/ligne-form/ligne-form.component';
import { LigneDetailComponent } from './components/lignes/ligne-detail/ligne-detail.component';
import { EmplacementListComponent } from './components/emplacement/emplacement-list/emplacement-list.component';
import { EmplacementFormComponent } from './components/emplacement/emplacement-form/emplacement-form.component';
import { EmplacementDetailComponent } from './components/emplacement/emplacement-detail/emplacement-detail.component';
import { BomListComponent } from './components/bom/bom-list/bom-list.component';
import { BomFormComponent } from './components/bom/bom-form/bom-form.component';
import { BomDetailComponent } from './components/bom/bom-detail/bom-detail.component';
import { AuditComponent } from './components/audit/audit.component';

import { anyPermissionGuard, moduleGuard } from '../interceptors/guards/permission.guard';
import { Action, ConditioningEntity, InventoryEntity, OSMModule, permissionKey } from '../theme/types/permissions';

const routes: Routes = [
  {
    path: '',
    canActivate: [moduleGuard([OSMModule.INVENTAIR])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: StockDashboardComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.STOCKSEC, Action.READ)])]
      },
      {
        path: 'articles',
        component: ArticleListComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.ARTICLESEC, Action.READ)])]
      },
      {
        path: 'articles/nouveau',
        component: ArticleFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.ARTICLESEC, Action.CREATE)])]
      },
      {
        path: 'articles/:id',
        component: ArticleDetailComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.ARTICLESEC, Action.READ)])]
      },
      {
        path: 'articles/:id/editer',
        component: ArticleFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.ARTICLESEC, Action.UPDATE)])]
      },
      {
        path: 'bons-commande',
        component: BcListComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.BONCOMMANDE, Action.READ)])]
      },
      {
        path: 'bons-commande/nouveau',
        component: BcFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.BONCOMMANDE, Action.CREATE)])]
      },
      {
        path: 'bons-commande/:id/edit',
        component: BcFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.BONCOMMANDE, Action.UPDATE)])]
      },
      {
        path: 'bons-commande/:id',
        component: BcDetailComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.BONCOMMANDE, Action.READ)])]
      },
      {
        path: 'mouvements',
        component: MouvementListComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.MOUVEMENTSTOCKSEC, Action.READ)])]
      },
      {
        path: 'mouvements/:id',
        component: MouvementDetailComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.MOUVEMENTSTOCKSEC, Action.READ)])]
      },

      {
        path: 'materiel-suppliers',
        component: MaterielSupplierListComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.MATERIEL_SUPPLIER, Action.READ)])]
      },
      {
        path: 'materiel-suppliers/nouveau',
        component: MaterielSupplierFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.MATERIEL_SUPPLIER, Action.CREATE)])]
      },
      {
        path: 'materiel-suppliers/:id',
        component: MaterielSupplierDetailComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.MATERIEL_SUPPLIER, Action.READ)])]
      },
      {
        path: 'materiel-suppliers/:id/editer',
        component: MaterielSupplierFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.MATERIEL_SUPPLIER, Action.UPDATE)])]
      },
      {
        path: 'materiel-suppliers/:id/edit',
        component: MaterielSupplierFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.MATERIEL_SUPPLIER, Action.UPDATE)])]
      },
      { path: 'fournisseurs', redirectTo: 'materiel-suppliers', pathMatch: 'full' },
      { path: 'fournisseurs/nouveau', redirectTo: 'materiel-suppliers/nouveau', pathMatch: 'full' },
      { path: 'fournisseurs/:id/editer', redirectTo: 'materiel-suppliers/:id/editer' },
      { path: 'fournisseurs/:id/edit', redirectTo: 'materiel-suppliers/:id/edit' },
      { path: 'fournisseurs/:id', redirectTo: 'materiel-suppliers/:id' },

      {
        path: 'products',
        component: SkuListComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.PRODUCT, Action.READ)])]
      },
      {
        path: 'products/nouveau',
        component: SkuFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.PRODUCT, Action.CREATE)])]
      },
      {
        path: 'products/:id',
        component: SkuDetailComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.PRODUCT, Action.READ)])]
      },
      {
        path: 'products/:id/edit',
        component: SkuFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.PRODUCT, Action.UPDATE)])]
      },
      {
        path: 'products/:id/editer',
        component: SkuFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.PRODUCT, Action.UPDATE)])]
      },
      {
        path: 'skus',
        component: SkuListComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.SKU, Action.READ)])]
      },
      {
        path: 'skus/nouveau',
        component: SkuFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.SKU, Action.CREATE)])]
      },
      {
        path: 'skus/:id',
        component: SkuDetailComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.SKU, Action.READ)])]
      },
      {
        path: 'skus/:id/edit',
        component: SkuFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.SKU, Action.UPDATE)])]
      },
      {
        path: 'skus/:id/editer',
        component: SkuFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.SKU, Action.UPDATE)])]
      },

      { path: 'clients', component: ClientListComponent },
      { path: 'clients/nouveau', component: ClientFormComponent },
      { path: 'clients/:id', component: ClientDetailComponent },
      { path: 'clients/:id/editer', component: ClientFormComponent },

      {
        path: 'lignes',
        component: LigneListComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.LIGNECONDITIONNEMENT, Action.READ)])]
      },
      {
        path: 'lignes/nouveau',
        component: LigneFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.LIGNECONDITIONNEMENT, Action.CREATE)])]
      },
      {
        path: 'lignes/:id',
        component: LigneDetailComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.LIGNECONDITIONNEMENT, Action.READ)])]
      },
      {
        path: 'lignes/:id/edit',
        component: LigneFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.LIGNECONDITIONNEMENT, Action.UPDATE)])]
      },

      {
        path: 'emplacements',
        component: EmplacementListComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.EMPLACEMENTSTOCK, Action.READ)])]
      },
      {
        path: 'emplacements/nouveau',
        component: EmplacementFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.EMPLACEMENTSTOCK, Action.CREATE)])]
      },
      {
        path: 'emplacements/:id',
        component: EmplacementDetailComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.EMPLACEMENTSTOCK, Action.READ)])]
      },
      {
        path: 'emplacements/:id/edit',
        component: EmplacementFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.EMPLACEMENTSTOCK, Action.UPDATE)])]
      },

      {
        path: 'boms',
        component: BomListComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.BOM, Action.READ)])]
      },
      {
        path: 'boms/nouveau',
        component: BomFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.BOM, Action.CREATE)])]
      },
      {
        path: 'boms/:id/editer',
        component: BomFormComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.BOM, Action.UPDATE)])]
      },
      {
        path: 'boms/:id',
        component: BomDetailComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.INVENTAIR, InventoryEntity.BOM, Action.READ)])]
      },
      {
        path: 'audit',
        component: AuditComponent,
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.CONDITIONING, ConditioningEntity.AUDIT, Action.READ)])]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StockRoutingModule {}
