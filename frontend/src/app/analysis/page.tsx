'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileCode, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react'
import { api, MultipleAnalysisResult, APIError } from '@/services/api'


export default function AnalysisPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [analysisResult, setAnalysisResult] = useState<MultipleAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hasStarted = useRef(false)
  const router = useRouter()

  useEffect(() => {
    const performAnalysis = async () => {
      // Prevent double execution in React StrictMode
      if (hasStarted.current) {
        console.log('🚫 Analysis already started, skipping...')
        return
      }
      hasStarted.current = true
      
      console.log('🔍 Starting analysis process...')
      
      try {
        // Get files from sessionStorage
        const fileDataString = sessionStorage.getItem('analysisFiles')
        if (!fileDataString) {
          console.error('❌ No files found in sessionStorage')
          setError('No files found for analysis. Please go back and upload files.')
          setIsLoading(false)
          return
        }

        console.log('📁 Files found in sessionStorage, parsing...')
        
        // Parse and reconstruct File objects from stored data
        let fileData
        try {
          fileData = JSON.parse(fileDataString)
          console.log(`✅ Parsed ${fileData.length} files from sessionStorage`)
        } catch (parseError) {
          console.error('❌ Failed to parse file data from sessionStorage:', parseError)
          setError('Invalid file data found. Please go back and upload files again.')
          setIsLoading(false)
          return
        }

        console.log('🔄 Reconstructing File objects...')
        const files = fileData.map((data: any, index: number) => {
          try {
            console.log(`🔧 Processing file ${index + 1}: ${data.name}`)
            
            if (!data.content || typeof data.content !== 'string') {
              throw new Error(`File ${data.name} has invalid content`)
            }

            // Check if content is a data URL
            if (!data.content.startsWith('data:')) {
              throw new Error(`File ${data.name} content is not a valid data URL`)
            }

            // Split data URL and get base64 part
            const contentParts = data.content.split(',')
            if (contentParts.length !== 2) {
              throw new Error(`File ${data.name} has malformed data URL`)
            }

            // Convert base64 back to File
            const base64Data = contentParts[1]
            console.log(`📊 Base64 data length for ${data.name}: ${base64Data.length}`)
            
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            
            const reconstructedFile = new File([byteArray], data.name, {
              type: data.type || 'text/plain',
              lastModified: data.lastModified || Date.now()
            })
            
            console.log(`✅ File ${data.name} reconstructed successfully (${reconstructedFile.size} bytes)`)
            return reconstructedFile
          } catch (fileError) {
            console.error(`❌ Failed to reconstruct file ${data.name}:`, fileError)
            const errorMessage = fileError instanceof Error ? fileError.message : String(fileError)
            throw new Error(`Failed to process file ${data.name}: ${errorMessage}`)
          }
        })

        console.log(`✅ All ${files.length} files reconstructed successfully`)

        console.log('🚀 Starting API analysis...')
        // Perform analysis - both single and multiple files use the same endpoint now
        const result = await api.analyzeMultipleFiles(files)
        console.log('✅ API analysis completed successfully')

        setAnalysisResult(result)
        setIsLoading(false)
        
        // Clear sessionStorage after successful analysis
        sessionStorage.removeItem('analysisFiles')
        console.log('🧹 Cleared files from sessionStorage after successful analysis')
        
      } catch (err) {
        console.error('💥 Analysis error:', err)
        
        // More specific error handling
        if (err instanceof APIError) {
          console.error(`❌ API Error (${err.status}):`, err.message)
          setError(`Analysis failed: ${err.message}`)
        } else if (err instanceof Error) {
          console.error('❌ Application Error:', err.message)
          setError(`Error: ${err.message}`)
        } else {
          console.error('❌ Unknown error:', err)
          setError('An unexpected error occurred. Please try again.')
        }
        setIsLoading(false)
      }
    }

    performAnalysis()
  }, [])

  const handleBackToHome = () => {
    router.push('/')
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'LOW': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'MEDIUM': 
      case 'MEDIUM-HIGH': return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'HIGH': 
      case 'ERROR': return <XCircle className="h-5 w-5 text-red-600" />
      default: return null
    }
  }

  const downloadReport = () => {
    if (!analysisResult) return
    
    const reportContent = `Security Analysis Report
========================

${analysisResult.summary}

Detailed Findings:
${analysisResult.all_vulnerabilities.map(v => 
  `\n[${v.severity}] ${v.title}\nFile: ${v.file_name || 'N/A'}\n${v.description}\nFix: ${v.fix_suggestion}\n`
).join('\n')}`
    
    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-report-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-black to-emerald-950">
      <div className="container mx-auto px-4 py-8">
        <Button
          onClick={handleBackToHome}
          variant="ghost"
          className="mb-8 text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-emerald-600/30 animate-pulse" />
              <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mt-8 mb-2">Analyzing Your Smart Contracts</h2>
            <p className="text-white/70">This may take a few moments...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Analysis Failed</h2>
            <p className="text-white/70 mb-8">{error}</p>
            <Button onClick={handleBackToHome} className="bg-emerald-600 hover:bg-emerald-700">
              Try Again
            </Button>
          </div>
        ) : analysisResult ? (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-bold text-white">Analysis Results</h1>
              <Button
                onClick={downloadReport}
                variant="outline"
                className="text-white border-white/20 hover:bg-white/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>

            {/* Project Summary Card */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Project Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-white/60 text-sm mb-1">Files Analyzed</p>
                    <p className="text-3xl font-bold text-white">{analysisResult.project_metrics.total_files}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-white/60 text-sm mb-1">Avg. Security Score</p>
                    <p className="text-3xl font-bold text-emerald-400">{analysisResult.project_metrics.average_security_score}/100</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-white/60 text-sm mb-1">Overall Risk</p>
                    <p className="text-2xl font-bold text-white">{analysisResult.project_metrics.overall_project_risk}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-white/60 text-sm mb-1">Total Issues</p>
                    <p className="text-3xl font-bold text-white">{analysisResult.project_metrics.total_vulnerabilities}</p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2">Risk Breakdown</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-red-400 text-sm">High</p>
                      <p className="text-2xl font-bold text-red-400">{analysisResult.project_metrics.aggregate_risk_breakdown.high}</p>
                    </div>
                    <div>
                      <p className="text-yellow-400 text-sm">Medium</p>
                      <p className="text-2xl font-bold text-yellow-400">{analysisResult.project_metrics.aggregate_risk_breakdown.medium}</p>
                    </div>
                    <div>
                      <p className="text-blue-400 text-sm">Low</p>
                      <p className="text-2xl font-bold text-blue-400">{analysisResult.project_metrics.aggregate_risk_breakdown.low}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Individual File Results */}
            <h2 className="text-2xl font-bold text-white mb-4">Individual File Analysis</h2>
            <div className="grid gap-6">
              {analysisResult.individual_results.map((result, idx) => (
                <Card key={idx} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FileCode className="h-6 w-6 text-emerald-400" />
                        <h2 className="text-xl font-semibold text-white">{result.file_name}</h2>
                      </div>
                      {getStatusIcon(result.overall_risk)}
                    </div>

                    {result.error ? (
                      <div className="bg-red-500/10 rounded-lg p-4">
                        <p className="text-red-400">Analysis failed: {result.error}</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-4 gap-4 mb-6 text-center">
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/60 text-sm">Security Score</p>
                            <p className="text-2xl font-bold text-emerald-400">{result.security_score}/100</p>
                          </div>
                          <div className="bg-red-500/10 rounded-lg p-3">
                            <p className="text-red-400 text-sm">High</p>
                            <p className="text-2xl font-bold text-red-400">{result.risk_breakdown.high}</p>
                          </div>
                          <div className="bg-yellow-500/10 rounded-lg p-3">
                            <p className="text-yellow-400 text-sm">Medium</p>
                            <p className="text-2xl font-bold text-yellow-400">{result.risk_breakdown.medium}</p>
                          </div>
                          <div className="bg-blue-500/10 rounded-lg p-3">
                            <p className="text-blue-400 text-sm">Low</p>
                            <p className="text-2xl font-bold text-blue-400">{result.risk_breakdown.low}</p>
                          </div>
                        </div>

                        {result.vulnerabilities.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-white font-medium mb-2">Vulnerabilities Found:</h3>
                            {result.vulnerabilities.map((vuln, index) => (
                              <div key={index} className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                                    {vuln.severity.toUpperCase()}
                                  </span>
                                  <h4 className="text-white font-medium">{vuln.title}</h4>
                                </div>
                                <p className="text-white/80 mb-2">{vuln.description}</p>
                                {vuln.fix_suggestion && (
                                  <div className="mt-2 p-2 bg-emerald-500/10 rounded">
                                    <p className="text-emerald-400 text-sm font-medium">Fix Suggestion:</p>
                                    <p className="text-white/70 text-sm">{vuln.fix_suggestion}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <Button 
                onClick={handleBackToHome}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Analyze More Contracts
              </Button>
              <Button
                onClick={downloadReport}
                size="lg"
                variant="outline"
                className="text-white border-white/20 hover:bg-white/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}