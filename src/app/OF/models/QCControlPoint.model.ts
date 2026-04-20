export interface QCControlPoint {
  id?: string;
  planId?: string;
  nom: string;
  type: ControlType;
  minValue?: number;
  maxValue?: number;
  blocking: boolean;
  createdDate?: string;
}
export enum ControlType {
  NUMERIC = 'NUMERIC',
  BOOLEAN = 'BOOLEAN',

}
