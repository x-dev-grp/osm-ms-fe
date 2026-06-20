import {  Component, DestroyRef, inject, input, OnChanges, OnInit, output, SimpleChanges } from '@angular/core';

import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { SelectionModel } from '@angular/cdk/collections';
import { PermissionService } from '../../services/permission.service';
import { tap } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
interface PermissionNode {
  id: string;
  permissionName: string;
  type: 'entity' | 'module' | 'permission';
  children?: any[];
  module:string;
}
export interface Permission {
  id: string;
  permissionName: string;
  module: string;
  entity: string;
}

@Component({
  selector: 'permission-tree',
  templateUrl: './permission.component.html',
  styleUrls: ['./permission.component.scss'],
  standalone: true,
  imports: [TranslateModule, 
    CommonModule,
    SharedModule,

  ]
})
export class PermissionComponent implements OnInit,OnChanges {
  _service=inject(PermissionService);
  readonly destroyRef = inject(DestroyRef);
  constructor() {
  }
 initialPermissions=input.required<string[]>();
 permissionsChange = output<string[]>();
 viewMode = input<boolean>();

 dataSource = new MatTreeNestedDataSource<PermissionNode>();

 // Selection model for checkboxes
 checklistSelection = new SelectionModel<PermissionNode>(true);
 treeControl = new NestedTreeControl<PermissionNode>((node) => node.children);


  ngOnChanges(changes: SimpleChanges): void {
    if(changes?.["initialPermissions"]?.["currentValue"])
        this.applyInitialPermissions();
  }
 groupPermissionsToTree(permissions: Permission[]): PermissionNode[] {
  const categoryMap = new Map<string, PermissionNode>();

  for (const perm of permissions) {
    const moduleKey = this.resolveModuleKey(perm.module);
    if (!moduleKey) {
      continue;
    }

    // Group by category
    if (!categoryMap.has(moduleKey)) {
      categoryMap.set(moduleKey, {
        id: moduleKey,
        permissionName: this.formatName(moduleKey),
        type: 'module',
        children: [],
        module: moduleKey
      });
    }

    const categoryNode = categoryMap.get(moduleKey)!;

    // Group by module inside category
    let moduleNode = categoryNode.children!.find(m => m.id === perm.entity);
    if (!moduleNode) {
      moduleNode = {
        id: perm?.entity,
        permissionName: this.formatName(perm.entity),
        type: 'entity',
        children: [],
        module:perm?.module
      };
      categoryNode.children!.push(moduleNode);
    }

    // Add permission
    moduleNode.children!.push({
      id:perm?.id,
      permissionName: perm?.permissionName,
      category: moduleKey,
      module: moduleKey,
      type: 'permission'
    });
  }

  return Array.from(categoryMap.values());
}

private resolveModuleKey(module: Permission['module'] | unknown): string | null {
  if (module == null) {
    return null;
  }
  if (typeof module === 'string') {
    return module;
  }
  if (typeof module === 'number') {
    return String(module);
  }
  if (typeof module === 'object' && module !== null && 'name' in module) {
    return String((module as { name?: string }).name ?? '');
  }
  return String(module);
}

private formatName(name: string): string {
  return name?.replace(/-/g, ' ')?.replace(/\b\w/g, c => c?.toUpperCase());
}

  fetchPermissions(){
    this._service.fetchAll().pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((response:any)=>{
          if (!response?.success || !Array.isArray(response?.data)) {
            console.error('Permission fetchAll returned no data', response);
            this.dataSource.data = [];
            return;
          }
          const data=this.groupPermissionsToTree(response.data);
          this.dataSource.data = data;
          this.treeControl.dataNodes = this.dataSource.data;
          this.applyInitialPermissions();
      })
    ).subscribe({
      error: (err) => console.error('Permission fetchAll failed', err)
    });
  }
 ngOnInit() {
   // Initialize the tree
   this.fetchPermissions();

 }

 /** Toggle node expansion */
 toggle(node: PermissionNode): void {
   if (this.treeControl.isExpanded(node)) {
     this.treeControl.collapse(node);
   } else {
     this.treeControl.expand(node);
   }
 }

 /** Whether all descendants of a node are selected */
 descendantsAllSelected(node: PermissionNode): boolean {
   const descendants = this.treeControl.getDescendants(node);
   const descAllSelected = descendants.length > 0 && descendants.every(child => {
     return this.checklistSelection.isSelected(child);
   });
   return descAllSelected;
 }

 descendantsPartiallySelected(node: PermissionNode): boolean {
   const descendants = this.treeControl.getDescendants(node);
   const result = descendants.some(child => this.checklistSelection.isSelected(child));
   return result && !this.descendantsAllSelected(node);
 }

 todoItemSelectionToggle(node: PermissionNode): void {
   this.checklistSelection.toggle(node);
   const descendants = this.treeControl.getDescendants(node);

   if (this.checklistSelection.isSelected(node)) {
     this.checklistSelection.select(...descendants);
   } else {
     this.checklistSelection.deselect(...descendants);
   }

   descendants.forEach(child => {
     this.checklistSelection.isSelected(child);
   });

   this.checkAllParentsSelection(node);
   this.emitPermissionsChange();
 }

 todoLeafItemSelectionToggle(node: PermissionNode): void {
   this.checklistSelection.toggle(node);
   this.checkAllParentsSelection(node);
   this.emitPermissionsChange();
 }

 checkAllParentsSelection(node: PermissionNode): void {
   let parent: PermissionNode | null = this.getParentNode(node);
   while (parent) {
     this.checkRootNodeSelection(parent);
     parent = this.getParentNode(parent);
   }
 }

 checkRootNodeSelection(node: PermissionNode): void {
   const nodeSelected = this.checklistSelection.isSelected(node);
   const descendants = this.treeControl.getDescendants(node);
   const descAllSelected = descendants.length > 0 && descendants.every(child => {
     return this.checklistSelection.isSelected(child);
   });

   if (nodeSelected && !descAllSelected) {
     this.checklistSelection.deselect(node);
   } else if (!nodeSelected && descAllSelected) {
     this.checklistSelection.select(node);
   }
 }

 getParentNode(node: PermissionNode): PermissionNode | null {
   const flatNodes = this.flattenNodes(this.dataSource.data);

   const currentNodeIndex = flatNodes.indexOf(node);

   for (let i = currentNodeIndex - 1; i >= 0; i--) {
     if (this.getLevel(flatNodes[i]) < this.getLevel(node)) {
       return flatNodes[i];
     }
   }
   return null;
 }

 private flattenNodes(nodes: PermissionNode[]): PermissionNode[] {
   let result: PermissionNode[] = [];

   const addToResult = (node: PermissionNode) => {
     result.push(node);
     if (node.children) {
       node.children.forEach(addToResult);
     }
   };

   nodes.forEach(addToResult);
   return result;
 }

 getLevel(node: PermissionNode): number {
   if (node.type === 'entity') return 2;
   if (node.type === 'module') return 1;
   return 3;
 }
 hasChild(_: number, node: PermissionNode): boolean {
   return !!node.children && node.children.length > 0;
 }

 applyInitialPermissions(): void {
   if (!this.initialPermissions()?.length) return;

   const allNodes = this.flattenNodes(this.dataSource.data);

   allNodes.forEach(node => {
     if (node.type === 'permission' && this.initialPermissions().includes(node.id)) {
       this.checklistSelection.select(node);
       this.checkAllParentsSelection(node);
       let parent = this.getParentNode(node);
       while (parent) {
         this.treeControl.expand(parent);
         parent = this.getParentNode(parent);
       }
     }
   });
 }

 emitPermissionsChange(): void {
   const selectedPermissions = this.getSelectedPermissions();
   this.permissionsChange.emit(selectedPermissions);
 }

 getSelectedPermissions(): string[] {
   const selectedPermissions: any[] = [];
      const allNodes = this.flattenNodes(this.dataSource.data);
      allNodes.forEach(node => {
     if (node.type === 'permission' && this.checklistSelection.isSelected(node)) {
       selectedPermissions.push(node);
     }
   });

   return selectedPermissions;
 }
}
