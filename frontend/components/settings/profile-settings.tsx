"use client"

import type React from "react"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, User } from "lucide-react"
import { api } from "@/lib/api"
import type { User as UserType, UpdateUserRequest } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface ProfileSettingsProps {
  user: UserType | null
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  })
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user: authUser } = useAuth()

  const updateProfileMutation = useMutation({
    mutationFn: (updates: UpdateUserRequest) => api.updateUserProfile(updates),
    onSuccess: (updatedUser) => {
      // Update the auth context with new user data
      queryClient.invalidateQueries({ queryKey: ["user"] })
      setHasChanges(false)
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updates: UpdateUserRequest = {}

    if (formData.firstName !== user?.firstName) {
      updates.firstName = formData.firstName.trim()
    }
    if (formData.lastName !== user?.lastName) {
      updates.lastName = formData.lastName.trim()
    }
    if (formData.phone !== user?.phone) {
      updates.phone = formData.phone.trim() || undefined
    }

    if (Object.keys(updates).length === 0) {
      toast({
        title: "No changes",
        description: "No changes were made to your profile.",
      })
      return
    }

    updateProfileMutation.mutate(updates)
  }

  const resetForm = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    })
    setHasChanges(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
        <CardDescription>Update your personal information and contact details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
                disabled={updateProfileMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
                disabled={updateProfileMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={formData.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              Email address cannot be changed. Contact support if you need to update your email.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              disabled={updateProfileMutation.isPending}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={!hasChanges || updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>

            {hasChanges && (
              <Button type="button" variant="outline" onClick={resetForm} disabled={updateProfileMutation.isPending}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
