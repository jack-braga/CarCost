"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { CarSettings } from "@/components/settings/car-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { PreferencesSettings } from "@/components/settings/preferences-settings"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { User, Settings, Car, Shield } from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const { user } = useAuth()

  // Fetch user's cars
  const { data: cars = [], isLoading: carsLoading } = useQuery({
    queryKey: ["cars"],
    queryFn: api.getCars,
  })

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="cars" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Cars
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSettings user={user} />
          </TabsContent>

          <TabsContent value="cars">
            <CarSettings cars={cars} isLoading={carsLoading} />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesSettings user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  )
}
