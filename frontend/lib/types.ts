export interface FuelReceipt {
  id: string
  date: string // ISO date string
  amount: number
  vendor: string
  odometer: number
  imageUrl?: string
  userId: string // Add user association
  carId: string // Add car association
  createdAt: string // ISO datetime string
  updatedAt: string // ISO datetime string
}

export interface OCRResult {
  date?: string
  amount?: number
  vendor?: string
  odometer?: number
  confidence: number
  rawText?: string // Full OCR extracted text
  processingTime?: number // Time taken for OCR processing
}

export interface UploadResponse {
  success: boolean
  ocrResult?: OCRResult
  error?: string
  imageUrl?: string // URL to stored image
}

// Auth types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  timezone?: string
  currency: string
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

// Car types
export interface Car {
  id: string
  userId: string
  name: string
  make: string
  model: string
  year: number
  color?: string
  licensePlate?: string
  fuelType: "petrol" | "diesel" | "electric" | "hybrid"
  tankCapacity?: number // in liters
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCarRequest {
  name: string
  make: string
  model: string
  year: number
  color?: string
  licensePlate?: string
  fuelType: "petrol" | "diesel" | "electric" | "hybrid"
  tankCapacity?: number
  isDefault?: boolean
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  phone?: string
  timezone?: string
  currency?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// API Error response format
export interface ApiError {
  detail: string
  code?: string
  timestamp?: string
}

// Health check response
export interface HealthResponse {
  status: string
  timestamp: string
  version?: string
}

// Pagination for future use
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// Statistics response
export interface FuelStatistics {
  totalSpent: number
  totalReceipts: number
  averagePerFillup: number
  totalDistance: number
  monthlySpending: Record<string, number>
  fuelEfficiency?: number // km per liter
}
