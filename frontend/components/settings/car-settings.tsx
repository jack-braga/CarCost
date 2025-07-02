"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Car, Edit, Trash2, Star, StarOff } from "lucide-react"
import { api } from "@/lib/api"
import type { Car as CarType } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { AddCarDialog } from "./add-car-dialog"
import { EditCarDialog } from "./edit-car-dialog"

interface CarSettingsProps {
  cars: CarType[]
  isLoading: boolean
}

export function CarSettings({ cars, isLoading }: CarSettingsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingCar, setEditingCar] = useState<CarType | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const setDefaultMutation = useMutation({
    mutationFn: (carId: string) => api.setDefaultCar(carId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] })
      toast({
        title: "Default car updated",
        description: "Your default car has been updated successfully.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update default car.",
        variant: "destructive",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (carId: string) => api.deleteCar(carId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] })
      toast({
        title: "Car deleted",
        description: "The car has been removed from your account.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete car.",
        variant: "destructive",
      })
    },
  })

  const handleSetDefault = (carId: string) => {
    setDefaultMutation.mutate(carId)
  }

  const handleDelete = (car: CarType) => {
    if (car.isDefault && cars.length > 1) {
      toast({
        title: "Cannot delete default car",
        description: "Please set another car as default before deleting this one.",
        variant: "destructive",
      })
      return
    }

    if (confirm(`Are you sure you want to delete ${car.name}?`)) {
      deleteMutation.mutate(car.id)
    }
  }

  const getFuelTypeColor = (fuelType: string) => {
    switch (fuelType) {
      case "petrol":
        return "bg-blue-100 text-blue-800"
      case "diesel":
        return "bg-yellow-100 text-yellow-800"
      case "electric":
        return "bg-green-100 text-green-800"
      case "hybrid":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="h-5 w-24 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Your Cars
              </CardTitle>
              <CardDescription>Manage your vehicles and their settings</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Car
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cars.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No cars added yet</h3>
              <p className="text-muted-foreground mb-4">Add your first car to start tracking fuel expenses</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Car
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cars.map((car) => (
                <div key={car.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{car.name}</h3>
                        {car.isDefault && (
                          <Badge variant="default" className="text-xs">
                            <Star className="mr-1 h-3 w-3" />
                            Default
                          </Badge>
                        )}
                        <Badge className={`text-xs ${getFuelTypeColor(car.fuelType)}`}>
                          {car.fuelType.charAt(0).toUpperCase() + car.fuelType.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {car.year} {car.make} {car.model}
                        {car.color && ` • ${car.color}`}
                        {car.licensePlate && ` • ${car.licensePlate}`}
                      </p>
                      {car.tankCapacity && (
                        <p className="text-xs text-muted-foreground">Tank Capacity: {car.tankCapacity}L</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!car.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(car.id)}
                          disabled={setDefaultMutation.isPending}
                        >
                          <StarOff className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setEditingCar(car)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(car)}
                        disabled={deleteMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddCarDialog open={showAddDialog} onOpenChange={setShowAddDialog} isFirstCar={cars.length === 0} />

      {editingCar && (
        <EditCarDialog car={editingCar} open={!!editingCar} onOpenChange={(open) => !open && setEditingCar(null)} />
      )}
    </>
  )
}
