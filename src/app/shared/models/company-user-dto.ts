export interface CompanyAdminUserInput {
  firstName?: string;
  lastName?: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  confirmationMethod: string;
  locked?: boolean;
}

export interface CompanyUserDto {
  legalName: string;
  companyUser: CompanyAdminUserInput;
  enabledModules?: string[];
}
