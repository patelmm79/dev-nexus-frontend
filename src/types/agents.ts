// Centralized types for agents/features

export interface Skill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  requires_authentication: boolean;
  input_schema: Record<string, any>;
  examples?: Array<{ input: any; description?: string }>;
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

export interface SkillExecutionRequest {
  skill_id: string;
  input: Record<string, any>;
}

export interface SkillExecutionResponse {
  success: boolean;
  skill_id: string;
  error?: string;
  [key: string]: any;
}

export interface Action {
  action_type: 'analysis' | 'lesson' | 'deployment' | 'runtime_issue';
  repository: string;
  timestamp: string;
  reference_id: string;
  metadata: Record<string, any>;
}

export interface PaginationInfo {
  limit: number;
  offset: number;
  has_more: boolean;
  next_offset: number | null;
  total_pages: number;
}

export interface RecentActionsResponse {
  success: boolean;
  count?: number;
  returned?: number;
  actions?: Action[];
  pagination?: PaginationInfo;
  error?: string;
}
