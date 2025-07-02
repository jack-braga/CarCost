"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User, LoginCredentials, RegisterCredentials } from "@/lib/types"
import { auth, tokenManager } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const isAuthenticated = !!user

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenManager.getToken()
      const savedUser = tokenManager.getUser()

      if (token && savedUser) {
        // Check if token is expired
        if (tokenManager.isTokenExpired(token)) {
          // Try to refresh token
          try {
            const response = await auth.refreshToken()
            tokenManager.setToken(response.access_token)
            tokenManager.setUser(response.user)
            setUser(response.user)
          } catch (error) {
            // Refresh failed, clear auth
            tokenManager.removeToken()
            setUser(null)
          }
        } else {
          // Token is valid, verify with server
          try {
            const currentUser = await auth.getCurrentUser()
            setUser(currentUser)
            tokenManager.setUser(currentUser)
          } catch (error) {
            // Server verification failed, clear auth
            tokenManager.removeToken()
            setUser(null)
          }
        }
      }

      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      const response = await auth.login(credentials)
      console.log("RES: ", response);
      tokenManager.setToken(response.access_token)
      tokenManager.setUser(response.user)
      setUser(response.user)

      toast({
        title: "Welcome back!",
        description: `Logged in as ${response.user.firstName} ${response.user.lastName}`,
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true)
      const response = await auth.register(credentials)

      tokenManager.setToken(response.access_token)
      tokenManager.setUser(response.user)
      setUser(response.user)

      toast({
        title: "Account created!",
        description: `Welcome ${response.user.firstName}! Your account has been created successfully.`,
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await auth.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      tokenManager.removeToken()
      setUser(null)
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      })
      router.push("/login")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
