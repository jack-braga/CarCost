"use client"

import type React from "react"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Plus } from "lucide-react"
import { api } from "@/lib/api"
import type { CreateCarRequest } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface AddCarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isFirstCar: boolean
}

export function AddCarDialog({ open, onOpenChange, isFirstCar }: AddCarDialogProps) {
  const [formData, setFormData] = useState<CreateCarRequest>({
    name: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    licensePlate: "",
    fuelType: "petrol",
    tankCapacity: undefined,
    isDefault: isFirstCar,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createCarMutation = useMutation({
    mutationFn: (car: CreateCarRequest) => api.createCar(car),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] })
      toast({
        title: "Car added",
        description: "Your car has been added successfully.",
      })
      onOpenChange(false)
      resetForm()
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add car",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    },
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Car name is required"
    }
    if (!formData.make.trim()) {
      newErrors.make = "Make is required"
    }
    if (!formData.model.trim()) {
      newErrors.model = "Model is required"
    }
    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
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

    const carData: CreateCarRequest = {
      ...formData,
      name: formData.name.trim(),
      make: formData.make.trim(),
      model: formData.model.trim(),
      color: formData.color?.trim() || undefined,
      licensePlate: formData.licensePlate?.trim() || undefined,
      tankCapacity: formData.tankCapacity || undefined,
    }

    createCarMutation.mutate(carData)
  }

  const handleInputChange = (field: keyof CreateCarRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      licensePlate: "",
      fuelType: "petrol",
      tankCapacity: undefined,
      isDefault: isFirstCar,
    })
    setErrors({})
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Car</DialogTitle>
          <DialogDescription>Add a new car to your account to start tracking fuel expenses.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Car Name *</Label>
              <Input
                id="name"
                placeholder="My Honda Civic"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={createCarMutation.isPending}
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
                value={formData.year}
                onChange={(e) => handleInputChange("year", Number.parseInt(e.target.value))}
                disabled={createCarMutation.isPending}
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
                value={formData.make}
                onChange={(e) => handleInputChange("make", e.target.value)}
                disabled={createCarMutation.isPending}
              />
              {errors.make && <p className="text-sm text-destructive">{errors.make}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                placeholder="Civic"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                disabled={createCarMutation.isPending}
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
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                disabled={createCarMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate</Label>
              <Input
                id="licensePlate"
                placeholder="ABC-123"
                value={formData.licensePlate}
                onChange={(e) => handleInputChange("licensePlate", e.target.value)}
                disabled={createCarMutation.isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fuelType">Fuel Type *</Label>
              <Select
                value={formData.fuelType}
                onValueChange={(value) => handleInputChange("fuelType", value as any)}
                disabled={createCarMutation.isPending}
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
                disabled={createCarMutation.isPending}
              />
              {errors.tankCapacity && <p className="text-sm text-destructive">{errors.tankCapacity}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) => handleInputChange("isDefault", checked)}
              disabled={createCarMutation.isPending || isFirstCar}
            />
            <Label htmlFor="isDefault" className="text-sm">
              Set as default car
              {isFirstCar && " (automatically set for first car)"}
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={createCarMutation.isPending} className="flex-1">
              {createCarMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Car
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createCarMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
