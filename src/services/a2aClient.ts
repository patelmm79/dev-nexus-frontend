import axios, { AxiosInstance, AxiosError } from 'axios';
import { SkillExecutionResponse, AgentCard } from '../types/agents';

// ============================================
// Phase 11: Standardized Response Format
// ============================================

/**
 * Standard response structure for all A2A skill executions
 * All skill responses follow this format with optional skill-specific fields
 */
export interface StandardSkillResponse {
  success: boolean;
  timestamp: string; // ISO 8601 format
  execution_time_ms: number;
  error?: string; // Only present on failures
  metadata?: Record<string, any>; // Optional context data
  [key: string]: any; // Skill-specific fields at root level
}

/**
 * Async workflow response - indicates the workflow was queued for later execution
 */
export interface AsyncWorkflowResponse extends StandardSkillResponse {
  state: 'async_queued';
  workflow_id: string;
  polling_interval_ms: number;
}

/**
 * Async workflow status - used when polling for workflow results
 */
export interface WorkflowStatusMetadata {
  state: 'queued' | 'running' | 'completed' | 'failed';
  progress_percent?: number;
  current_step?: string;
  estimated_remaining_ms?: number;
}

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
  latest_patterns?: PatternData;
  pattern_count?: number;
  problem_domain?: string;
  keywords?: string[];
  history_count?: number;
  last_updated: string;
}

export interface GetRepositoryListResponse {
  success: boolean;
  repositories: Repository[];
  total_repositories: number;
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

// Backend response structure for cross-repo patterns
export interface BackendCrossRepoPattern {
  pattern: string;
  repositories: string[];
  repo_count: number;
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
  total_components: number;
  filtered_count: number;
  filters?: Record<string, any>;
  pagination?: {
    limit: number;
    offset: number;
  };
}

// ============================================
// Complexity Analysis Types
// ============================================

export interface ComplexityMetric {
  simplified_mccabe: {
    grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    score: number;
    description: string;
  };
  full_mccabe: number;
  cognitive_complexity: number;
  level: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComponentComplexity {
  component_name: string;
  component_type: string;
  repository: string;
  files: string[];
  lines_of_code: number;
  complexity: ComplexityMetric;
  last_analyzed: string;
}

export interface ComplexityDistribution {
  level: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  percentage: number;
}

export interface ComplexitySummary {
  average_simplified_score: number;
  median_simplified_score: number;
  max_simplified_score: number;
  weighted_score: number;
  average_full_mccabe: number;
  median_full_mccabe: number;
  max_full_mccabe: number;
  average_cognitive: number;
  median_cognitive: number;
  max_cognitive: number;
  overall_grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

export interface GetComplexityAnalysisResponse {
  success: boolean;
  timestamp: string;
  execution_time_ms: number;
  repository: string;
  summary: ComplexitySummary;
  distribution: ComplexityDistribution[];
  components: ComponentComplexity[];
  total_components: number;
  stale_analysis: boolean;
  days_since_analysis?: number;
}

export interface TriggerComplexityAnalysisResponse {
  success: boolean;
  timestamp: string;
  execution_time_ms: number;
  repository: string;
  message: string;
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

export interface OverallHealth {
  average_score: number;
  status: string;
  critical_count: number;
  warning_count: number;
  healthy_count: number;
}

export interface PatternHealthScore {
  pattern_name: string;
  health_score: number;
}

export interface PatternHealthTrend {
  week: string;
  average_score: number;
}

export interface PatternIssueType {
  type: string;
  count: number;
}

export interface GetPatternHealthSummaryResponse {
  success: boolean;
  time_range_days: number;
  overall_health: OverallHealth;
  patterns_by_health: PatternHealthScore[];
  health_trends: PatternHealthTrend[];
  top_issue_types: PatternIssueType[];
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
// Workflow Orchestration Types
// ============================================

export interface WorkflowPhaseStatus {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  started_at?: string;
  completed_at?: string;
}

export interface WorkflowRepositoryStatus {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  phases: WorkflowPhaseStatus[];
  error?: string;
  patterns_extracted?: number;
  dependencies_discovered?: number;
}

export interface TriggerFullAnalysisInput {
  repository_names: string[];
  phases: {
    pattern_extraction: boolean;
    dependency_discovery: boolean;
    metadata_analysis?: boolean;
  };
}

export interface WorkflowPhaseResult {
  phase: string;
  repository: string;
  status: 'completed' | 'failed' | 'ready';
  result?: {
    success: boolean;
    error?: string;
    patterns_extracted?: number;
    dependencies_discovered?: number;
    message?: string;
    [key: string]: any;
  };
  message?: string;
  next_step?: string;
}

export interface TriggerFullAnalysisResponse {
  success: boolean;
  repositories_processed: number;
  timestamp: string;
  phases: {
    pattern_extraction?: { status: string };
    dependency_discovery?: { status: string };
    component_analysis?: { status: string };
  };
  workflow_steps: WorkflowPhaseResult[];
  phase_results: {
    pattern_extraction?: any[];
    dependency_discovery?: any[];
    component_analysis?: any;
  };
}

/**
 * Workflow status response (Phase 12: Updated field names)
 *
 * Used for polling long-running analysis workflows.
 * Returns standardized progress metrics for overall workflow tracking.
 */
export interface WorkflowStatusResponse {
  workflow_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'partial_success';
  repositories_count: number; // Total repositories in workflow
  repositories_completed: number; // Number of completed repositories
  progress_percent: number; // Overall progress 0-100%
  results?: Record<string, any>[]; // Workflow results by repository
  error?: string | null;
  metadata?: Record<string, any> | null;
  // Legacy/compatibility fields
  timestamp?: string;
  execution_time_ms?: number;
  success?: boolean;
}

export interface ExtractPatternsInput {
  repository_name: string;
}

export interface ExtractPatternsResponse {
  success: boolean;
  repository: string;
  patterns_extracted: number;
  message: string;
}

export interface DiscoverDependenciesInput {
  repository_name: string;
}

export interface DiscoverDependenciesResponse {
  success: boolean;
  repository: string;
  dependencies_discovered: number;
  message: string;
}

export interface DependencyVerification {
  source_repository: string;
  target_repository: string;
  dependency_type: string;
  confidence: number; // 0-100
}

export interface UpdateDependencyVerificationInput {
  dependencies: DependencyVerification[];
}

export interface UpdateDependencyVerificationResponse {
  success: boolean;
  updated_count: number;
  message: string;
}

export interface WorkflowMetadata {
  repository: string;
  patterns_count: number;
  dependencies_count: number;
  components_count: number;
  last_updated: string;
}

export interface WorkflowMetadataResponse {
  success: boolean;
  metadata: WorkflowMetadata[];
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
    const response = await this.client.post<any>('/a2a/execute', {
      skill_id: 'get_cross_repo_patterns',
      input: { min_occurrences: minOccurrences },
    });

    const backendData = response.data as any;

    // Transform backend response to match frontend types
    // Backend returns: { cross_repo_patterns: [...], total_patterns, ... }
    // Frontend expects: { patterns: [...], total_patterns, ... }
    const patterns = (backendData.cross_repo_patterns || []).map(
      (pattern: BackendCrossRepoPattern): CrossRepoPattern => ({
        pattern_name: pattern.pattern,
        repositories: pattern.repositories || [],
        occurrences: pattern.repo_count || 0,
        variations: [], // Backend doesn't provide variations, use empty array
      })
    );

    return {
      success: backendData.success,
      patterns,
      total_patterns: backendData.total_patterns || 0,
    };
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
    // Explicitly handle repository parameter - pass null to analyze all repos
    const repoParam = repository && repository !== 'all' ? repository : null;
    console.debug('detectMisplacedComponents called with:', { repository, repoParam });

    const response = await this.client.post<DetectMisplacedComponentsResponse>('/a2a/execute', {
      skill_id: 'detect_misplaced_components',
      input: {
        repository: repoParam,
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
   *
   * API Response Structure:
   * {
   *   "success": true,
   *   "adoption_timeline": [
   *     { "date": "2025-01-01", "pattern_count": 5, "repository_count": 3, "new_patterns": 1 },
   *     ...
   *   ],
   *   "growth_rates": [
   *     { "period": "week", "growth_percentage": 10.5, "adoption_velocity": 2.1 },
   *     ...
   *   ],
   *   "start_date": "2025-01-01",
   *   "end_date": "2025-01-31"
   * }
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
   *
   * API Response Structure:
   * {
   *   "success": true,
   *   "time_range_days": 30,
   *   "overall_health": {
   *     "average_score": 0.95,
   *     "status": "healthy",
   *     "critical_count": 0,
   *     "warning_count": 2,
   *     "healthy_count": 10
   *   },
   *   "patterns_by_health": [
   *     { "pattern_name": "singleton", "health_score": 0.98 },
   *     ...
   *   ],
   *   "health_trends": [
   *     { "week": "2025-01-02", "average_score": 0.95 },
   *     { "week": "2025-01-09", "average_score": 1.0 },
   *     ...
   *   ],
   *   "top_issue_types": [
   *     { "type": "timeout", "count": 5 },
   *     { "type": "error", "count": 2 },
   *     ...
   *   ]
   * }
   *
   * Note: Field names are critical—use exactly as shown (week, not date; patterns_by_health, not pattern_scores; top_issue_types, not issue_breakdown)
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
   *
   * API Response includes:
   * - duplication_distribution: Array of duplication metrics by level
   * - consolidation_progress: Array of consolidation phase progress
   * - effort_savings: Array of estimated hours saved
   * - total_duplicates, total_unique_components: Summary counts
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
   *
   * API Response includes:
   * - activity_timeline: Array of daily/weekly/monthly activity points
   * - activity_by_type: Breakdown of activities by type
   * - repository_rankings: Ranked list of repositories by activity
   * - Period: "day" | "week" | "month"
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

  // ============================================
  // Workflow Orchestration Methods
  // ============================================

  /**
   * Trigger full analysis workflow for multiple repositories
   */
  async triggerFullAnalysisWorkflow(
    input: TriggerFullAnalysisInput
  ): Promise<TriggerFullAnalysisResponse> {
    const response = await this.client.post<TriggerFullAnalysisResponse>('/a2a/execute', {
      skill_id: 'trigger_full_analysis_workflow',
      input: {
        repositories: input.repository_names,
        phases: input.phases,
      },
    });
    return response.data;
  }

  /**
   * Poll workflow status using direct HTTP GET endpoint
   * The backend provides the polling endpoint in the async_queued response
   */
  async getWorkflowStatus(workflowId: string): Promise<WorkflowStatusResponse> {
    const response = await this.client.get<WorkflowStatusResponse>(`/a2a/workflow/${workflowId}`);
    return response.data;
  }

  /**
   * Extract patterns from a single repository
   */
  async extractRepositoryPatterns(
    input: ExtractPatternsInput
  ): Promise<ExtractPatternsResponse> {
    const response = await this.client.post<ExtractPatternsResponse>('/a2a/execute', {
      skill_id: 'extract_repository_patterns',
      input,
    });
    return response.data;
  }

  /**
   * Discover dependencies in a single repository
   */
  async discoverRepositoryDependencies(
    input: DiscoverDependenciesInput
  ): Promise<DiscoverDependenciesResponse> {
    const response = await this.client.post<DiscoverDependenciesResponse>('/a2a/execute', {
      skill_id: 'discover_repository_dependencies',
      input,
    });
    return response.data;
  }

  /**
   * Update dependency verification confidence scores
   */
  async updateDependencyVerification(
    input: UpdateDependencyVerificationInput
  ): Promise<UpdateDependencyVerificationResponse> {
    const response = await this.client.post<UpdateDependencyVerificationResponse>(
      '/a2a/execute',
      {
        skill_id: 'update_dependency_verification',
        input,
      }
    );
    return response.data;
  }

  /**
   * Get workflow metadata statistics
   */
  async getWorkflowMetadata(): Promise<WorkflowMetadataResponse> {
    const response = await this.client.post<WorkflowMetadataResponse>('/a2a/execute', {
      skill_id: 'get_workflow_metadata',
      input: {},
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

  // ============================================
  // Phase 12: Response Validation & Utilities
  // ============================================

  /**
   * Validate response structure matches StandardSkillResponse format
   * @param response Response to validate
   * @returns true if response has required fields (success, timestamp, execution_time_ms)
   */
  isValidResponse(response: any): boolean {
    if (!response || typeof response !== 'object') {
      return false;
    }

    // Check required fields per Phase 11 standard
    const hasSuccess = typeof response.success === 'boolean';
    const hasTimestamp = typeof response.timestamp === 'string';
    const hasExecutionTime = typeof response.execution_time_ms === 'number';

    if (!hasSuccess || !hasTimestamp || !hasExecutionTime) {
      console.warn('Invalid response structure missing required fields', {
        hasSuccess,
        hasTimestamp,
        hasExecutionTime,
        response,
      });
      return false;
    }

    // If success=false, error field should be present
    if (!response.success && !response.error) {
      console.warn('Failed response missing error field', response);
      return false;
    }

    return true;
  }

  /**
   * Extract execution time from response
   * @param response StandardSkillResponse
   * @returns execution time in milliseconds
   */
  getExecutionTime(response: StandardSkillResponse): number {
    return response.execution_time_ms ?? 0;
  }

  /**
   * Extract and parse timestamp from response
   * @param response StandardSkillResponse
   * @returns parsed Date object
   */
  getTimestamp(response: StandardSkillResponse): Date {
    try {
      return new Date(response.timestamp);
    } catch {
      console.warn('Invalid timestamp format:', response.timestamp);
      return new Date();
    }
  }

  /**
   * Check if response indicates an error
   * @param response StandardSkillResponse
   * @returns true if success=false
   */
  isError(response: StandardSkillResponse): boolean {
    return response.success === false;
  }

  /**
   * Get error message from response
   * @param response StandardSkillResponse
   * @returns error message or empty string if no error
   */
  getErrorMessage(response: StandardSkillResponse): string {
    if (this.isError(response)) {
      return response.error || 'Unknown error occurred';
    }
    return '';
  }

  /**
   * Get error metadata if present
   * @param response StandardSkillResponse
   * @returns error metadata or empty object
   */
  getErrorMetadata(response: StandardSkillResponse): Record<string, any> {
    if (this.isError(response) && response.metadata) {
      return response.metadata;
    }
    return {};
  }

  /**
   * Get complexity analysis for a repository
   */
  async getComplexityAnalysis(repository: string): Promise<GetComplexityAnalysisResponse> {
    const response = await this.client.post<GetComplexityAnalysisResponse>('/a2a/execute', {
      skill_id: 'get_complexity_analysis',
      input: { repository },
    });
    return response.data;
  }

  /**
   * Trigger new complexity analysis for a repository
   */
  async triggerComplexityAnalysis(repository: string): Promise<TriggerComplexityAnalysisResponse> {
    const response = await this.client.post<TriggerComplexityAnalysisResponse>('/a2a/execute', {
      skill_id: 'trigger_complexity_analysis',
      input: { repository },
    });
    return response.data;
  }

  /**
   * Format response for logging (include key information)
   * @param response StandardSkillResponse
   * @param skillId Skill identifier for context
   * @returns formatted log message
   */
  formatResponseLog(response: StandardSkillResponse, skillId: string): string {
    const status = response.success ? '✅' : '❌';
    const time = response.execution_time_ms;
    const error = this.isError(response) ? ` | Error: ${response.error}` : '';
    return `${status} ${skillId}: ${time}ms${error}`;
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const a2aClient = new A2AClient();

// Export class for custom instances
export default A2AClient;
