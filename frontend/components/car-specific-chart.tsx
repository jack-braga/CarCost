"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { FuelReceipt, Car } from "@/lib/types"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"

interface CarSpecificChartProps {
  receipts: FuelReceipt[]
  cars: Car[]
  selectedCarId: string | null
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export function CarSpecificChart({ receipts, cars, selectedCarId }: CarSpecificChartProps) {
  // Filter receipts by selected car or show all
  const filteredReceipts = selectedCarId ? receipts.filter((receipt) => receipt.carId === selectedCarId) : receipts

  // Prepare data for spending over time chart
  const spendingData = filteredReceipts
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((receipt) => ({
      date: new Date(receipt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount: receipt.amount,
      odometer: receipt.odometer,
      car: cars.find((c) => c.carId === receipt.carId)?.name || "Unknown",
    }))

  // Monthly spending data
  const monthlyData = filteredReceipts.reduce(
    (acc, receipt) => {
      const month = new Date(receipt.date).toLocaleDateString("en-US", { year: "numeric", month: "short" })
      acc[month] = (acc[month] || 0) + receipt.amount
      return acc
    },
    {} as Record<string, number>,
  )

  const monthlyChartData = Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount,
  }))

  // Car comparison data (when showing all cars)
  const carComparisonData = !selectedCarId
    ? cars
        .map((car) => {
          const carReceipts = receipts.filter((r) => r.carId === car.id)
          const total = carReceipts.reduce((sum, r) => sum + r.amount, 0)
          return {
            name: car.name,
            value: total,
            receipts: carReceipts.length,
            car: car,
          }
        })
        .filter((item) => item.value > 0)
    : []

  const chartConfig = {
    amount: {
      label: "Amount ($)",
      color: "hsl(var(--chart-1))",
    },
    odometer: {
      label: "Odometer",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{selectedCarId ? "Spending Over Time" : "All Cars - Spending Over Time"}</CardTitle>
          <CardDescription>
            {selectedCarId
              ? `Fuel costs for ${cars.find((c) => c.id === selectedCarId)?.name}`
              : "Combined fuel costs across all vehicles"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spendingData}>
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-amount)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-amount)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {selectedCarId ? (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending</CardTitle>
            <CardDescription>Monthly fuel costs for {cars.find((c) => c.id === selectedCarId)?.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChartData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
            <CardDescription>Fuel spending breakdown by vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={carComparisonData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: $${value.toFixed(0)} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {carComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-md">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm">Total: ${data.value.toFixed(2)}</p>
                          <p className="text-sm">{data.receipts} receipts</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
