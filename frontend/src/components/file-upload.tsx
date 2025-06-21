"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X } from "lucide-react"

interface FileUploadProps {
  onFileUpload: (files: File[]) => void
  onFileRemove: (file: File) => void
  uploadedFiles: File[]
  multiple?: boolean
  maxFiles?: number
  maxTotalSize?: number
}

export function FileUpload({ onFileUpload, onFileRemove, uploadedFiles, multiple = false, maxFiles = 10, maxTotalSize = 10 * 1024 * 1024 }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)

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
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter(file => file.name.endsWith(".sol") || file.type === "text/plain")
        if (files.length === 0) {
          alert("Please upload Solidity (.sol) files")
          return
        }
        onFileUpload(files)
      }
    },
    [onFileUpload],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files).filter(file => file.name.endsWith(".sol") || file.type === "text/plain")
        if (files.length === 0) {
          alert("Please upload Solidity (.sol) files")
          return
        }
        onFileUpload(files)
      }
    },
    [onFileUpload],
  )

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
          multiple={multiple}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <Upload className="h-8 w-8 text-emerald-600" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload Smart Contract(s)</h3>
            <p className="text-slate-600 mb-4">Drag and drop your .sol files here, or click to browse</p>
            <Button variant="outline" className="bg-white text-emerald-600 border-emerald-600 hover:bg-emerald-50">
              Choose File(s)
            </Button>
          </div>

          <div className="text-xs text-slate-500">Supported formats: .sol • Max files: {maxFiles} • Max total size: {(maxTotalSize/1024/1024).toFixed(2)}MB</div>
        </div>
      </div>
      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <ul className="divide-y divide-slate-200">
            {uploadedFiles.map((file) => (
              <li key={file.name + file.size} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <span className="text-slate-800 text-sm">{file.name} <span className="text-slate-400">({(file.size/1024).toFixed(1)} KB)</span></span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onFileRemove(file)} className="text-slate-500 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

