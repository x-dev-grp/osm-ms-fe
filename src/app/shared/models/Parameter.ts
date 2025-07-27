export type ParameterType = 'STRING' | 'INTEGER' | 'DOUBLE' | 'BOOLEAN' | 'DATE';

export interface Parameter {
  id: string;
  tenantId: string;
  code: string;
  category: string;
  value: string;
  type: ParameterType;
  description: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
}
