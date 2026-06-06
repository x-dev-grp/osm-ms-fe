export interface MaterialNeedLine {
  articleId: string;
  articleName: string;
  unitOfMeasure?: string;
  quantityPerUnit: number;
  quantityNeeded: number;
  quantityNeededRounded: number;
  quantiteActuelle?: number;
  quantiteReservee?: number;
  quantiteDisponible?: number;
  sufficient: boolean;
}
