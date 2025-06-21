'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileCode, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface AnalysisResult {
  id: string
  fileName: string
  status: 'success' | 'warning' | 'error'
  issues: {
    severity: 'high' | 'medium' | 'low'
    message: string
    line?: number
  }[]
  summary: {
    totalIssues: number
    highSeverity: number
    mediumSeverity: number
    lowSeverity: number
  }
}

export default function AnalysisPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const simulateAnalysis = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Mock analysis results
        const mockResults: AnalysisResult[] = [
          {
            id: '1',
            fileName: 'Token.sol',
            status: 'warning',
            issues: [
              { severity: 'high', message: 'Reentrancy vulnerability detected in transfer function', line: 45 },
              { severity: 'medium', message: 'Missing zero address validation', line: 23 },
              { severity: 'low', message: 'Function visibility can be restricted', line: 67 }
            ],
            summary: {
              totalIssues: 3,
              highSeverity: 1,
              mediumSeverity: 1,
              lowSeverity: 1
            }
          },
          {
            id: '2',
            fileName: 'Staking.sol',
            status: 'success',
            issues: [
              { severity: 'low', message: 'Consider using latest Solidity version', line: 1 }
            ],
            summary: {
              totalIssues: 1,
              highSeverity: 0,
              mediumSeverity: 0,
              lowSeverity: 1
            }
          }
        ]

        setAnalysisResults(mockResults)
        setIsLoading(false)
      } catch (err) {
        setError('Failed to complete analysis. Please try again.')
        setIsLoading(false)
      }
    }

    simulateAnalysis()
  }, [])

  const handleBackToHome = () => {
    router.push('/')
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />
      default: return null
    }
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
        ) : (
          <div>
            <h1 className="text-4xl font-bold text-white mb-8">Analysis Results</h1>
            
            <div className="grid gap-6">
              {analysisResults.map((result) => (
                <Card key={result.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FileCode className="h-6 w-6 text-emerald-400" />
                        <h2 className="text-xl font-semibold text-white">{result.fileName}</h2>
                      </div>
                      {getStatusIcon(result.status)}
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-6 text-center">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/60 text-sm">Total Issues</p>
                        <p className="text-2xl font-bold text-white">{result.summary.totalIssues}</p>
                      </div>
                      <div className="bg-red-500/10 rounded-lg p-3">
                        <p className="text-red-400 text-sm">High</p>
                        <p className="text-2xl font-bold text-red-400">{result.summary.highSeverity}</p>
                      </div>
                      <div className="bg-yellow-500/10 rounded-lg p-3">
                        <p className="text-yellow-400 text-sm">Medium</p>
                        <p className="text-2xl font-bold text-yellow-400">{result.summary.mediumSeverity}</p>
                      </div>
                      <div className="bg-blue-500/10 rounded-lg p-3">
                        <p className="text-blue-400 text-sm">Low</p>
                        <p className="text-2xl font-bold text-blue-400">{result.summary.lowSeverity}</p>
                      </div>
                    </div>

                    {result.issues.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-white font-medium mb-2">Issues Found:</h3>
                        {result.issues.map((issue, index) => (
                          <div key={index} className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                {issue.severity.toUpperCase()}
                              </span>
                              {issue.line && (
                                <span className="text-white/60 text-sm">Line {issue.line}</span>
                              )}
                            </div>
                            <p className="text-white/80">{issue.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Button 
                onClick={handleBackToHome}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Analyze More Contracts
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}