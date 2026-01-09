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
// Component Scanning Types
// ============================================

export interface ScannedComponent {
  name: string;
  type: string;
  files: string[];
  loc: number;
  methods: number;
}

export interface ScanRepositoryComponentsResponse {
  success: boolean;
  repository: string;
  components_found: number;
  components: ScannedComponent[];
}

export interface ComponentMetadata {
  name: string;
  type: 'api_client' | 'infrastructure' | 'business_logic' | 'deployment_pattern';
  repository: string;
  language: string;
  loc: number;
  api_signature?: string;
  keywords: string[];
  description?: string;
  files?: string[];
}

export interface ListComponentsResponse {
  success: boolean;
  components: ComponentMetadata[];
  total_count: number;
  filtered_count: number;
  offset: number;
  limit: number;
  filters?: Record<string, any>;
}

// ============================================
// Component Sensibility Types
// ============================================

export interface ComponentIssue {
  component_name: string;
  current_location: string;
  suggested_location: string;
  similarity_score: number;
  issue_type: 'duplicated' | 'misplaced' | 'orphaned';
  reason: string;
}

export interface DetectMisplacedComponentsResponse {
  success: boolean;
  repository: string;
  component_issues: ComponentIssue[];
  total_duplicates: number;
  total_misplaced: number;
  filters_applied: string[];
}

export interface ComponentScore {
  component_name: string;
  location: string;
  purpose_score: number;
  usage_score: number;
  centrality_score: number;
  maintenance_score: number;
  complexity_score: number;
  first_impl_score: number;
  overall_score: number;
  recommendation: string;
}

export interface AnalyzeComponentCentralityResponse {
  success: boolean;
  repository: string;
  components: ComponentScore[];
  score_weights: {
    purpose: number;
    usage: number;
    centrality: number;
    maintenance: number;
    complexity: number;
    first_impl: number;
  };
  summary_statistics: {
    avg_score: number;
    high_priority_count: number;
    low_priority_count: number;
  };
}

export interface ConsolidationTask {
  task_id: string;
  action: 'merge' | 'move' | 'refactor' | 'delete';
  source_components: string[];
  target_location: string;
  rationale: string;
  effort_estimate: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  dependencies: string[];
}

export interface ConsolidationPhase {
  phase_number: number;
  phase_name: string;
  description: string;
  tasks: ConsolidationTask[];
  estimated_effort_hours: number;
}

export interface RecommendConsolidationPlanResponse {
  success: boolean;
  repository: string;
  phases: ConsolidationPhase[];
  total_effort_hours: number;
  expected_benefits: string[];
  risks: string[];
}

// Single-component centrality analysis response
export interface ComponentCentralityFactor {
  score: number;
  weight: number;
  reasoning: string;
}

export interface ComponentLocationScore {
  repository: string;
  total_score: number;
  factors: Record<string, ComponentCentralityFactor>;
}

export interface ComponentCentralityRecommendation {
  from: string;
  to?: string;
  improvement: number; // 0-1 decimal
  improvement_metrics?: Record<string, any>;
  migration_details?: string;
}

export interface ComponentCentralityAnalysis {
  component_name: string;
  best_location: string;
  all_scores: ComponentLocationScore[] | Record<string, any>;
  recommendation?: ComponentCentralityRecommendation;
  analysis_timestamp?: string;
}

export interface ComponentCentralityAnalysisResponse {
  success: boolean;
  component_name: string;
  current_location: string;
  best_location: string;
  all_scores: Record<string, any>;
  improvement_score: number;
  timestamp: string;
}

// Single-component consolidation plan response
export interface ConsolidationPhaseDetail {
  phase: number;
  phase_name: 'Analyze' | 'Merge' | 'Update' | 'Monitor';
  tasks: string[];
  blockers: string[];
  estimated_effort_hours: number;
}

export interface ComponentConsolidationPlanResponse {
  success: boolean;
  component_name: string;
  consolidation_recommendation_id: string;
  from_repository: string;
  to_repository: string;
  confidence: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  phases: ConsolidationPhaseDetail[];
  benefits: string[];
  risks: string[];
  estimated_total_effort_hours: number;
  timestamp: string;
}

// ============================================
// Component Dependencies Types
// ============================================

export interface ComponentDependency {
  source_component: string;
  target_component: string;
  import_type: 'direct' | 'indirect' | 'peer';
  import_count: number;
  files_involved: string[];
  strength: number; // 0-1, how critical is this dependency
}

export interface CircularDependencyPath {
  components: string[];
  cycle_length: number;
  severity: 'low' | 'medium' | 'high';
}

export interface GetComponentDependenciesResponse {
  success: boolean;
  repository: string;
  component_name?: string;
  dependencies: ComponentDependency[];
  circular_dependencies: CircularDependencyPath[];
  total_dependencies: number;
  analysis_depth: number;
  analysis_timestamp: string;
}

// ============================================
// Analytics Dashboard Types
// ============================================

// Dashboard Overview Types
export interface SystemHealthMetrics {
  overall_health_score: number; // 0-100
  status: 'healthy' | 'warning' | 'critical';
  uptime_percentage: number;
  last_scan_timestamp: string;
}

export interface DashboardMetric {
  label: string;
  value: number;
  unit: string;
  trend: number; // percentage change, negative = down, positive = up
  status: 'improving' | 'stable' | 'declining';
}

export interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  actionable: boolean;
  recommendation?: string;
}

export interface TimelineHighlight {
  timestamp: string;
  event_type: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface GetDashboardOverviewResponse {
  success: boolean;
  system_health: SystemHealthMetrics;
  metrics: DashboardMetric[];
  alerts: SystemAlert[];
  timeline_highlights: TimelineHighlight[];
  last_updated: string;
}

// Pattern Analytics Types
export interface PatternAdoptionPoint {
  date: string;
  pattern_count: number;
  repository_count: number;
  new_patterns: number;
}

export interface PatternGrowthRate {
  period: string;
  growth_percentage: number;
  adoption_velocity: number;
}

export interface GetPatternAdoptionTrendsResponse {
  success: boolean;
  adoption_timeline: PatternAdoptionPoint[];
  growth_rates: PatternGrowthRate[];
  start_date: string;
  end_date: string;
}

export interface PatternHealthScore {
  pattern_name: string;
  health_score: number; // 0-100
  usage_count: number;
  adoption_rate: number;
}

export interface PatternHealthTrend {
  date: string;
  avg_health_score: number;
  total_issues: number;
  healthy_patterns_count: number;
}

export interface PatternIssueType {
  issue_type: string;
  count: number;
  percentage: number;
}

export interface GetPatternHealthSummaryResponse {
  success: boolean;
  pattern_scores: PatternHealthScore[];
  health_trends: PatternHealthTrend[];
  issue_breakdown: PatternIssueType[];
  overall_health_score: number;
}

// Component Analytics Types
export interface ComponentDuplicationMetric {
  duplication_level: 'low' | 'medium' | 'high';
  component_count: number;
  percentage: number;
}

export interface ConsolidationProgress {
  phase: string;
  total_components: number;
  completed: number;
  percentage: number;
}

export interface EffortSavingsEstimate {
  consolidation_type: string;
  estimated_hours_saved: number;
  complexity_level: 'low' | 'medium' | 'high';
}

export interface GetComponentDuplicationStatsResponse {
  success: boolean;
  total_duplicates: number;
  total_unique_components: number;
  duplication_distribution: ComponentDuplicationMetric[];
  consolidation_progress: ConsolidationProgress[];
  effort_savings: EffortSavingsEstimate[];
  last_analysis: string;
}

// Activity Analytics Types
export interface RepositoryActivityPoint {
  date: string;
  pattern_scans: number;
  component_scans: number;
  compliance_checks: number;
}

export interface ActivitySummaryByType {
  activity_type: string;
  count: number;
  percentage: number;
}

export interface RepositoryActivityRanking {
  repository_name: string;
  total_activity: number;
  pattern_scans: number;
  component_scans: number;
  compliance_checks: number;
}

export interface GetRepositoryActivitySummaryResponse {
  success: boolean;
  activity_timeline: RepositoryActivityPoint[];
  activity_by_type: ActivitySummaryByType[];
  repository_rankings: RepositoryActivityRanking[];
  period: 'day' | 'week' | 'month';
  total_activities: number;
}

// ============================================
// Pattern Workflow Types
// ============================================

export interface SuggestPatternFromComponentInput {
  component_name: string;
  repository: string;
  duplication_count: number;
  component_type: string;
  similarity_score: number;
}

export interface PatternSuggestion {
  pattern_name: string;
  description: string;
  worthiness_score: number; // 0-10
  rationale: string;
  affected_repositories: string[];
  estimated_effort: 'low' | 'medium' | 'high';
  benefits: string[];
  implementation_notes: string[];
}

export interface CreatePatternFromComponentInput {
  component_name: string;
  repository: string;
  pattern_name: string;
  pattern_description: string;
  duplication_count: number;
  component_type: string;
}

export interface CreatePatternResponse {
  success: boolean;
  pattern_name: string;
  message: string;
  repositories_affected: string[];
}

// ============================================
// Pattern Versioning Types
// ============================================

export interface PatternVersionChange {
  field: string;
  old_value: string;
  new_value: string;
}

export interface PatternVersion {
  version_number: number;
  pattern_name: string;
  description: string;
  status: 'active' | 'deprecated' | 'archived';
  created_at: string;
  created_by: string;
  change_summary: string;
  changes: PatternVersionChange[];
}

export interface UpdatePatternInput {
  pattern_name: string;
  description?: string;
  keywords?: string[];
  change_summary: string;
}

export interface DeprecatePatternInput {
  pattern_name: string;
  reason: string;
  replacement_pattern?: string;
  migration_notes?: string[];
}

export interface GetPatternHistoryResponse {
  success: boolean;
  pattern_name: string;
  versions: PatternVersion[];
  total_versions: number;
}

export interface UpdatePatternResponse {
  success: boolean;
  pattern_name: string;
  new_version: number;
  message: string;
}

export interface DeprecatePatternResponse {
  success: boolean;
  pattern_name: string;
  affected_repositories: string[];
  message: string;
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
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '300000'), // 5 minutes default
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
  // Component Sensibility Skills
  // ============================================

  /**
   * Detect misplaced and duplicated components across repositories
   */
  async detectMisplacedComponents(
    repository?: string,
    options?: {
      component_types?: string[];
      min_similarity_score?: number;
      include_diverged?: boolean;
      top_k_matches?: number;
    }
  ): Promise<DetectMisplacedComponentsResponse> {
    const response = await this.client.post<DetectMisplacedComponentsResponse>('/a2a/execute', {
      skill_id: 'detect_misplaced_components',
      input: {
        repository: repository || null,
        component_types: options?.component_types,
        min_similarity_score: options?.min_similarity_score,
        include_diverged: options?.include_diverged,
        top_k_matches: options?.top_k_matches,
      },
    });
    return response.data;
  }

  /**
   * Analyze a specific component's centrality and optimal location
   * Evaluates where a component best fits based on multiple scoring factors
   */
  async analyzeComponentCentrality(
    component_name: string,
    current_location: string,
    candidate_locations?: string[]
  ): Promise<ComponentCentralityAnalysisResponse> {
    const response = await this.client.post<ComponentCentralityAnalysisResponse>('/a2a/execute', {
      skill_id: 'analyze_component_centrality',
      input: {
        component_name,
        current_location,
        candidate_locations: candidate_locations || undefined,
      },
    });
    return response.data;
  }

  /**
   * Recommend a phased consolidation plan for a specific component
   * Generates detailed roadmap with effort estimates and risk assessment
   */
  async recommendConsolidationPlan(
    component_name: string,
    from_repository: string,
    options?: {
      to_repository?: string;
      include_impact_analysis?: boolean;
      include_deep_analysis?: boolean;
    }
  ): Promise<ComponentConsolidationPlanResponse> {
    const response = await this.client.post<ComponentConsolidationPlanResponse>('/a2a/execute', {
      skill_id: 'recommend_consolidation_plan',
      input: {
        component_name,
        from_repository,
        to_repository: options?.to_repository || undefined,
        include_impact_analysis: options?.include_impact_analysis,
        include_deep_analysis: options?.include_deep_analysis,
      },
    });
    return response.data;
  }

  /**
   * Scan a repository for components
   */
  async scanRepositoryComponents(
    repository: string
  ): Promise<ScanRepositoryComponentsResponse> {
    const response = await this.client.post<ScanRepositoryComponentsResponse>('/a2a/execute', {
      skill_id: 'scan_repository_components',
      input: { repository },
    });
    return response.data;
  }

  /**
   * List components with filtering and pagination
   */
  async listComponents(
    repository?: string,
    componentType?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ListComponentsResponse> {
    const response = await this.client.post<ListComponentsResponse>('/a2a/execute', {
      skill_id: 'list_components',
      input: {
        repository: repository || undefined,
        component_type: componentType || undefined,
        limit,
        offset,
      },
    });
    return response.data;
  }

  /**
   * Get component dependencies with circular dependency detection
   */
  async getComponentDependencies(
    repository: string,
    componentName?: string,
    analysisDepth: number = 3
  ): Promise<GetComponentDependenciesResponse> {
    const response = await this.client.post<GetComponentDependenciesResponse>('/a2a/execute', {
      skill_id: 'get_component_dependencies',
      input: {
        repository,
        component_name: componentName || undefined,
        analysis_depth: analysisDepth,
      },
    });
    return response.data;
  }

  // ============================================
  // Analytics Dashboard Skills
  // ============================================

  /**
   * Get dashboard overview with system health metrics, alerts, and highlights
   */
  async getDashboardOverview(): Promise<GetDashboardOverviewResponse> {
    const response = await this.client.post<GetDashboardOverviewResponse>('/a2a/execute', {
      skill_id: 'get_dashboard_overview',
      input: {},
    });
    return response.data;
  }

  /**
   * Get pattern adoption trends over time
   */
  async getPatternAdoptionTrends(
    startDate?: string,
    endDate?: string
  ): Promise<GetPatternAdoptionTrendsResponse> {
    const response = await this.client.post<GetPatternAdoptionTrendsResponse>('/a2a/execute', {
      skill_id: 'get_pattern_adoption_trends',
      input: {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
    });
    return response.data;
  }

  /**
   * Get pattern health summary with scores and trends
   */
  async getPatternHealthSummary(): Promise<GetPatternHealthSummaryResponse> {
    const response = await this.client.post<GetPatternHealthSummaryResponse>('/a2a/execute', {
      skill_id: 'get_pattern_health_summary',
      input: {},
    });
    return response.data;
  }

  /**
   * Get component duplication statistics and consolidation progress
   */
  async getComponentDuplicationStats(): Promise<GetComponentDuplicationStatsResponse> {
    const response = await this.client.post<GetComponentDuplicationStatsResponse>('/a2a/execute', {
      skill_id: 'get_component_duplication_stats',
      input: {},
    });
    return response.data;
  }

  /**
   * Get repository activity summary by time period
   */
  async getRepositoryActivitySummary(
    period: 'day' | 'week' | 'month' = 'week',
    limit: number = 10
  ): Promise<GetRepositoryActivitySummaryResponse> {
    const response = await this.client.post<GetRepositoryActivitySummaryResponse>('/a2a/execute', {
      skill_id: 'get_repository_activity_summary',
      input: {
        period,
        limit,
      },
    });
    return response.data;
  }

  /**
   * Suggest creating a pattern from a duplicated component
   */
  async suggestPatternFromComponent(input: SuggestPatternFromComponentInput): Promise<PatternSuggestion> {
    const response = await this.client.post<PatternSuggestion>('/a2a/execute', {
      skill_id: 'suggest_pattern_from_component',
      input,
    });
    return response.data;
  }

  /**
   * Create a new cross-repository pattern from a component
   */
  async createPatternFromComponent(input: CreatePatternFromComponentInput): Promise<CreatePatternResponse> {
    const response = await this.client.post<CreatePatternResponse>('/a2a/execute', {
      skill_id: 'create_pattern_from_component',
      input,
    });
    return response.data;
  }

  /**
   * Get pattern version history
   */
  async getPatternHistory(patternName: string): Promise<GetPatternHistoryResponse> {
    const response = await this.client.post<GetPatternHistoryResponse>('/a2a/execute', {
      skill_id: 'get_pattern_history',
      input: { pattern_name: patternName },
    });
    return response.data;
  }

  /**
   * Update an existing pattern (creates new version)
   */
  async updatePattern(input: UpdatePatternInput): Promise<UpdatePatternResponse> {
    const response = await this.client.post<UpdatePatternResponse>('/a2a/execute', {
      skill_id: 'update_pattern',
      input,
    });
    return response.data;
  }

  /**
   * Deprecate a pattern
   */
  async deprecatePattern(input: DeprecatePatternInput): Promise<DeprecatePatternResponse> {
    const response = await this.client.post<DeprecatePatternResponse>('/a2a/execute', {
      skill_id: 'deprecate_pattern',
      input,
    });
    return response.data;
  }

  /**
   * Archive a deprecated pattern
   */
  async archivePattern(patternName: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post('/a2a/execute', {
      skill_id: 'archive_pattern',
      input: { pattern_name: patternName },
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
