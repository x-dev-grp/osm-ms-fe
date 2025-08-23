export interface Transporter {
  id?: string; // Optional if created server-side
  name: string;
  contactNumber: string;
  email: string;
  licenseNumber: string;
  address: string;
}
