export interface Role{
  id: string,
  roleName: string,
  description: string,
  permissions: any[],
  usersCount: number,
  createdAt: Date,
  updatedAt: Date
}