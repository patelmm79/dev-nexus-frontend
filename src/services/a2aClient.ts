import axios, { AxiosInstance, AxiosError } from 'axios';

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

export interface AgentCard {
  name: string;
  description: string;
  version: string;
  url: string;
  capabilities: {
    streaming: boolean;
    multimodal: boolean;
    authentication: string;
  };
  skills: Skill[];
  metadata: {
    repository: string;
    documentation: string;
    authentication_note: string;
    knowledge_base: string;
    external_agents: Record<string, string>;
    architecture: string;
    skill_count: number;
  };
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  authentication: string;
}

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
// API Client Class
// ============================================

class A2AClient {
  private client: AxiosInstance;
  private authToken?: string;

  constructor(baseURL?: string, authToken?: string) {
    this.client = axios.create({
      baseURL: baseURL || import.meta.env.VITE_API_BASE_URL,
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
    const response = await this.client.post<HealthCheckExternalResponse>('/a2a/execute', {
      skill_id: 'health_check_external',
      input: {},
    });
    return response.data;
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
    const response = await this.client.post('/a2a/execute', {
      skill_id: 'add_repository',
      input: {
        repository,
      },
    });
    return response.data;
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const a2aClient = new A2AClient();

// Export class for custom instances
export default A2AClient;
