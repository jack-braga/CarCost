"use client"
import { useQuery } from "@tanstack/react-query"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Car, Plus } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface CarSelectorProps {
  selectedCarId: string | null
  onCarChange: (carId: string | null) => void
  showAllOption?: boolean
  className?: string
}

export function CarSelector({ selectedCarId, onCarChange, showAllOption = false, className }: CarSelectorProps) {
  const { data: cars = [], isLoading } = useQuery({
    queryKey: ["cars"],
    queryFn: api.getCars,
  })

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (cars.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="outline" className="text-muted-foreground">
          <Car className="mr-1 h-3 w-3" />
          No cars
        </Badge>
        <Button asChild variant="outline" size="sm">
          <Link href="/settings?tab=cars">
            <Plus className="mr-1 h-3 w-3" />
            Add Car
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Car className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedCarId || "all"} onValueChange={(value) => onCarChange(value === "all" ? null : value)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select vehicle" />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">
              <span className="font-medium">All Cars</span>
            </SelectItem>
          )}
          {cars.map((car) => (
            <SelectItem key={car.id} value={car.id}>
              <div className="flex items-center gap-2">
                <span>{car.name}</span>
                {car.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
