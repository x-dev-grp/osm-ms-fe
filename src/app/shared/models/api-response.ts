export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
}

export interface ApiSingleResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
