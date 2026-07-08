
export interface User {
    id: string;
    username?: string;
    firstName?:string;
    lastName?:string;
    email: string;
    password: string;
    phoneNumber: string;
    confirmationMethod:string;
    isLocked:boolean;
    role: any;
    permissions:any;
    isNewUser?:boolean;
    tenantId:string;
    tenantName?: string;
    enabledModules?: string[];
    photoData?: string | null;
    photoContentType?: string | null;
}
