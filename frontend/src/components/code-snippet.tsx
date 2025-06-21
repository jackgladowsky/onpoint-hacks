'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Code, Shield } from 'lucide-react'
import { CodeFix } from '@/services/api'

interface CodeSnippetProps {
  codeFix: CodeFix
  className?: string
}

export function CodeSnippet({ codeFix, className = '' }: CodeSnippetProps) {
  const [copiedVulnerable, setCopiedVulnerable] = useState(false)
  const [copiedFixed, setCopiedFixed] = useState(false)

  const copyToClipboard = async (text: string, type: 'vulnerable' | 'fixed') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'vulnerable') {
        setCopiedVulnerable(true)
        setTimeout(() => setCopiedVulnerable(false), 2000)
      } else {
        setCopiedFixed(true)
        setTimeout(() => setCopiedFixed(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  return (
    <Card className={`border border-slate-200 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg text-slate-900 flex items-center">
          <Code className="h-5 w-5 text-blue-600 mr-2" />
          Code Analysis & Fix
        </CardTitle>
        <CardDescription>
          {codeFix.explanation}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vulnerable Code Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                Vulnerable Code
              </Badge>
              {codeFix.line_numbers.length > 0 && (
                <span className="text-sm text-slate-500">
                  Lines: {codeFix.line_numbers.join(', ')}
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(codeFix.vulnerable_code, 'vulnerable')}
              className="h-8 px-3 border-slate-200 hover:border-slate-300"
            >
              {copiedVulnerable ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="ml-1 text-xs">
                {copiedVulnerable ? 'Copied!' : 'Copy'}
              </span>
            </Button>
          </div>
          <pre className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm font-mono overflow-x-auto">
            <code className="text-red-900">{codeFix.vulnerable_code}</code>
          </pre>
        </div>

        {/* Fixed Code Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                <Shield className="h-3 w-3 mr-1" />
                Fixed Code
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(codeFix.fixed_code, 'fixed')}
              className="h-8 px-3 border-slate-200 hover:border-slate-300"
            >
              {copiedFixed ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="ml-1 text-xs">
                {copiedFixed ? 'Copied!' : 'Copy'}
              </span>
            </Button>
          </div>
          <pre className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm font-mono overflow-x-auto">
            <code className="text-green-900">{codeFix.fixed_code}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  )
} 