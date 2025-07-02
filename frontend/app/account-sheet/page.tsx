"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Trash2, Edit } from "lucide-react"
import { api } from "@/lib/api"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { ExportDialog } from "@/components/export-dialog"
import { CarSelector } from "@/components/car-selector"

export default function AccountSheetPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)

  // Fetch user's cars
  const { data: cars = [] } = useQuery({
    queryKey: ["cars"],
    queryFn: api.getCars,
  })

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["fuel-receipts"],
    queryFn: api.getFuelReceipts,
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteFuelReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-receipts"] })
      toast({
        title: "Receipt deleted",
        description: "The receipt has been removed from your records.",
      })
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete receipt. Please try again.",
        variant: "destructive",
      })
    },
  })

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      receipt.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.date.includes(searchTerm) ||
      receipt.amount.toString().includes(searchTerm)

    const matchesCar = selectedCarId ? receipt.carId === selectedCarId : true

    return matchesSearch && matchesCar
  })

  const totalAmount = filteredReceipts.reduce((sum, receipt) => sum + receipt.amount, 0)

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this receipt?")) {
      deleteMutation.mutate(id)
    }
  }

  const exportToCSV = () => {
    const headers = ["Date", "Vendor", "Amount", "Odometer"]
    const csvContent = [
      headers.join(","),
      ...filteredReceipts.map((receipt) => [receipt.date, receipt.vendor, receipt.amount, receipt.odometer].join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fuel-receipts.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex gap-4">
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Sheet</h1>
            <p className="text-muted-foreground">
              {selectedCarId
                ? `Fuel receipts for ${cars.find((c) => c.id === selectedCarId)?.name}`
                : "Complete record of all your fuel receipts"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportDialog receipts={receipts} cars={cars} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Fuel Receipts</CardTitle>
                <CardDescription>
                  {filteredReceipts.length} receipts • Total: ${totalAmount.toFixed(2)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <CarSelector
                  selectedCarId={selectedCarId}
                  onCarChange={setSelectedCarId}
                  showAllOption={true}
                  className="w-auto"
                />
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search receipts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Odometer</TableHead>
                  <TableHead>Car</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm
                        ? "No receipts match your search."
                        : "No receipts found. Upload your first receipt to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceipts
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell>{new Date(receipt.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{receipt.vendor}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">${receipt.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{receipt.odometer.toLocaleString()} km</TableCell>
                        <TableCell>
                          {(() => {
                            const car = cars.find((c) => c.id === receipt.carId)
                            return car ? (
                              <div>
                                <p className="font-medium text-sm">{car.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {car.year} {car.make} {car.model}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Unknown</span>
                            )
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(receipt.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}
