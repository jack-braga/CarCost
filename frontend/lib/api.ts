import type {
  FuelReceipt,
  UploadResponse,
  Car,
  CreateCarRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
} from "./types"
import { tokenManager } from "./auth"

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// API client with error handling and authentication
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token = tokenManager.getToken()

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      // Handle 401 Unauthorized - token expired
      if (response.status === 401) {
        tokenManager.removeToken()
        window.location.href = "/login"
        throw new Error("Session expired. Please log in again.")
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  private async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token = tokenManager.getToken()
    const formData = new FormData()

    formData.append("file", file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })

      // Handle 401 Unauthorized - token expired
      if (response.status === 401) {
        tokenManager.removeToken()
        window.location.href = "/login"
        throw new Error("Session expired. Please log in again.")
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`File upload failed: ${endpoint}`, error)
      throw error
    }
  }

  // Fuel receipts endpoints
  async getFuelReceipts(): Promise<FuelReceipt[]> {
    return this.request<FuelReceipt[]>("/api/fuel-receipts")
  }

  async getFuelReceipt(id: string): Promise<FuelReceipt> {
    return this.request<FuelReceipt>(`/api/fuel-receipts/${id}`)
  }

  async createFuelReceipt(
    receipt: Omit<FuelReceipt, "id" | "createdAt" | "updatedAt" | "userId">,
  ): Promise<FuelReceipt> {
    return this.request<FuelReceipt>("/api/fuel-receipts", {
      method: "POST",
      body: JSON.stringify(receipt),
    })
  }

  async updateFuelReceipt(id: string, updates: Partial<FuelReceipt>): Promise<FuelReceipt> {
    return this.request<FuelReceipt>(`/api/fuel-receipts/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }

  async deleteFuelReceipt(id: string): Promise<void> {
    return this.request<void>(`/api/fuel-receipts/${id}`, {
      method: "DELETE",
    })
  }

  // OCR endpoints
  async uploadReceiptForOCR(file: File): Promise<UploadResponse> {
    return this.uploadFile<UploadResponse>("/api/ocr/process-receipt", file)
  }

  // Car endpoints
  async getCars(): Promise<Car[]> {
    return this.request<Car[]>("/api/cars")
  }

  async getCar(id: string): Promise<Car> {
    return this.request<Car>(`/api/cars/${id}`)
  }

  async createCar(car: CreateCarRequest): Promise<Car> {
    return this.request<Car>("/api/cars", {
      method: "POST",
      body: JSON.stringify(car),
    })
  }

  async updateCar(id: string, updates: Partial<CreateCarRequest>): Promise<Car> {
    return this.request<Car>(`/api/cars/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }

  async deleteCar(id: string): Promise<void> {
    return this.request<void>(`/api/cars/${id}`, {
      method: "DELETE",
    })
  }

  async setDefaultCar(id: string): Promise<Car> {
    return this.request<Car>(`/api/cars/${id}/set-default`, {
      method: "POST",
    })
  }

  // User profile endpoints
  async updateUserProfile(updates: UpdateUserRequest): Promise<any> {
    return this.request<any>("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    return this.request<void>("/api/users/change-password", {
      method: "POST",
      body: JSON.stringify(passwordData),
    })
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>("/api/health")
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL)

// Export the API methods
export const api = {
  // Get all fuel receipts
  getFuelReceipts: () => apiClient.getFuelReceipts(),

  // Get single fuel receipt
  getFuelReceipt: (id: string) => apiClient.getFuelReceipt(id),

  // Upload receipt image and get OCR results
  uploadReceipt: (file: File) => apiClient.uploadReceiptForOCR(file),

  // Save fuel receipt
  saveFuelReceipt: (receipt: Omit<FuelReceipt, "id" | "createdAt" | "updatedAt" | "userId">) =>
    apiClient.createFuelReceipt(receipt),

  // Update fuel receipt
  updateFuelReceipt: (id: string, updates: Partial<FuelReceipt>) => apiClient.updateFuelReceipt(id, updates),

  // Delete fuel receipt
  deleteFuelReceipt: (id: string) => apiClient.deleteFuelReceipt(id),

  // Car management
  getCars: () => apiClient.getCars(),
  getCar: (id: string) => apiClient.getCar(id),
  createCar: (car: CreateCarRequest) => apiClient.createCar(car),
  updateCar: (id: string, updates: Partial<CreateCarRequest>) => apiClient.updateCar(id, updates),
  deleteCar: (id: string) => apiClient.deleteCar(id),
  setDefaultCar: (id: string) => apiClient.setDefaultCar(id),

  // User profile
  updateUserProfile: (updates: UpdateUserRequest) => apiClient.updateUserProfile(updates),
  changePassword: (passwordData: ChangePasswordRequest) => apiClient.changePassword(passwordData),

  // Health check
  healthCheck: () => apiClient.healthCheck(),
}

// Export API client for advanced usage
export { apiClient }
