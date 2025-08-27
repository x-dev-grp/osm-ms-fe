import { Employee } from './employee-model';

export interface Department {
  id?: string;
  name: string;
  description: string;
  managerId: string;
  employees?: Employee[];
  externalId: string;
}
