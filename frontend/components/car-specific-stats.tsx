"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { FuelReceipt, Car } from "@/lib/types"
import { DollarSign, TrendingUp, Gauge, Calendar, Fuel, BarChart3 } from "lucide-react"

interface CarSpecificStatsProps {
  receipts: FuelReceipt[]
  cars: Car[]
  selectedCarId: string | null
}

export function CarSpecificStats({ receipts, cars, selectedCarId }: CarSpecificStatsProps) {
  // Filter receipts by selected car or show all
  const filteredReceipts = selectedCarId ? receipts.filter((receipt) => receipt.carId === selectedCarId) : receipts

  const selectedCar = selectedCarId ? cars.find((car) => car.id === selectedCarId) : null

  // Calculate stats
  const totalSpent = filteredReceipts.reduce((sum, receipt) => sum + receipt.amount, 0)
  const averagePerFillup = filteredReceipts.length > 0 ? totalSpent / filteredReceipts.length : 0

  // Calculate distance and fuel efficiency
  const sortedReceipts = [...filteredReceipts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const lastOdometer = sortedReceipts.length > 0 ? sortedReceipts[sortedReceipts.length - 1].odometer : 0
  const firstOdometer = sortedReceipts.length > 0 ? sortedReceipts[0].odometer : 0
  const totalDistance = lastOdometer - firstOdometer

  // Calculate fuel efficiency (assuming amount represents liters for simplicity)
  const totalFuel = filteredReceipts.reduce((sum, receipt) => sum + receipt.amount / 1.5, 0) // Rough conversion
  const fuelEfficiency = totalDistance > 0 && totalFuel > 0 ? totalDistance / totalFuel : 0

  // This month spending
  const thisMonth = new Date().getMonth()
  const thisYear = new Date().getFullYear()
  const thisMonthSpent = filteredReceipts
    .filter((r) => {
      const date = new Date(r.date)
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear
    })
    .reduce((sum, receipt) => sum + receipt.amount, 0)

  // Per-car breakdown if showing all cars
  const carBreakdown = !selectedCarId
    ? cars
        .map((car) => {
          const carReceipts = receipts.filter((r) => r.carId === car.id)
          const carTotal = carReceipts.reduce((sum, r) => sum + r.amount, 0)
          return {
            car,
            receipts: carReceipts.length,
            total: carTotal,
            percentage: totalSpent > 0 ? (carTotal / totalSpent) * 100 : 0,
          }
        })
        .filter((item) => item.receipts > 0)
    : []

  return (
    <div className="space-y-4">
      {/* Header with car info */}
      {selectedCar && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedCar.name}</h3>
                <p className="text-muted-foreground">
                  {selectedCar.year} {selectedCar.make} {selectedCar.model}
                  {selectedCar.color && ` • ${selectedCar.color}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getFuelTypeColor(selectedCar.fuelType)}`}>
                  {selectedCar.fuelType.charAt(0).toUpperCase() + selectedCar.fuelType.slice(1)}
                </Badge>
                {selectedCar.isDefault && <Badge variant="secondary">Default</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across {filteredReceipts.length} fill-ups
              {selectedCarId ? ` for ${selectedCar?.name}` : " for all cars"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${thisMonthSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current month spending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Fill-up</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averagePerFillup.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Average cost per visit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedCarId ? "Fuel Efficiency" : "Distance Tracked"}
            </CardTitle>
            {selectedCarId ? (
              <Fuel className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Gauge className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            {selectedCarId ? (
              <>
                <div className="text-2xl font-bold">
                  {fuelEfficiency > 0 ? `${fuelEfficiency.toFixed(1)} km/L` : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Fuel efficiency</p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalDistance.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total kilometers</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Car breakdown when showing all cars */}
      {!selectedCarId && carBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Spending by Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {carBreakdown.map(({ car, receipts: carReceipts, total, percentage }) => (
                <div key={car.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{car.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {car.year} {car.make} {car.model}
                      </p>
                    </div>
                    <Badge className={`text-xs ${getFuelTypeColor(car.fuelType)}`}>{car.fuelType}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${total.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {carReceipts} receipts • {percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getFuelTypeColor(fuelType: string) {
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
