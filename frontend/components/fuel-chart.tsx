"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { FuelReceipt } from "@/lib/types"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts"

interface FuelChartProps {
  receipts: FuelReceipt[]
}

export function FuelChart({ receipts }: FuelChartProps) {
  // Prepare data for charts
  const chartData = receipts
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((receipt) => ({
      date: new Date(receipt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount: receipt.amount,
      odometer: receipt.odometer,
    }))

  // Monthly spending data
  const monthlyData = receipts.reduce(
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
          <CardTitle>Spending Over Time</CardTitle>
          <CardDescription>Your fuel costs per fill-up</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
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

      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending</CardTitle>
          <CardDescription>Total fuel costs by month</CardDescription>
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
    </div>
  )
}
