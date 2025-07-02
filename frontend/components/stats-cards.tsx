"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FuelReceipt } from "@/lib/types"
import { DollarSign, TrendingUp, Gauge, Calendar } from "lucide-react"

interface StatsCardsProps {
  receipts: FuelReceipt[]
}

export function StatsCards({ receipts }: StatsCardsProps) {
  const totalSpent = receipts.reduce((sum, receipt) => sum + receipt.amount, 0)
  const averagePerFillup = receipts.length > 0 ? totalSpent / receipts.length : 0
  const lastOdometer = receipts.length > 0 ? Math.max(...receipts.map((r) => r.odometer)) : 0
  const firstOdometer = receipts.length > 0 ? Math.min(...receipts.map((r) => r.odometer)) : 0
  const totalDistance = lastOdometer - firstOdometer

  const thisMonth = new Date().getMonth()
  const thisYear = new Date().getFullYear()
  const thisMonthSpent = receipts
    .filter((r) => {
      const date = new Date(r.date)
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear
    })
    .reduce((sum, receipt) => sum + receipt.amount, 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Across {receipts.length} fill-ups</p>
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
          <CardTitle className="text-sm font-medium">Distance Tracked</CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDistance.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total kilometers</p>
        </CardContent>
      </Card>
    </div>
  )
}
