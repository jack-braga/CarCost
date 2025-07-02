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
import type { OCRResult } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ReceiptFormProps {
  initialData?: OCRResult | null
  onSuccess: () => void
  onCancel: () => void
  imagePreview?: string | null
}

export function ReceiptForm({ initialData, onSuccess, onCancel, imagePreview }: ReceiptFormProps) {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split("T")[0],
    amount: initialData?.amount?.toString() || "",
    vendor: initialData?.vendor || "",
    odometer: initialData?.odometer?.toString() || "",
  })

  const [selectedCarId, setSelectedCarId] = useState<string>("")

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.date || !formData.amount || !formData.vendor || !formData.odometer) {
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

    const amount = Number.parseFloat(formData.amount)
    const odometer = Number.parseInt(formData.odometer)

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0.",
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

    saveMutation.mutate({
      date: formData.date,
      amount,
      vendor: formData.vendor.trim(),
      odometer,
      carId: selectedCarId,
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

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
          <CardTitle>Receipt Details</CardTitle>
          <CardDescription>
            {initialData
              ? `Review and adjust the extracted information (Confidence: ${Math.round((initialData.confidence || 0) * 100)}%)`
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
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Input
                  id="vendor"
                  type="text"
                  placeholder="e.g., Shell, BP, Caltex"
                  value={formData.vendor}
                  onChange={(e) => handleInputChange("vendor", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="odometer">Odometer Reading *</Label>
                <Input
                  id="odometer"
                  type="number"
                  min="0"
                  placeholder="e.g., 45230"
                  value={formData.odometer}
                  onChange={(e) => handleInputChange("odometer", e.target.value)}
                  required
                />
              </div>
            </div>

            {initialData?.rawText && (
              <div className="space-y-2">
                <Label htmlFor="rawText">Raw OCR Text (for reference)</Label>
                <Textarea id="rawText" value={initialData.rawText} readOnly className="text-xs bg-muted" rows={3} />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Receipt
                  </>
                )}
              </Button>

              <Button type="button" variant="outline" onClick={onCancel} disabled={saveMutation.isPending}>
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
