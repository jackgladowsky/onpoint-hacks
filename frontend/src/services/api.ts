const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Vulnerability {
  title: string;
  severity: string;
  description: string;
  fix_suggestion: string;
  score_impact: number;
  line_numbers: number[];
  type: string;
  file_name: string;
}

export interface MultipleAnalysisResult {
  summary: string;
  project_metrics: {
    total_files: number;
    successful_analyses: number;
    failed_analyses: number;
    average_security_score: number;
    overall_project_risk: string;
    total_vulnerabilities: number;
    aggregate_risk_breakdown: {
      high: number;
      medium: number;
      low: number;
    };
  };
  individual_results: Array<{
    file_name: string;
    security_score: number;
    overall_risk: string;
    vulnerabilities: Vulnerability[];
    risk_breakdown: {
      high: number;
      medium: number;
      low: number;
    };
    error?: string;
  }>;
  all_vulnerabilities: Vulnerability[];
  timestamp: string;
  analysis_details: {
    llm_model_used: string;
    files_analyzed: string[];
  };
}

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export const api = {
  async analyzeMultipleFiles(files: File[]): Promise<MultipleAnalysisResult> {
    console.log('🔍 Starting analysis for', files.length, 'files');
    
    const formData = new FormData();
    files.forEach(file => {
      console.log('📁 Adding file to FormData:', file.name, file.size, 'bytes', file.type);
      formData.append('files', file);
    });

    try {
      console.log('🚀 Sending request to:', `${API_BASE_URL}/analyze`);
      console.log('📤 Request headers: Content-Type will be set automatically for FormData');
      
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('❌ Response not OK, reading error details...');
        let errorDetail;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || 'Unknown error';
          console.error('❌ API Error Response:', errorData);
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
          errorDetail = 'Unknown error';
        }
        throw new APIError(response.status, errorDetail);
      }

      console.log('📥 Reading successful response...');
      const result = await response.json();
      console.log('✅ Analysis completed successfully');
      console.log('📊 Result summary:', {
        total_files: result.project_metrics?.total_files,
        average_score: result.project_metrics?.average_security_score,
        total_vulnerabilities: result.project_metrics?.total_vulnerabilities,
        summary: result.summary?.substring(0, 100) + '...'
      });
      
      // Validate the response structure
      if (!result.project_metrics || !result.individual_results) {
        console.warn('⚠️ Response missing expected fields');
      }
      
      return result;
    } catch (error) {
      console.error('💥 Request failed:', error);
      if (error instanceof APIError) {
        console.error('💥 API Error details:', { status: error.status, message: error.message });
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('💥 Network/Fetch error - is the backend running?');
        throw new APIError(500, 'Cannot connect to backend server. Please check if it is running.');
      }
      console.error('💥 Unknown error type:', typeof error, error);
      throw new APIError(500, error instanceof Error ? error.message : 'Network error');
    }
  },

  async checkHealth(): Promise<{ status: string; services: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new APIError(response.status, 'Health check failed');
      }
      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, error instanceof Error ? error.message : 'Network error');
    }
  },
};