/**
 * Custom hooks for agent and skill management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { a2aClient } from '../services/a2aClient';
import {
  Skill,
  AgentCard,
  SkillExecutionRequest,
  SkillExecutionResponse,
} from '../types/agents';

// types are centralized in src/types/agents.ts

/**
 * Fetch the AgentCard (all available skills and metadata)
 */
export function useAgentCard() {
  return useQuery<AgentCard>({
    queryKey: ['agentCard'],
    queryFn: async () => {
      return await a2aClient.getAgentCard();
    },
    staleTime: Infinity, // AgentCard rarely changes
    retry: 2,
  });
}

/**
 * Execute a skill with given input
 */
export function useExecuteSkill() {
  const queryClient = useQueryClient();

  return useMutation<SkillExecutionResponse, Error, SkillExecutionRequest>({
    mutationFn: async (request) => {
      const res = await a2aClient.executeSkill(request.skill_id, request.input || {});
      return res as SkillExecutionResponse;
    },
    onSuccess: () => {
      // Invalidate related queries after skill execution
      queryClient.invalidateQueries({ queryKey: ['patterns'] });
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
}

/**
 * Get a specific skill by ID
 */
export function useSkillById(skillId: string | null) {
  const { data: agentCard } = useAgentCard();

  return {
    skill: agentCard?.skills.find((s) => s.id === skillId),
    isLoading: !agentCard,
  };
}

/**
 * Search and filter skills
 */
export function useSkillSearch(query: string = '') {
  const { data: agentCard, isLoading } = useAgentCard();

  const filteredSkills = agentCard?.skills.filter((skill) => {
    const searchText = query.toLowerCase();
    return (
      skill.name.toLowerCase().includes(searchText) ||
      skill.description.toLowerCase().includes(searchText) ||
      skill.id.toLowerCase().includes(searchText) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(searchText))
    );
  }) || [];

  return {
    skills: filteredSkills,
    isLoading,
    totalCount: agentCard?.skills.length || 0,
  };
}

/**
 * Group skills by category
 */
export function useSkillsByCategory() {
  const { data: agentCard } = useAgentCard();

  const grouped = {
    Query: [] as Skill[],
    Repository: [] as Skill[],
    Knowledge: [] as Skill[],
    Integration: [] as Skill[],
    Documentation: [] as Skill[],
    Monitoring: [] as Skill[],
  };

  agentCard?.skills.forEach((skill) => {
    if (skill.tags.includes('search') || skill.tags.includes('query')) {
      grouped.Query.push(skill);
    } else if (skill.tags.includes('repository')) {
      grouped.Repository.push(skill);
    } else if (skill.tags.includes('knowledge') || skill.tags.includes('learning')) {
      grouped.Knowledge.push(skill);
    } else if (skill.tags.includes('integration') || skill.tags.includes('external')) {
      grouped.Integration.push(skill);
    } else if (skill.tags.includes('documentation')) {
      grouped.Documentation.push(skill);
    } else if (skill.tags.includes('monitoring') || skill.tags.includes('health')) {
      grouped.Monitoring.push(skill);
    }
  });

  // Remove empty categories
  return Object.fromEntries(Object.entries(grouped).filter(([, skills]) => skills.length > 0));
}

/**
 * Get execution history from localStorage
 */
export function useExecutionHistory() {
  const getHistory = useCallback(() => {
    try {
      const history = localStorage.getItem('skill_execution_history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }, []);

  const addToHistory = useCallback((request: SkillExecutionRequest, response: SkillExecutionResponse) => {
    try {
      const history = getHistory();
      history.push({
        timestamp: new Date().toISOString(),
        request,
        response,
      });
      // Keep only last 50 executions
      if (history.length > 50) {
        history.shift();
      }
      localStorage.setItem('skill_execution_history', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save execution history:', error);
    }
  }, [getHistory]);

  const clearHistory = useCallback(() => {
    localStorage.removeItem('skill_execution_history');
  }, []);

  return { getHistory, addToHistory, clearHistory };
}

/**
 * Fetch recent actions feed with pagination
 */
export function useRecentActions(
  limit: number = 20,
  offset: number = 0,
  actionTypes?: string[],
  repository?: string
) {
  return useQuery<SkillExecutionResponse>({
    queryKey: ['recentActions', limit, offset, actionTypes, repository],
    queryFn: async () => {
      const input: Record<string, any> = { limit, offset };
      if (actionTypes && actionTypes.length > 0) {
        input.action_types = actionTypes;
      }
      if (repository) {
        input.repository = repository;
      }

      const res = await a2aClient.executeSkill('get_recent_actions', input);
      return res as SkillExecutionResponse;
    },
    staleTime: 30000, // 30 seconds
    retry: 2,
  });
}
