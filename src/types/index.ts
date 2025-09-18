export interface User {
  id: string;
  phoneNumber: string;
  role: 'ADMIN' | 'TECHNICIAN' | 'LANDLORD';
  name?: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface CreateUserRequest {
  phoneNumber: string;
  password?: string;
  role: 'ADMIN' | 'TECHNICIAN' | 'LANDLORD';
  name?: string;
}

export interface Meter {
  id: string;
  meterNumber: string;
  plotNumber: string;
  coordinates?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  landlord: {
    id: string;
    phoneNumber: string;
    name?: string;
    role: string;
  };
  _count?: {
    readings: number;
    bills: number;
  };
}

export interface MeterReading {
  id: string;
  reading: number;
  previousReading?: number;
  unitsConsumed?: number;
  readingDate: string;
  createdAt: string;
  photoPath: string;
  meter: {
    meterNumber: string;
    plotNumber: string;
    landlord: {
      name?: string;
      phoneNumber: string;
    };
  };
  technician: {
    name?: string;
    phoneNumber: string;
  };
}

export interface Bill {
  id: string;
  billNumber: string;
  unitsConsumed: number;
  ratePerUnit: number;
  totalAmount: number;
  billDate?: string;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidDate?: string;
  createdAt: string;
  meter: {
    meterNumber: string;
    plotNumber: string;
    location?: string;
  };
  landlord: {
    name?: string;
    phoneNumber: string;
  };
  reading: {
    reading: number;
    previousReading?: number;
    readingDate: string;
    technician: {
      name?: string;
    };
  };
}

export interface BillingSummary {
  totalBills: number;
  paidBills: number;
  pendingBills: number;
  overdueBills: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ field?: string; message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}