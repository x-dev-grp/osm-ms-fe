
export interface User {
    id: string;
    username?: string;
    email: string;
    password: string;
    phoneNumber: string;
    confirmationMethod:string;
    isLocked:boolean;
    roles: any;
    permissions:any;
}
