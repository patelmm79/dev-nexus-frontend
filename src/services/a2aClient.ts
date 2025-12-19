import axios, { AxiosInstance, AxiosError } from 'axios';
import { SkillExecutionResponse, AgentCard } from '../types/agents';

// ============================================
// TypeScript Types
// ============================================

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  knowledge_base_repo: string;
  skills_registered: number;
  skills: string[];
}

// `Skill` and `AgentCard` types are imported from `src/types/agents.ts`

export interface Pattern {
  name: string;
  description: string;
  context: string;
}

export interface TechnicalDecision {
  what: string;
  why: string;
  alternatives: string;
}

export interface ReusableComponent {
  name: string;
  purpose: string;
  location: string;
}

export interface PatternData {
  patterns: Pattern[];
  decisions: TechnicalDecision[];
  reusable_components: ReusableComponent[];
  dependencies: string[];
  problem_domain: string;
  keywords: string[];
  analyzed_at: string;
  commit_sha: string;
}

export interface SimilarRepository {
  repository: string;
  keyword_overlap: number;
  pattern_overlap: number;
  matching_patterns: string[];
  matching_keywords: string[];
}

export interface QueryPatternsResponse {
  success: boolean;
  repository: string;
  patterns: PatternData;
  similar_repositories: SimilarRepository[];
}

export interface Repository {
  name: string;
  latest_patterns: PatternData;
  history_count: number;
  last_updated: string;
}

export interface GetRepositoryListResponse {
  success: boolean;
  repositories: Repository[];
  total_count: number;
}

export interface DeploymentScript {
  name: string;
  description: string;
  commands: string[];
  environment_variables: Record<string, string>;
}

export interface LessonLearned {
  title: string;
  description: string;
  date: string;
  category: string;
  impact: string;
}

export interface DeploymentInfo {
  scripts: DeploymentScript[];
  lessons_learned: LessonLearned[];
  reusable_components: ReusableComponent[];
  ci_cd_platform: string;
  infrastructure: Record<string, any>;
}

export interface GetDeploymentInfoResponse {
  success: boolean;
  repository: string;
  deployment: DeploymentInfo;
}

export interface AddLessonLearnedInput {
  repository: string;
  title: string;
  description: string;
  category: string;
  impact: string;
}

export interface AddLessonLearnedResponse {
  success: boolean;
  message: string;
}

export interface CrossRepoPattern {
  pattern_name: string;
  repositories: string[];
  occurrences: number;
  variations: string[];
}

export interface GetCrossRepoPatternsResponse {
  success: boolean;
  patterns: CrossRepoPattern[];
  total_patterns: number;
}

export interface ExternalAgent {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  last_checked: string;
}

export interface HealthCheckExternalResponse {
  success: boolean;
    // Backend may return either an array of ExternalAgent or an object map { name: boolean }
    agents: ExternalAgent[];
}

export interface DocumentationStandard {
  category: string;
  requirement: string;
  severity: 'required' | 'recommended' | 'optional';
}

export interface DocumentationViolation {
  file: string;
  standard: string;
  severity: string;
  message: string;
}

export interface CheckDocumentationStandardsResponse {
  success: boolean;
  repository: string;
  violations: DocumentationViolation[];
  standards_checked: DocumentationStandard[];
  compliance_score: number;
}

// ============================================
// Compliance & Architecture Validation Types
// ============================================

export interface ComplianceViolation {
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule_id: string;
  message: string;
  recommendation: string;
  file_path?: string;
}

export interface ComplianceCategory {
  compliance_score: number;
  passed: boolean;
  checks_performed: number;
  violations: ComplianceViolation[];
}

export interface ComplianceSummary {
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  critical_violations: number;
}

export interface ComplianceRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimated_effort?: string;
  impact?: string;
}

export interface A2AIntegrationStatus {
  monitoring?: { status: 'success' | 'skipped' | 'error' };
  orchestrator?: { status: 'success' | 'skipped' | 'error' };
  pattern_miner?: { status: 'success' | 'skipped' | 'error' };
}

export interface ValidateRepositoryArchitectureResponse {
  success: boolean;
  repository: string;
  overall_compliance_score: number;
  compliance_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: ComplianceSummary;
  categories: Record<string, ComplianceCategory>;
  critical_violations: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
  a2a_integration?: A2AIntegrationStatus;
}

export interface CheckSpecificStandardResponse {
  success: boolean;
  repository: string;
  standard_category: string;
  compliance_score: number;
  passed: boolean;
  violations: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
}

export interface SuggestImprovementsResponse {
  success: boolean;
  repository: string;
  recommendations: ComplianceRecommendation[];
  total_recommendations: number;
}

// ============================================
// API Client Class
// ============================================

class A2AClient {
  private client: AxiosInstance;
  private authToken?: string;

  constructor(baseURL?: string, authToken?: string) {
    this.client = axios.create({
      baseURL: baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.authToken = authToken;

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error status
          console.error('API Error:', error.response.status, error.response.data);
        } else if (error.request) {
          // Request made but no response
          console.error('Network Error:', error.message);
        } else {
          // Error setting up request
          console.error('Request Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set authentication token for protected endpoints
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.authToken = undefined;
  }

  /**
   * Set the base URL for API requests
   */
  setBaseUrl(baseURL: string) {
    this.client.defaults.baseURL = baseURL;
  }

  // ============================================
  // Public Endpoints (No Auth Required)
  // ============================================

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/health');
    return response.data;
  }

  /**
   * Get agent card with capabilities and skills
   */
  async getAgentCard(): Promise<AgentCard> {
    const response = await this.client.get<AgentCard>('/.well-known/agent.json');
    return response.data;
  }

  /**
   * Query patterns for a specific repository
   */
  async queryPatterns(
    repository: string,
    keywords?: string[]
  ): Promise<QueryPatternsResponse> {
    const response = await this.client.post<QueryPatternsResponse>('/a2a/execute', {
      skill_id: 'query_patterns',
      input: {
        repository,
        keywords: keywords || [],
      },
    });
    return response.data;
  }

  /**
   * Get list of all tracked repositories
   */
  async getRepositoryList(): Promise<GetRepositoryListResponse> {
    const response = await this.client.post<GetRepositoryListResponse>('/a2a/execute', {
      skill_id: 'get_repository_list',
      input: {},
    });
    return response.data;
  }

  /**
   * Get deployment information for a repository
   */
  async getDeploymentInfo(repository: string): Promise<GetDeploymentInfoResponse> {
    const response = await this.client.post<GetDeploymentInfoResponse>('/a2a/execute', {
      skill_id: 'get_deployment_info',
      input: { repository },
    });
    return response.data;
  }

  /**
   * Get cross-repository patterns
   */
  async getCrossRepoPatterns(minOccurrences: number = 2): Promise<GetCrossRepoPatternsResponse> {
    const response = await this.client.post<GetCrossRepoPatternsResponse>('/a2a/execute', {
      skill_id: 'get_cross_repo_patterns',
      input: { min_occurrences: minOccurrences },
    });
    return response.data;
  }

  /**
   * Check health of external agents
   */
  async healthCheckExternal(): Promise<HealthCheckExternalResponse> {
    const response = await this.client.post('/a2a/execute', {
      skill_id: 'health_check_external',
      input: {},
    });

    const data = response.data as any;

    // Normalize agents to an array of ExternalAgent
    let agents: ExternalAgent[] = [];

    if (Array.isArray(data?.agents)) {
      agents = data.agents as ExternalAgent[];
    } else if (data && typeof data.agents === 'object' && data.agents !== null) {
      // Example shape: { "dependency-orchestrator": false }
      agents = Object.entries(data.agents).map(([name, val]) => {
        // If val is boolean, interpret as healthy/unhealthy
        if (typeof val === 'boolean') {
          return {
            name,
            url: '',
            status: val ? 'healthy' : 'unhealthy',
            last_checked: new Date().toISOString(),
          } as ExternalAgent;
        }

        // If val is an object with more details, try to map fields
        if (typeof val === 'object' && val !== null) {
          return {
            name,
            url: (val as any).url || '',
            status: (val as any).status || ((val as any).healthy ? 'healthy' : 'unhealthy'),
            last_checked: (val as any).last_checked || new Date().toISOString(),
          } as ExternalAgent;
        }

        // Fallback
        return {
          name,
          url: '',
          status: 'unknown',
          last_checked: new Date().toISOString(),
        } as ExternalAgent;
      });
    }

    return {
      success: Boolean(data?.success),
      agents,
    };
  }

  /**
   * Check documentation standards compliance
   */
  async checkDocumentationStandards(
    repository: string,
    filePaths?: string[]
  ): Promise<CheckDocumentationStandardsResponse> {
    const response = await this.client.post<CheckDocumentationStandardsResponse>('/a2a/execute', {
      skill_id: 'check_documentation_standards',
      input: {
        repository,
        file_paths: filePaths || [],
      },
    });
    return response.data;
  }

  /**
   * Validate repository architecture against all standards
   */
  async validateRepositoryArchitecture(
    repository: string,
    validationScope?: string[],
    includeRecommendations: boolean = true
  ): Promise<ValidateRepositoryArchitectureResponse> {
    const response = await this.client.post<ValidateRepositoryArchitectureResponse>('/a2a/execute', {
      skill_id: 'validate_repository_architecture',
      input: {
        repository,
        validation_scope: validationScope,
        include_recommendations: includeRecommendations,
      },
    });
    return response.data;
  }

  /**
   * Check a specific standard category for compliance
   */
  async checkSpecificStandard(
    repository: string,
    standardCategory: string
  ): Promise<CheckSpecificStandardResponse> {
    const response = await this.client.post<CheckSpecificStandardResponse>('/a2a/execute', {
      skill_id: 'check_specific_standard',
      input: {
        repository,
        standard_category: standardCategory,
      },
    });
    return response.data;
  }

  /**
   * Get improvement suggestions for a repository
   */
  async suggestImprovements(
    repository: string,
    maxRecommendations: number = 10
  ): Promise<SuggestImprovementsResponse> {
    const response = await this.client.post<SuggestImprovementsResponse>('/a2a/execute', {
      skill_id: 'suggest_improvements',
      input: {
        repository,
        max_recommendations: maxRecommendations,
      },
    });
    return response.data;
  }

  // ============================================
  // Protected Endpoints (Auth Required)
  // ============================================

  /**
   * Add a lesson learned (requires authentication)
   */
  async addLessonLearned(
    input: AddLessonLearnedInput
  ): Promise<AddLessonLearnedResponse> {
    const response = await this.client.post<AddLessonLearnedResponse>('/a2a/execute', {
      skill_id: 'add_lesson_learned',
      input,
    });
    return response.data;
  }

  /**
   * Update dependency information (requires authentication)
   */
  async updateDependencyInfo(
    repository: string,
    dependencyType: 'consumer' | 'derivative',
    dependentRepo: string,
    description: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post('/a2a/execute', {
      skill_id: 'update_dependency_info',
      input: {
        repository,
        dependency_type: dependencyType,
        dependent_repo: dependentRepo,
        description,
      },
    });
    return response.data;
  }

  /**
   * Add a repository to be tracked by the system (requires authentication)
   */
  async addRepository(repository: string): Promise<{ success: boolean; message: string }> {
    // The backend `add_deployment_info` skill expects a `deployment_info` object.
    // Provide a minimal/empty deployment_info structure so the call validates.
    const minimalDeploymentInfo = {
      scripts: [],
      lessons_learned: [],
      reusable_components: [],
      ci_cd_platform: '',
      infrastructure: {},
    } as DeploymentInfo;

    const response = await this.client.post('/a2a/execute', {
      skill_id: 'add_deployment_info',
      input: {
        repository,
        deployment_info: minimalDeploymentInfo,
      },
    });
    return response.data;
  }

  /**
   * Execute an arbitrary A2A skill by id with optional input
   */
  async executeSkill(skillId: string, input: Record<string, any> = {}): Promise<any> {
    const response = await this.client.post<SkillExecutionResponse>('/a2a/execute', {
      skill_id: skillId,
      input,
    });

    return response.data as SkillExecutionResponse;
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const a2aClient = new A2AClient();

// Export class for custom instances
export default A2AClient;
