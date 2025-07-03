"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save } from "lucide-react"
import { api } from "@/lib/api"
import type { Car, CreateCarRequest } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface EditCarDialogProps {
  car: Car
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCarDialog({ car, open, onOpenChange }: EditCarDialogProps) {
  const [formData, setFormData] = useState<Partial<CreateCarRequest>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Initialize form data when car changes
  useEffect(() => {
    if (car) {
      setFormData({
        name: car.name,
        make: car.make,
        model: car.model,
        year: car.year,
        color: car.color || "",
        licensePlate: car.licensePlate || "",
        fuelType: car.fuelType,
        tankCapacity: car.tankCapacity,
      })
      setHasChanges(false)
    }
  }, [car])

  const updateCarMutation = useMutation({
    mutationFn: (updates: Partial<CreateCarRequest>) => api.updateCar(car.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] })
      toast({
        title: "Car updated",
        description: "Your car has been updated successfully.",
      })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update car",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    },
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = "Car name is required"
    }
    if (!formData.make?.trim()) {
      newErrors.make = "Make is required"
    }
    if (!formData.model?.trim()) {
      newErrors.model = "Model is required"
    }
    if (formData.year && (formData.year < 1900 || formData.year > new Date().getFullYear() + 1)) {
      newErrors.year = "Please enter a valid year"
    }
    if (formData.tankCapacity && (formData.tankCapacity <= 0 || formData.tankCapacity > 200)) {
      newErrors.tankCapacity = "Tank capacity must be between 1 and 200 liters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Only send changed fields
    const updates: Partial<CreateCarRequest> = {}

    if (formData.name?.trim() !== car.name) {
      updates.name = formData.name!.trim()
    }
    if (formData.make?.trim() !== car.make) {
      updates.make = formData.make!.trim()
    }
    if (formData.model?.trim() !== car.model) {
      updates.model = formData.model!.trim()
    }
    if (formData.year !== car.year) {
      updates.year = formData.year!
    }
    if (formData.color?.trim() !== car.color) {
      updates.color = formData.color?.trim() || undefined
    }
    if (formData.licensePlate?.trim() !== car.licensePlate) {
      updates.licensePlate = formData.licensePlate?.trim() || undefined
    }
    if (formData.fuelType !== car.fuelType) {
      updates.fuelType = formData.fuelType!
    }
    if (formData.tankCapacity !== car.tankCapacity) {
      updates.tankCapacity = formData.tankCapacity || undefined
    }

    if (Object.keys(updates).length === 0) {
      toast({
        title: "No changes",
        description: "No changes were made to your car.",
      })
      return
    }

    updateCarMutation.mutate(updates)
  }

  const handleInputChange = (field: keyof CreateCarRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Car</DialogTitle>
          <DialogDescription>Update your car's information and settings.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Car Name *</Label>
              <Input
                id="name"
                placeholder="My Honda Civic"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={updateCarMutation.isPending}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.year || ""}
                onChange={(e) => handleInputChange("year", Number.parseInt(e.target.value))}
                disabled={updateCarMutation.isPending}
              />
              {errors.year && <p className="text-sm text-destructive">{errors.year}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="make">Make *</Label>
              <Input
                id="make"
                placeholder="Honda"
                value={formData.make || ""}
                onChange={(e) => handleInputChange("make", e.target.value)}
                disabled={updateCarMutation.isPending}
              />
              {errors.make && <p className="text-sm text-destructive">{errors.make}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                placeholder="Civic"
                value={formData.model || ""}
                onChange={(e) => handleInputChange("model", e.target.value)}
                disabled={updateCarMutation.isPending}
              />
              {errors.model && <p className="text-sm text-destructive">{errors.model}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="Blue"
                value={formData.color || ""}
                onChange={(e) => handleInputChange("color", e.target.value)}
                disabled={updateCarMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate</Label>
              <Input
                id="licensePlate"
                placeholder="ABC-123"
                value={formData.licensePlate || ""}
                onChange={(e) => handleInputChange("licensePlate", e.target.value)}
                disabled={updateCarMutation.isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fuelType">Fuel Type *</Label>
              <Select
                value={formData.fuelType}
                onValueChange={(value) => handleInputChange("fuelType", value as any)}
                disabled={updateCarMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tankCapacity">Tank Capacity (L)</Label>
              <Input
                id="tankCapacity"
                type="number"
                min="1"
                step="0.01"
                max="200"
                placeholder="50"
                value={formData.tankCapacity || ""}
                onChange={(e) =>
                  handleInputChange("tankCapacity", e.target.value)
                }
                disabled={updateCarMutation.isPending}
              />
              {errors.tankCapacity && <p className="text-sm text-destructive">{errors.tankCapacity}</p>}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={!hasChanges || updateCarMutation.isPending} className="flex-1">
              {updateCarMutation.isPending ? (
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

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateCarMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
