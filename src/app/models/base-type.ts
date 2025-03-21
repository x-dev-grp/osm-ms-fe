export interface BaseType {
  type: string;         // This should match the discriminator value (e.g., "region")
  id?: number;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}
