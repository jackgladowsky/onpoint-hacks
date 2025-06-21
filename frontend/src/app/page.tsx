"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Brain, Shield, Download, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { FileUpload } from "@/components/file-upload"

export default function LandingPage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const router = useRouter()
  const MAX_FILES = 10
  const MAX_TOTAL_SIZE = 10 * 1024 * 1024 // 10MB

  const getTotalSize = (files: File[]) => files.reduce((acc, file) => acc + file.size, 0)

  const handleFileUpload = (files: File[]) => {
    let newFiles = [...uploadedFiles]
    for (const file of files) {
      if (newFiles.length >= MAX_FILES) break
      // Prevent duplicates by name and size
      if (!newFiles.some(f => f.name === file.name && f.size === file.size)) {
        newFiles.push(file)
      }
    }
    // Enforce total size limit
    while (getTotalSize(newFiles) > MAX_TOTAL_SIZE && newFiles.length > 0) {
      newFiles.pop()
    }
    setUploadedFiles(newFiles)
  }

  const handleFileRemove = (fileToRemove: File) => {
    setUploadedFiles(files => files.filter(f => !(f.name === fileToRemove.name && f.size === fileToRemove.size)))
  }

  const startAnalysis = async () => {
    if (uploadedFiles.length > 0) {
      try {
        console.log('🚀 Starting analysis with', uploadedFiles.length, 'files');
        console.log('📁 Files to process:', uploadedFiles.map(f => ({ name: f.name, size: f.size })));
        
        // Convert files to base64 and store in sessionStorage
        console.log('🔄 Converting files to base64...');
        const fileData = await Promise.all(
          uploadedFiles.map(async (file, index) => {
            console.log(`📄 Processing file ${index + 1}/${uploadedFiles.length}: ${file.name}`);
            
            const content = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => {
                const result = reader.result as string;
                console.log(`✅ File ${file.name} converted to base64 (${result.length} chars)`);
                resolve(result);
              }
              reader.onerror = () => {
                console.error(`❌ Failed to read file ${file.name}:`, reader.error);
                reject(reader.error);
              }
              reader.readAsDataURL(file)
            });
            
            return {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              content: content
            };
          })
        )
        
        console.log('✅ All files converted successfully');
        console.log('💾 Storing files in sessionStorage...');
        
        const jsonData = JSON.stringify(fileData);
        console.log(`📊 SessionStorage data size: ${jsonData.length} characters`);
        
        sessionStorage.setItem('analysisFiles', jsonData);
        
        // Verify the data was stored
        const storedData = sessionStorage.getItem('analysisFiles');
        if (storedData) {
          console.log('✅ Files successfully stored in sessionStorage');
          console.log('🔍 Stored data preview:', storedData.substring(0, 200) + '...');
        } else {
          console.error('❌ Failed to store files in sessionStorage');
          alert('Failed to store files. Please try again.');
          return;
        }
        
        console.log('🧭 Navigating to analysis page...');
        router.push('/analysis');
        
      } catch (error) {
        console.error('💥 Error in startAnalysis:', error);
        alert('Failed to process files. Please try again.');
      }
    } else {
      console.warn('⚠️ No files to analyze');
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
              <span className="text-2xl font-bold text-slate-900">SolidAudit AI</span>
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
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">AI-Powered Solidity Audits</Badge>
          </div>
          <h1 className="text-5xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Smart Contract Vulnerability
            <span className="text-emerald-600"> Analysis</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Upload your Solidity smart contracts and get an instant AI-powered security audit. Our tool combines
            comprehensive Static Code Analysis (SCA) with advanced Large Language Model (LLM) insights to identify
            vulnerabilities and provide actionable recommendations.
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
                  Upload your Solidity smart contract files (.sol). Our tool supports multiple files and contracts up to
                  10MB in total size.
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
                  Our system performs deep Static Code Analysis (SCA) and leverages advanced Large Language Models
                  (LLMs) for a comprehensive security review of your code.
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
              <FileUpload 
                onFileUpload={handleFileUpload} 
                onFileRemove={handleFileRemove} 
                multiple={true}
                maxFiles={MAX_FILES}
                maxTotalSize={MAX_TOTAL_SIZE}
                uploadedFiles={uploadedFiles}
              />
            </CardContent>
          </Card>

          {/* Start Analysis Button */}
          {uploadedFiles.length > 0 && (
            <div className="mt-8 text-center space-y-4">
              <Button 
                onClick={startAnalysis} 
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg font-semibold"
              >
                Start Analysis
              </Button>
              
              {/* Debug Button - Remove in production */}
              <div className="text-center">
                <Button 
                  onClick={() => {
                    console.log('🧪 Testing sessionStorage...');
                    try {
                      sessionStorage.setItem('test', 'hello');
                      const testValue = sessionStorage.getItem('test');
                      console.log('✅ SessionStorage test successful:', testValue);
                      sessionStorage.removeItem('test');
                      
                      // Check current files in sessionStorage
                      const existingFiles = sessionStorage.getItem('analysisFiles');
                      console.log('📋 Current analysisFiles in sessionStorage:', existingFiles ? 'Found' : 'Not found');
                      if (existingFiles) {
                        console.log('📄 Existing files preview:', existingFiles.substring(0, 200));
                      }
                    } catch (error) {
                      console.error('❌ SessionStorage test failed:', error);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  Test SessionStorage
                </Button>
              </div>
            </div>
          )}

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 flex flex-col items-center">
              <div className="w-full max-w-lg">
                <ul className="divide-y divide-slate-200">
                  {uploadedFiles.map((file) => (
                    <li key={file.name + file.size} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        <span className="text-slate-800 text-sm">{file.name} <span className="text-slate-400">({(file.size/1024).toFixed(1)} KB)</span></span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleFileRemove(file)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-slate-500 mt-2 text-right">
                  {uploadedFiles.length}/{MAX_FILES} files, {(getTotalSize(uploadedFiles)/1024/1024).toFixed(2)} MB / 10.00 MB
                </div>
              </div>
            </div>
          )}

          {/* Important Notice */}
          {/* <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
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
          </div> */}
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
              <h3 className="font-semibold text-slate-900 mb-2">SCA Vulnerability Detection</h3>
              <p className="text-slate-600 text-sm">
                Our static analysis engine identifies a wide range of common Solidity vulnerabilities, including
                reentrancy, integer overflows, and access control issues.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors">
              <Brain className="h-8 w-8 text-emerald-600 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">Advanced LLM Audit</h3>
              <p className="text-slate-600 text-sm">
                Our fine-tuned LLMs analyze your code for complex logic flaws and subtle vulnerabilities that
                traditional static analysis might miss.
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
            <span className="text-xl font-bold">SolidAudit AI</span>
          </div>
          <p className="text-slate-400 mb-4">AI-powered security analysis for Solidity smart contracts.</p>
          <p className="text-sm text-slate-500">
            © 2025 SolidAudit AI. Built for the security of decentralized applications.
          </p>
        </div>
      </footer>
    </div>
  )
}
