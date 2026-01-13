// Standard API response wrapper
export interface ApiResponse<T> {
  errors:  any;
  message: string;
  result:  T;
  statusCode: number;
  success: boolean;
}

// For paginated responses
export interface PaginatedResponse<T> {
  errors: any;
  message: string;
  result: {
    items: T[];
    totalCount: number;
    page: number;
    pageSize:  number;
  };
  statusCode: number;
  success: boolean;
}