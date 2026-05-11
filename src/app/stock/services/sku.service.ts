import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product, ProductType, SKU } from '../models/sku.model';
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class SKUService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/products`;

  constructor(private http: HttpClient) {}

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl).pipe(
      map((products) => (products ?? []).map((product) => this.normalizeProduct(product)))
    );
  }

  getAllSkus(): Observable<SKU[]> {
    return this.getAllProducts();
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      map((product) => this.normalizeProduct(product))
    );
  }

  getSkuById(id: string): Observable<SKU> {
    return this.getProductById(id);
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/create`, this.toPayload(product)).pipe(
      map((created) => this.normalizeProduct(created))
    );
  }

  createSku(sku: SKU): Observable<SKU> {
    return this.createProduct(sku);
  }

  updateProduct(id: string, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, this.toPayload(product)).pipe(
      map((updated) => this.normalizeProduct(updated))
    );
  }

  updateSku(id: string, sku: SKU): Observable<SKU> {
    return this.updateProduct(id, sku);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deleteSku(id: string): Observable<void> {
    return this.deleteProduct(id);
  }

  desactiverProduct(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/desactiver`, {});
  }

  desactiverSku(id: string): Observable<void> {
    return this.desactiverProduct(id);
  }

  activerProduct(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/activer`, {});
  }

  activerSku(id: string): Observable<void> {
    return this.activerProduct(id);
  }

  getActiveProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/actifs`).pipe(
      map((products) => (products ?? []).map((product) => this.normalizeProduct(product)))
    );
  }

  getActiveSKUs(): Observable<SKU[]> {
    return this.getActiveProducts();
  }

  getProductsByType(type: ProductType): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/type/${type}`).pipe(
      map((products) => (products ?? []).map((product) => this.normalizeProduct(product)))
    );
  }

  getActiveProductsByType(type: ProductType): Observable<Product[]> {
    return this.getProductsByType(type).pipe(
      map((products) => products.filter((product) => product.actif))
    );
  }

  private normalizeProduct(product: Product): Product {
    const name = product?.name || product?.code || '';
    const unitsPerCarton = product?.unitsPerCarton ?? product?.unitesParCols;
    const cartonsPerPallet = product?.cartonsPerPallet ?? product?.colisParPalette;
    return {
      ...product,
      name,
      code: product?.code || name,
      type: product?.type || 'NON_VRAC',
      unitOfMeasure: product?.unitOfMeasure || (product?.type === 'VRAC' ? 'L' : 'BOTTLE'),
      unitsPerCarton,
      cartonsPerPallet,
      unitesParCols: unitsPerCarton,
      colisParPalette: cartonsPerPallet,
      actif: product?.actif ?? true
    };
  }

  private toPayload(product: Product): Product {
    const name = product.name || product.code || '';
    const type = product.type || 'NON_VRAC';
    const unitsPerCarton = product.unitsPerCarton ?? product.unitesParCols;
    const cartonsPerPallet = product.cartonsPerPallet ?? product.colisParPalette;
    const payload: Product = {
      ...product,
      name,
      code: product.code || name,
      type,
      unitOfMeasure: product.unitOfMeasure || (type === 'VRAC' ? 'L' : 'BOTTLE'),
      unitsPerCarton,
      cartonsPerPallet,
      unitesParCols: unitsPerCarton,
      colisParPalette: cartonsPerPallet
    };

    if (type === 'VRAC') {
      return {
        ...payload,
        volume: undefined,
        packagingType: undefined,
        barcode: undefined,
        unitsPerCarton: undefined,
        cartonsPerPallet: undefined,
        unitesParCols: undefined,
        colisParPalette: undefined,
        netWeight: undefined,
        grossWeight: undefined,
        brand: undefined
      };
    }

    return {
      ...payload,
      density: undefined,
      storageUnit: undefined
    };
  }
}
