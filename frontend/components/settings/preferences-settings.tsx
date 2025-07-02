"use client"

import type React from "react"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Settings } from "lucide-react"
import { api } from "@/lib/api"
import type { User, UpdateUserRequest } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface PreferencesSettingsProps {
  user: User | null
}

const currencies = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
]

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
]

export function PreferencesSettings({ user }: PreferencesSettingsProps) {
  const [formData, setFormData] = useState({
    currency: user?.currency || "USD",
    timezone: user?.timezone || "America/New_York",
  })
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const updatePreferencesMutation = useMutation({
    mutationFn: (updates: UpdateUserRequest) => api.updateUserProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] })
      setHasChanges(false)
      toast({
        title: "Preferences updated",
        description: "Your preferences have been updated successfully.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update preferences. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updates: UpdateUserRequest = {}

    if (formData.currency !== user?.currency) {
      updates.currency = formData.currency
    }
    if (formData.timezone !== user?.timezone) {
      updates.timezone = formData.timezone
    }

    if (Object.keys(updates).length === 0) {
      toast({
        title: "No changes",
        description: "No changes were made to your preferences.",
      })
      return
    }

    updatePreferencesMutation.mutate(updates)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const resetForm = () => {
    setFormData({
      currency: user?.currency || "USD",
      timezone: user?.timezone || "America/New_York",
    })
    setHasChanges(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Preferences
        </CardTitle>
        <CardDescription>Customize your app experience and regional settings</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => handleInputChange("currency", value)}
              disabled={updatePreferencesMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This will affect how monetary amounts are displayed throughout the app
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => handleInputChange("timezone", value)}
              disabled={updatePreferencesMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((timezone) => (
                  <SelectItem key={timezone.value} value={timezone.value}>
                    {timezone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">This will affect how dates and times are displayed</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={!hasChanges || updatePreferencesMutation.isPending}>
              {updatePreferencesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>

            {hasChanges && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={updatePreferencesMutation.isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
