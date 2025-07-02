"use client"

import { useQuery } from "@tanstack/react-query"
import { Wifi, WifiOff, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

export function ConnectionStatus() {
  const {
    data: healthStatus,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["health-check"],
    queryFn: api.healthCheck,
    refetchInterval: 30000, // Check every 30 seconds
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking connection...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <WifiOff className="h-4 w-4" />
        Backend disconnected
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Wifi className="h-4 w-4 text-green-600" />
      Connected
    </div>
  )
}
