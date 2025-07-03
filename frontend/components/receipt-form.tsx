"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, X, ImageIcon } from "lucide-react"
import { api } from "@/lib/api"
import type { FuelReceipt, OCRResult } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ReceiptFormProps {
  initialData?: OCRResult | FuelReceipt | null
  onSuccess: () => void
  onCancel: () => void
  imagePreview?: string | null
}

export function ReceiptForm({ initialData, onSuccess, onCancel, imagePreview }: ReceiptFormProps) {
  const isUpdating = !!(initialData && 'id' in initialData); // FIXME: workaround solution to distinguish between a OCRResult vs. FuelReceipt being made the initialData
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split("T")[0],
    amountPaid: initialData?.amountPaid?.toString() || "",
    volumePurchased: initialData?.volumePurchased?.toString() || "",
    advertisedPrice: initialData?.advertisedPrice?.toString() || "",
    // vendor: initialData?.vendor || "",
    odometer: initialData?.odometer?.toString() || "",
  })

  const [selectedCarId, setSelectedCarId] = useState<string>(isUpdating ? initialData.carId : "")

  // Fetch user's cars
  const { data: cars = [] } = useQuery({
    queryKey: ["cars"],
    queryFn: api.getCars,
  })

  // Set default car if available
  useEffect(() => {
    if (cars.length > 0 && !selectedCarId) {
      const defaultCar = cars.find((car) => car.isDefault) || cars[0]
      setSelectedCarId(defaultCar.id)
    }
  }, [cars, selectedCarId])

  const { toast } = useToast()

  const saveMutation = useMutation({
    mutationFn: api.saveFuelReceipt,
    onSuccess: () => {
      onSuccess()
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save receipt. Please try again.",
        variant: "destructive",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FuelReceipt> }) =>
      api.updateFuelReceipt(id, updates),
    onSuccess: () => {
      onSuccess()
    },
    onError: (error: Error) => {
      toast({
        title: "Edit failed",
        description: error.message || "Failed to edit receipt. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.date || !formData.amountPaid || !formData.volumePurchased || !formData.advertisedPrice || !formData.odometer) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!selectedCarId) {
      toast({
        title: "Missing vehicle",
        description: "Please select a vehicle for this receipt.",
        variant: "destructive",
      })
      return
    }

    const amountPaid = Number.parseFloat(formData.amountPaid)
    const volumePurchased = Number.parseFloat(formData.volumePurchased)
    const advertisedPrice = Number.parseFloat(formData.advertisedPrice)
    const odometer = Number.parseInt(formData.odometer)

    if (isNaN(amountPaid) || amountPaid <= 0) {
      toast({
        title: "Invalid amount paid",
        description: "Please enter a valid amount paid greater than 0.",
        variant: "destructive",
      })
      return
    }

    if (isNaN(volumePurchased) || volumePurchased <= 0) {
      toast({
        title: "Invalid volume purchased",
        description: "Please enter a valid volume purchased greater than 0.",
        variant: "destructive",
      })
      return
    }

    if (isNaN(advertisedPrice) || advertisedPrice <= 0) {
      toast({
        title: "Invalid advertised price",
        description: "Please enter a valid advertised price greater than 0.",
        variant: "destructive",
      })
      return
    }

    if (isNaN(odometer) || odometer <= 0) {
      toast({
        title: "Invalid odometer",
        description: "Please enter a valid odometer reading.",
        variant: "destructive",
      })
      return
    }

    if (isUpdating) {
      const updates: Partial<FuelReceipt> = {};
      if (!initialData || initialData.date === undefined || formData.date !== initialData.date) {
        updates.date = formData.date;
      }
      if (!initialData || initialData.amountPaid === undefined || amountPaid !== initialData.amountPaid) {
        updates.amountPaid = amountPaid;
      }
      if (!initialData || initialData.volumePurchased === undefined || volumePurchased !== initialData.volumePurchased) {
        updates.volumePurchased = volumePurchased;
      }
      if (!initialData || initialData.advertisedPrice === undefined || advertisedPrice !== initialData.advertisedPrice) {
        updates.advertisedPrice = advertisedPrice;
      }
      if (!initialData || initialData.odometer === undefined || odometer !== initialData.odometer) {
        updates.odometer = odometer;
      }
      if (!initialData || initialData.odometer === undefined || odometer !== initialData.odometer) {
        updates.odometer = odometer;
      }
      if (!initialData || initialData.carId === undefined || selectedCarId !== initialData.carId) {
        updates.carId = selectedCarId;
      }

      if (Object.keys(updates).length === 0) {
        toast({
          title: "No changes",
          description: "No changes were made to your receipt.",
        })
        return
      }

      updateMutation.mutate({
        id: initialData.id,
        updates: updates
      })
    } else {
      saveMutation.mutate({
        date: formData.date,
        amountPaid,
        volumePurchased,
        advertisedPrice,
        // vendor: formData.vendor.trim(),
        odometer,
        carId: selectedCarId,
      })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRoundOnBlur = (field: string, value: string, decimalPlaces: number = 2) => {
    const floatValue = parseFloat(value);
    if (!isNaN(floatValue)) {
      handleInputChange(field, floatValue.toFixed(decimalPlaces));
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {imagePreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Receipt Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={imagePreview || "/placeholder.svg"}
              alt="Receipt"
              className="w-full h-auto max-h-96 object-contain border rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      <Card className={imagePreview ? "" : "md:col-span-2"}>
        <CardHeader>
          <CardTitle>{(isUpdating && "Edit ") + "Receipt Details"}</CardTitle>
          <CardDescription>
            {initialData
              ? isUpdating
                ? "Edit your fuel receipt details"
                : `Review and adjust the extracted information (Confidence: ${Math.round((initialData.confidence || 0) * 100)}%)`
              : "Enter your fuel receipt details manually"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="car">Vehicle *</Label>
                <Select value={selectedCarId} onValueChange={setSelectedCarId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {cars.map((car) => (
                      <SelectItem key={car.id} value={car.id}>
                        {car.name} ({car.year} {car.make} {car.model}){car.isDefault && " - Default"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cars.length === 0 && (
                  <p className="text-xs text-muted-foreground">No cars found. Please add a car in Settings first.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid ($) *</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amountPaid}
                  onChange={(e) => handleInputChange("amountPaid", e.target.value)}
                  onBlur={(e) => handleRoundOnBlur("amountPaid", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="volumePurchased">Volume Purchased (L) *</Label>
                <Input
                  id="volumePurchased"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.volumePurchased}
                  onChange={(e) => handleInputChange("volumePurchased", e.target.value)}
                  onBlur={(e) => handleRoundOnBlur("volumePurchased", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="advertisedPrice">Advertised Price ($/L) *</Label>
                <Input
                  id="advertisedPrice"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.000"
                  value={formData.advertisedPrice}
                  onChange={(e) => handleInputChange("advertisedPrice", e.target.value)}
                  onBlur={(e) => handleRoundOnBlur("advertisedPrice", e.target.value, 3)}
                  required
                />
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Input
                  id="vendor"
                  type="text"
                  placeholder="e.g., Shell, BP, Caltex"
                  value={formData.vendor}
                  onChange={(e) => handleInputChange("vendor", e.target.value)}
                  required
                />
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="odometer">Odometer Reading (km)</Label>
                <Input
                  id="odometer"
                  type="number"
                  min="0"
                  placeholder="e.g., 45230"
                  value={formData.odometer}
                  onChange={(e) => handleInputChange("odometer", e.target.value)}
                  onBlur={(e) => handleRoundOnBlur("odometer", e.target.value)}
                  required
                />
              </div>
            </div>

            {!isUpdating && initialData?.rawText && (
              <div className="space-y-2">
                <Label htmlFor="rawText">Raw OCR Text (for reference)</Label>
                <Textarea id="rawText" value={initialData.rawText} readOnly className="text-xs bg-muted" rows={3} />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isUpdating ? updateMutation.isPending : saveMutation.isPending} className="flex-1">
                {isUpdating ?
                  (
                    updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Editing...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Edit Receipt
                      </>
                    )
                  ) : (
                    saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Receipt
                      </>
                    )
                  )
                }
              </Button>

              <Button type="button" variant="outline" onClick={onCancel} disabled={isUpdating ? updateMutation.isPending : saveMutation.isPending}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
