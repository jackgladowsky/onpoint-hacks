'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CodeSnippet } from '@/components/code-snippet'
import { 
  ArrowLeft, 
  FileCode, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download, 
  Shield, 
  Brain, 
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Bug,
  FileText
} from 'lucide-react'
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

        console.log('🚀 Starting comprehensive analysis...')
        // Perform analysis using the updated /analyze endpoint
        const result = await api.analyzeMultipleFiles(files)
        console.log('✅ Analysis completed successfully')

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
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'LOW': return <TrendingDown className="h-5 w-5 text-green-600" />
      case 'MEDIUM': return <Minus className="h-5 w-5 text-yellow-600" />
      case 'MEDIUM-HIGH': return <TrendingUp className="h-5 w-5 text-orange-600" />
      case 'HIGH': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'ERROR': return <XCircle className="h-5 w-5 text-red-600" />
      default: return <AlertCircle className="h-5 w-5 text-slate-600" />
    }
  }

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const downloadReport = () => {
    if (!analysisResult) return
    
    const reportContent = `Security Analysis Report
Generated on: ${new Date().toLocaleString()}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-emerald-600" />
              <span className="text-2xl font-bold text-slate-900">SecureAudit AI</span>
            </div>
            <div className="flex items-center space-x-4">
              {analysisResult && (
                <Button
                  onClick={downloadReport}
                  variant="outline"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              )}
              <Button
                onClick={handleBackToHome}
                variant="ghost"
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative mb-8">
              <div className="h-20 w-20 rounded-full border-4 border-emerald-100 animate-pulse" />
              <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Analyzing Your Smart Contracts</h2>
              <p className="text-lg text-slate-600 mb-4">Running comprehensive security analysis...</p>
              <div className="flex items-center justify-center space-x-6 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>AI Analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bug className="h-4 w-4" />
                  <span>Static Analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>2-5 minutes</span>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Analysis Failed</h2>
              <p className="text-slate-600 mb-8">{error}</p>
              <Button onClick={handleBackToHome} className="bg-emerald-600 hover:bg-emerald-700">
                Try Again
              </Button>
            </div>
          </div>
        ) : analysisResult ? (
          <div className="space-y-8">
            {/* Results Header */}
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Analysis Complete</h1>
              <p className="text-lg text-slate-600">
                Your smart contracts have been analyzed using AI and static analysis tools
              </p>
            </div>

            {/* Project Overview */}
            <Card className="border-2 border-emerald-200 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900 flex items-center">
                  <Shield className="h-6 w-6 text-emerald-600 mr-2" />
                  Project Overview
                </CardTitle>
                <CardDescription>
                  Summary of your smart contract security analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {analysisResult.project_metrics.total_files}
                    </div>
                    <div className="text-sm text-slate-600">Files Analyzed</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-1 ${getSecurityScoreColor(analysisResult.project_metrics.average_security_score)}`}>
                      {analysisResult.project_metrics.average_security_score}/100
                    </div>
                    <div className="text-sm text-slate-600">Security Score</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      {getRiskIcon(analysisResult.project_metrics.overall_project_risk)}
                      <span className="text-2xl font-bold text-slate-900 ml-2">
                        {analysisResult.project_metrics.overall_project_risk}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">Risk Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {analysisResult.project_metrics.total_vulnerabilities}
                    </div>
                    <div className="text-sm text-slate-600">Issues Found</div>
                  </div>
                </div>

                {/* Risk Breakdown */}
                <div className="bg-slate-50 rounded-lg p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Risk Distribution</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {analysisResult.project_metrics.aggregate_risk_breakdown.high}
                      </div>
                      <Badge className="bg-red-100 text-red-800 border-red-200">High Risk</Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 mb-1">
                        {analysisResult.project_metrics.aggregate_risk_breakdown.medium}
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Risk</Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {analysisResult.project_metrics.aggregate_risk_breakdown.low}
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">Low Risk</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual File Results */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Individual File Analysis</h2>
              <div className="grid gap-6">
                {analysisResult.individual_results.map((result, idx) => (
                  <Card key={idx} className="border border-slate-200 hover:border-emerald-200 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileCode className="h-6 w-6 text-emerald-600" />
                          <div>
                            <CardTitle className="text-xl text-slate-900">{result.file_name}</CardTitle>
                            <CardDescription>
                              {result.error ? 'Analysis failed' : `${result.vulnerability_count} issues found`}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getRiskIcon(result.overall_risk)}
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            {result.overall_risk}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {result.error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="text-red-800 font-medium">Analysis Error</span>
                          </div>
                          <p className="text-red-700 mt-2">{result.error}</p>
                        </div>
                      ) : (
                        <>
                          {/* File Metrics */}
                          <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-slate-50 rounded-lg p-3 text-center">
                              <div className={`text-2xl font-bold mb-1 ${getSecurityScoreColor(result.security_score)}`}>
                                {result.security_score}
                              </div>
                              <div className="text-sm text-slate-600">Security Score</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-red-600 mb-1">
                                {result.risk_breakdown.high}
                              </div>
                              <div className="text-sm text-slate-600">High</div>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-yellow-600 mb-1">
                                {result.risk_breakdown.medium}
                              </div>
                              <div className="text-sm text-slate-600">Medium</div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-blue-600 mb-1">
                                {result.risk_breakdown.low}
                              </div>
                              <div className="text-sm text-slate-600">Low</div>
                            </div>
                          </div>

                          {/* Vulnerabilities */}
                          {result.vulnerabilities.length > 0 ? (
                            <div className="space-y-6">
                              <h4 className="font-semibold text-slate-900">Vulnerabilities Found</h4>
                              {result.vulnerabilities.map((vuln, index) => (
                                <div key={index} className="space-y-4">
                                  <div className="border border-slate-200 rounded-lg p-4 bg-white">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center space-x-2">
                                        <Badge className={getSeverityColor(vuln.severity)}>
                                          {vuln.severity.toUpperCase()}
                                        </Badge>
                                        <h5 className="font-medium text-slate-900">{vuln.title}</h5>
                                      </div>
                                    </div>
                                    <p className="text-slate-700 mb-3">{vuln.description}</p>
                                    {vuln.fix_suggestion && (
                                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                                          <span className="text-emerald-800 font-medium text-sm">Recommended Fix</span>
                                        </div>
                                        <p className="text-emerald-700 text-sm">{vuln.fix_suggestion}</p>
                                      </div>
                                    )}
                                  </div>
                                  {/* Code Fix Section */}
                                  {vuln.code_fix && (
                                    <CodeSnippet codeFix={vuln.code_fix} className="ml-4" />
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                              <p className="text-slate-600">No vulnerabilities detected in this file</p>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 pt-8">
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
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Full Report
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}