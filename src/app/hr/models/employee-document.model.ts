import { Employee } from './employee.model';
export interface EmployeeDocument {
  id?: string;
  employee?: Employee;
  documentType?: string;
  title?: string;
  fileName?: string;
  contentType?: string;
  storageRef?: string;
  expiryDate?: string;
  status?: string;
  notes?: string;
}
