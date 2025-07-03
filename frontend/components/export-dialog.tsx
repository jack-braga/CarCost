"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Download, FileText, Calendar } from "lucide-react"
import type { FuelReceipt, Car } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ExportDialogProps {
  receipts: FuelReceipt[]
  cars: Car[]
}

export function ExportDialog({ receipts, cars }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedCarId, setSelectedCarId] = useState<string>("all")
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv")
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  })
  const [includeFields, setIncludeFields] = useState({
    date: true,
    amountPaid: true,
    volumePurchased: true,
    advertisedPrice: true,
    odometer: true,
    carInfo: true,
    fuelType: true,
  })
  const { toast } = useToast()

  const handleExport = () => {
    // Filter receipts by car and date range
    let filteredReceipts = selectedCarId !== "all" ? receipts.filter((r) => r.carId === selectedCarId) : receipts

    if (dateRange.start) {
      filteredReceipts = filteredReceipts.filter((r) => new Date(r.date) >= new Date(dateRange.start))
    }
    if (dateRange.end) {
      filteredReceipts = filteredReceipts.filter((r) => new Date(r.date) <= new Date(dateRange.end))
    }

    if (filteredReceipts.length === 0) {
      toast({
        title: "No data to export",
        description: "No receipts match your selected criteria.",
        variant: "destructive",
      })
      return
    }

    // Prepare export data
    const exportData = filteredReceipts.map((receipt) => {
      const car = cars.find((c) => c.id === receipt.carId)
      const data: any = {}

      if (includeFields.date) data.Date = new Date(receipt.date).toLocaleDateString()
      // if (includeFields.vendor) data.Vendor = receipt.vendor
      if (includeFields.amountPaid) data["Amount Paid"] = receipt.amountPaid;
      if (includeFields.volumePurchased) data["Volume Purchased"] = receipt.volumePurchased;
      if (includeFields.advertisedPrice) data["Advertised Price"] = receipt.advertisedPrice;
      if (includeFields.odometer) data.Odometer = receipt.odometer
      if (includeFields.carInfo && car) {
        data["Car Name"] = car.name
        data["Car Make"] = car.make
        data["Car Model"] = car.model
        data["Car Year"] = car.year
      }
      if (includeFields.fuelType && car) data["Fuel Type"] = car.fuelType

      return data
    })

    // Generate filename
    const carName =
      selectedCarId !== "all"
        ? cars.find((c) => c.id === selectedCarId)?.name.replace(/[^a-zA-Z0-9]/g, "_")
        : "all_cars"
    const dateStr = new Date().toISOString().split("T")[0]
    const filename = `fuel_receipts_${carName}_${dateStr}.${exportFormat}`

    if (exportFormat === "csv") {
      exportToCSV(exportData, filename)
    } else {
      exportToJSON(exportData, filename)
    }

    toast({
      title: "Export successful",
      description: `${filteredReceipts.length} receipts exported to ${filename}`,
    })

    setOpen(false)
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // Escape commas and quotes in CSV
            return typeof value === "string" && (value.includes(",") || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value
          })
          .join(","),
      ),
    ].join("\n")

    downloadFile(csvContent, filename, "text/csv")
  }

  const exportToJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        totalRecords: data.length,
        filters: {
          car: selectedCarId !== "all" ? cars.find((c) => c.id === selectedCarId)?.name : "All Cars",
          dateRange:
            dateRange.start || dateRange.end
              ? {
                start: dateRange.start || null,
                end: dateRange.end || null,
              }
              : null,
        },
        data,
      },
      null,
      2,
    )

    downloadFile(jsonContent, filename, "application/json")
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleFieldChange = (field: keyof typeof includeFields, checked: boolean) => {
    setIncludeFields((prev) => ({ ...prev, [field]: checked }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Fuel Data
          </DialogTitle>
          <DialogDescription>Export your fuel receipt data with customizable filters and formats</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Car Selection */}
          <div className="space-y-2">
            <Label>Vehicle</Label>
            <Select value={selectedCarId} onValueChange={setSelectedCarId}>
              <SelectTrigger>
                <SelectValue placeholder="All vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {cars.map((car) => (
                  <SelectItem key={car.id} value={car.id}>
                    {car.name} ({car.year} {car.make} {car.model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="startDate" className="text-xs">
                  From
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs">
                  To
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: "csv" | "json") => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                <SelectItem value="json">JSON (Data)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fields to Include */}
          <div className="space-y-2">
            <Label>Fields to Include</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(includeFields).map(([field, checked]) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={checked}
                    onCheckedChange={(checked) => handleFieldChange(field as keyof typeof includeFields, !!checked)}
                  />
                  <Label htmlFor={field} className="text-sm">
                    {field === "carInfo"
                      ? "Car Details"
                      : field.charAt(0).toUpperCase() + field.slice(1).replace(/(?!^)([A-Z])/g, ' $1')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">Export Summary</p>
            <p className="text-xs text-muted-foreground">
              {selectedCarId !== "all" ? `${cars.find((c) => c.id === selectedCarId)?.name} • ` : "All vehicles • "}
              {receipts.filter((r) => (selectedCarId !== "all" ? r.carId === selectedCarId : true)).length} receipts
              {(dateRange.start || dateRange.end) && " • Filtered by date"}
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleExport} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Export {exportFormat.toUpperCase()}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
