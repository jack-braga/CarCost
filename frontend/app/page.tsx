"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { api } from "@/lib/api"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { useState } from "react"
import { CarSpecificStats } from "@/components/car-specific-stats"
import { CarSpecificChart } from "@/components/car-specific-chart"
import { CarSelector } from "@/components/car-selector"

export default function Dashboard() {
  const [retryCount, setRetryCount] = useState(0)
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)

  // Fetch user's cars
  const { data: cars = [] } = useQuery({
    queryKey: ["cars"],
    queryFn: api.getCars,
  })

  const {
    data: receipts = [],
    isLoading,
    error,
    refetch,
    isError,
  } = useQuery({
    queryKey: ["fuel-receipts", retryCount, selectedCarId],
    queryFn: () => api.getFuelReceipts(selectedCarId ?? undefined),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Health check query
  const { data: healthStatus, isError: healthError } = useQuery({
    queryKey: ["health-check"],
    queryFn: api.healthCheck,
    refetchInterval: 30000, // Check every 30 seconds
    retry: false,
  })

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    refetch()
  }

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Loading your fuel expenses...</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wifi className="h-4 w-4" />
              Connecting to backend...
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (isError) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Unable to load your data</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-destructive">
              <WifiOff className="h-4 w-4" />
              Backend disconnected
            </div>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="mt-2">
              Unable to connect to the backend server. Please check if your FastAPI server is running on{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-sm">
                {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
              </code>
              <br />
              <br />
              Error: {error?.message || "Unknown error occurred"}
            </AlertDescription>
            <div className="mt-4">
              <Button onClick={handleRetry} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Connection
              </Button>
            </div>
          </Alert>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              {selectedCarId
                ? `Fuel expenses for ${cars.find((c) => c.id === selectedCarId)?.name}`
                : "Overview of your fuel expenses across all vehicles"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <CarSelector selectedCarId={selectedCarId} onCarChange={setSelectedCarId} showAllOption={true} />
            {healthError ? (
              <>
                <WifiOff className="h-4 w-4 text-destructive" />
                Backend issues
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                Connected
              </>
            )}
          </div>
        </div>

        <CarSpecificStats receipts={receipts} cars={cars} selectedCarId={selectedCarId} />
        <CarSpecificChart receipts={receipts} cars={cars} selectedCarId={selectedCarId} />
      </div>
    </AuthenticatedLayout>
  )
}
