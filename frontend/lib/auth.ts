import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from "./types"

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Token management
export const tokenManager = {
  getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("auth_token")
  },

  setToken(token: string): void {
    if (typeof window === "undefined") return
    localStorage.setItem("auth_token", token)
  },

  removeToken(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
  },

  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const userData = localStorage.getItem("user_data")
    return userData ? JSON.parse(userData) : null;
  },

  setUser(user: User): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("user_data", JSON.stringify(user))
  },

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  },
}

// Auth API client
class AuthClient {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Auth request failed: ${endpoint}`, error)
      throw error
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // const formData = new FormData()
    // formData.append("email", credentials.email)
    // formData.append("password", credentials.password)
    console.log("LOGIN: ", credentials);

    return this.request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    // if (!response.ok) {
    //   const errorData = await response.json().catch(() => ({}))
    //   throw new Error(errorData.detail || "Login failed")
    // }

    // return await response.json()
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/api/auth/me")
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/refresh", {
      method: "POST",
    })
  }

  async logout(): Promise<void> {
    return this.request<void>("/api/auth/logout", {
      method: "POST",
    })
  }
}

// Create auth client instance
const authClient = new AuthClient(API_BASE_URL)

// Export auth methods
export const auth = {
  login: (credentials: LoginCredentials) => authClient.login(credentials),
  register: (credentials: RegisterCredentials) => authClient.register(credentials),
  getCurrentUser: () => authClient.getCurrentUser(),
  refreshToken: () => authClient.refreshToken(),
  logout: () => authClient.logout(),
}
