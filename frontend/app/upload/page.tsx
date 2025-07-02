"use client"

import type React from "react"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Camera, Loader2, CheckCircle } from "lucide-react"
import { api } from "@/lib/api"
import type { OCRResult } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { ReceiptForm } from "@/components/receipt-form"
import { ConnectionStatus } from "@/components/connection-status"
import { AuthenticatedLayout } from "@/components/authenticated-layout"

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: api.uploadReceipt,
    onSuccess: (data) => {
      if (data.success && data.ocrResult) {
        setOcrResult(data.ocrResult)
        setShowForm(true)
        toast({
          title: "Receipt processed successfully",
          description: `OCR completed with ${Math.round((data.ocrResult.confidence || 0) * 100)}% confidence`,
        })
      } else {
        toast({
          title: "Processing completed",
          description: data.error || "OCR processing completed but no data was extracted",
          variant: "destructive",
        })
      }
    },
    onError: (error: Error) => {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to process receipt. Please check your connection and try again.",
        variant: "destructive",
      })
    },
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
      setOcrResult(null)
      setShowForm(false)

      // Create image preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile)
    }
  }

  const handleFormSuccess = () => {
    setSelectedFile(null)
    setOcrResult(null)
    setShowForm(false)
    setImagePreview(null)
    queryClient.invalidateQueries({ queryKey: ["fuel-receipts"] })
    toast({
      title: "Receipt saved",
      description: "Your fuel receipt has been saved successfully.",
    })
  }

  const resetForm = () => {
    setShowForm(false)
    setOcrResult(null)
    setSelectedFile(null)
    setImagePreview(null)
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Upload Receipt</h1>
            <p className="text-muted-foreground">Upload a photo of your fuel receipt for automatic data extraction</p>
          </div>
          <ConnectionStatus />
        </div>

        {!showForm ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Upload Receipt Photo
                </CardTitle>
                <CardDescription>
                  Take a clear photo of your fuel receipt for best OCR results. Supported formats: JPG, PNG (max 10MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="receipt">Receipt Image</Label>
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    capture="environment"
                    disabled={uploadMutation.isPending}
                  />
                </div>

                {selectedFile && (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>

                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Receipt preview"
                          className="max-w-full h-48 object-contain border rounded-lg"
                        />
                      </div>
                    )}

                    <Button onClick={handleUpload} disabled={uploadMutation.isPending} className="w-full">
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Receipt...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Process Receipt
                        </>
                      )}
                    </Button>

                    {uploadMutation.isPending && (
                      <Alert>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription>
                          Processing your receipt with OCR. This may take a few seconds...
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manual Entry</CardTitle>
                <CardDescription>Prefer to enter receipt details manually?</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => setShowForm(true)}
                  disabled={uploadMutation.isPending}
                >
                  Enter Manually
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {ocrResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  OCR processing completed with {Math.round((ocrResult.confidence || 0) * 100)}% confidence.
                  {ocrResult.processingTime && ` Processing time: ${ocrResult.processingTime}ms`}
                </AlertDescription>
              </Alert>
            )}

            <ReceiptForm
              initialData={ocrResult}
              onSuccess={handleFormSuccess}
              onCancel={resetForm}
              imagePreview={imagePreview}
            />
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
