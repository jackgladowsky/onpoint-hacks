"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X } from "lucide-react"

interface FileUploadProps {
  onFileUpload: (file: File) => void
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        if (file.name.endsWith(".sol") || file.type === "text/plain") {
          setUploadedFile(file)
          onFileUpload(file)
        } else {
          alert("Please upload a Solidity (.sol) file")
        }
      }
    },
    [onFileUpload],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0]
        if (file.name.endsWith(".sol") || file.type === "text/plain") {
          setUploadedFile(file)
          onFileUpload(file)
        } else {
          alert("Please upload a Solidity (.sol) file")
        }
      }
    },
    [onFileUpload],
  )

  const removeFile = () => {
    setUploadedFile(null)
  }

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-emerald-300"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".sol,.txt"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <Upload className="h-8 w-8 text-emerald-600" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Smart Contract</h3>
            <p className="text-slate-600 mb-4">Drag and drop your .sol file here, or click to browse</p>

            <Button variant="outline" className="bg-white text-emerald-600 border-emerald-600 hover:bg-emerald-50">
              Choose File
            </Button>
          </div>

          <div className="text-xs text-slate-500">Supported formats: .sol • Max size: 10MB</div>
        </div>
      </div>

      {uploadedFile && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-slate-600" />
              <div>
                <p className="font-medium text-slate-900">{uploadedFile.name}</p>
                <p className="text-sm text-slate-600">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={removeFile} className="text-slate-500 hover:text-slate-700">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
