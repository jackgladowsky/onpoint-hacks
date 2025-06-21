"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Brain, Shield, Download, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { FileUpload } from "@/components/file-upload"

export default function LandingPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
  }

  const startAnalysis = () => {
    if (uploadedFile) {
      // Here you would typically navigate to analysis page or start the process
      console.log("Starting analysis for:", uploadedFile.name)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-emerald-600" />
              <span className="text-2xl font-bold text-slate-900">SecureAudit AI</span>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Free Analysis
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="mb-6">
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">AI-Powered Security Analysis</Badge>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Smart Contract
            <span className="text-emerald-600"> Security Audit</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Upload your smart contract and get an instant AI-powered security analysis. Our tool combines static code
            analysis with advanced LLM insights to identify vulnerabilities and provide actionable recommendations.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-slate-500 mb-12">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>5-10 minutes</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>No registration required</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <Download className="h-4 w-4" />
              <span>PDF report included</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600">
              Simple, fast, and comprehensive smart contract analysis in three steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative border-2 hover:border-emerald-200 transition-colors">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <CardTitle className="text-xl">Upload Contract</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Upload your Solidity smart contract file (.sol). We support contracts up to 10MB in size.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="relative border-2 hover:border-emerald-200 transition-colors">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <CardTitle className="text-xl">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Our system runs static code analysis and feeds your contract to advanced AI models for comprehensive
                  security review.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="relative border-2 hover:border-emerald-200 transition-colors">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <CardTitle className="text-xl">Get Report</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Receive a detailed security report with vulnerability findings, risk assessments, and recommendations.
                  Download as PDF.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-emerald-50 to-slate-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Start Your Security Audit</h2>
            <p className="text-lg text-slate-600">Upload your smart contract file to begin the analysis</p>
          </div>

          <Card className="border-2 border-dashed border-emerald-200 bg-white/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <FileUpload onFileUpload={handleFileUpload} />
            </CardContent>
          </Card>

          {/* Start Analysis Button */}
          {uploadedFile && (
            <div className="mt-8 text-center">
              <Button 
                onClick={startAnalysis} 
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg font-semibold"
              >
                Start Analysis
              </Button>
            </div>
          )}

          {/* Important Notice */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-900 mb-1">Important Notice</h3>
                <p className="text-sm text-amber-800">
                  This is a one-time analysis tool. Your report will be available immediately after processing.
                  <strong className="font-medium"> Make sure to download the PDF report</strong> as it will not be
                  stored or accessible later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What You Get</h2>
            <p className="text-lg text-slate-600">Comprehensive analysis powered by cutting-edge technology</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors">
              <Shield className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Vulnerability Detection</h3>
              <p className="text-slate-600 text-sm">
                Identify common security vulnerabilities like reentrancy, overflow, and access control issues.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors">
              <Brain className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">AI-Powered Insights</h3>
              <p className="text-slate-600 text-sm">
                Advanced language models analyze your code for complex patterns and potential issues.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors">
              <FileText className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Detailed Reports</h3>
              <p className="text-slate-600 text-sm">
                Get comprehensive reports with risk levels, explanations, and remediation suggestions.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors">
              <Download className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">PDF Export</h3>
              <p className="text-slate-600 text-sm">
                Download professional PDF reports perfect for documentation and compliance.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors">
              <Clock className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Fast Analysis</h3>
              <p className="text-slate-600 text-sm">
                Get results in minutes, not hours. Perfect for rapid development cycles.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors">
              <CheckCircle className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">No Registration</h3>
              <p className="text-slate-600 text-sm">
                Start analyzing immediately without creating accounts or providing personal information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-6 w-6 text-emerald-400" />
            <span className="text-xl font-bold">SecureAudit AI</span>
          </div>
          <p className="text-slate-400 mb-4">AI-powered smart contract security analysis tool</p>
          <p className="text-sm text-slate-500">
            © 2024 SecureAudit AI. Built for the security of decentralized applications.
          </p>
        </div>
      </footer>
    </div>
  )
}
