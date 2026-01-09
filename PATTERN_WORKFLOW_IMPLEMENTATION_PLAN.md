# Pattern Workflow Implementation Plan

## Overview
Implementation of the complete cross-repository pattern discovery workflow as specified in the FRONTEND_IMPLEMENTATION_GUIDE.md from the dev-nexus backend repository.

**Estimated Total Time:** ~2.5 hours (150 minutes)

## Current State Analysis

### What Already Exists
- ✅ Basic Patterns page using `useCrossRepoPatterns` with accordion UI ([Patterns.tsx:16-109](src/pages/Patterns.tsx#L16-L109))
- ✅ `react-force-graph-2d` already installed and used in ComponentDependencyGraph ([ComponentDependencyGraph.tsx](src/components/components/ComponentDependencyGraph.tsx))
- ✅ MUI Dialog patterns in AddRepositoryDialog ([AddRepositoryDialog.tsx](src/components/repository/AddRepositoryDialog.tsx))
- ✅ A2A client pattern: POST /a2a/execute with skill_id and input ([a2aClient.ts](src/services/a2aClient.ts))
- ✅ React Query mutation patterns with proper cache invalidation ([usePatterns.ts:277-296](src/hooks/usePatterns.ts#L277-L296))

### What Needs Implementation
- ❌ Network graph visualization for patterns
- ❌ Pattern detail modal
- ❌ Pattern suggestion workflow
- ❌ "Suggest as Pattern" feature in ComponentDetection
- ❌ Pattern creation from components

## Implementation Phases

---

## Phase 1: TypeScript Types & API Client Methods
**Estimated Time:** 15 minutes

### File: `src/services/a2aClient.ts`

Add new TypeScript interfaces:

```typescript
// Pattern suggestion input
export interface SuggestPatternFromComponentInput {
  component_name: string;
  repository: string;
  duplication_count: number;
  component_type: string;
  similarity_score: number;
}

// Pattern suggestion response
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

// Pattern creation input
export interface CreatePatternFromComponentInput {
  component_name: string;
  repository: string;
  pattern_name: string;
  pattern_description: string;
  duplication_count: number;
  component_type: string;
}

// Pattern creation response
export interface CreatePatternResponse {
  success: boolean;
  pattern_name: string;
  message: string;
  repositories_affected: string[];
}
```

Add API methods to A2AClient class:

```typescript
/**
 * Suggest creating a pattern from a duplicated component
 */
async suggestPatternFromComponent(input: SuggestPatternFromComponentInput): Promise<PatternSuggestion> {
  const response = await this.client.post('/a2a/execute', {
    skill_id: 'suggest_pattern_from_component',
    input,
  });
  return response.data;
}

/**
 * Create a new cross-repository pattern from a component
 */
async createPatternFromComponent(input: CreatePatternFromComponentInput): Promise<CreatePatternResponse> {
  const response = await this.client.post('/a2a/execute', {
    skill_id: 'create_pattern_from_component',
    input,
  });
  return response.data;
}
```

---

## Phase 2: React Query Hooks
**Estimated Time:** 10 minutes

### File: `src/hooks/usePatterns.ts`

Add two new mutation hooks:

```typescript
/**
 * Mutation hook to suggest pattern from component
 */
export function useSuggestPattern() {
  return useMutation({
    mutationFn: (input: SuggestPatternFromComponentInput) =>
      a2aClient.suggestPatternFromComponent(input),
    onError: (error: Error) => {
      toast.error(`Failed to analyze pattern: ${error.message}`);
    },
  });
}

/**
 * Mutation hook to create pattern from component
 */
export function useCreatePattern() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePatternFromComponentInput) =>
      a2aClient.createPatternFromComponent(input),
    onSuccess: async (data) => {
      // Invalidate cross-repo patterns to refresh pattern list
      await queryClient.invalidateQueries({ queryKey: ['crossRepoPatterns'], exact: false });
      // Refetch immediately for better UX
      await queryClient.refetchQueries({ queryKey: ['crossRepoPatterns'], exact: false });

      toast.success(data.message || 'Pattern created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create pattern: ${error.message}`);
    },
  });
}
```

---

## Phase 3: Pattern Network Graph Component
**Estimated Time:** 30 minutes

### File: `src/components/patterns/PatternNetworkGraph.tsx`

Create new component using react-force-graph-2d:

```typescript
import { useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Box, Paper } from '@mui/material';

interface Pattern {
  pattern_name: string;
  occurrences: number;
  repositories: string[];
}

interface PatternNetworkGraphProps {
  patterns: Pattern[];
  onPatternClick?: (patternName: string) => void;
}

interface GraphNode {
  id: string;
  type: 'pattern' | 'repository';
  name: string;
  size: number;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
}

export default function PatternNetworkGraph({ patterns, onPatternClick }: PatternNetworkGraphProps) {
  const graphRef = useRef<any>();

  // Build graph data
  const graphData = {
    nodes: [] as GraphNode[],
    links: [] as GraphLink[],
  };

  patterns.forEach((pattern) => {
    // Add pattern node (orange, sized by occurrence count)
    graphData.nodes.push({
      id: pattern.pattern_name,
      type: 'pattern',
      name: pattern.pattern_name,
      size: Math.max(8, pattern.occurrences * 3),
      color: '#ff9800', // Orange for patterns
    });

    // Add repository nodes and links
    pattern.repositories.forEach((repo) => {
      // Add repository node if not already exists
      if (!graphData.nodes.find((n) => n.id === repo)) {
        graphData.nodes.push({
          id: repo,
          type: 'repository',
          name: repo,
          size: 6,
          color: '#2196f3', // Blue for repositories
        });
      }

      // Add link from repository to pattern
      graphData.links.push({
        source: repo,
        target: pattern.pattern_name,
      });
    });
  });

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.type === 'pattern' && onPatternClick) {
        onPatternClick(node.name);
      }
    },
    [onPatternClick]
  );

  return (
    <Paper sx={{ p: 2, height: '600px' }}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="name"
        nodeVal="size"
        nodeColor="color"
        linkColor={() => '#cccccc'}
        linkWidth={1}
        onNodeClick={handleNodeClick}
        cooldownTicks={100}
        d3VelocityDecay={0.3}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </Paper>
  );
}
```

---

## Phase 4: Pattern Detail Modal
**Estimated Time:** 15 minutes

### File: `src/components/patterns/PatternDetailModal.tsx`

Create modal for displaying pattern details:

```typescript
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
} from '@mui/material';

interface Pattern {
  pattern_name: string;
  occurrences: number;
  repositories: string[];
  variations: string[];
}

interface PatternDetailModalProps {
  open: boolean;
  pattern: Pattern | null;
  onClose: () => void;
}

export default function PatternDetailModal({ open, pattern, onClose }: PatternDetailModalProps) {
  if (!pattern) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {pattern.pattern_name}
          </Typography>
          <Chip label={`${pattern.occurrences} repos`} color="primary" />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Used in repositories:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {pattern.repositories.map((repo) => (
              <Chip key={repo} label={repo} variant="outlined" />
            ))}
          </Box>
        </Box>

        {pattern.variations.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Variations ({pattern.variations.length}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {pattern.variations.map((variation, idx) => (
                <Chip key={idx} label={variation} size="small" />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

## Phase 5: Pattern Suggestion Modal
**Estimated Time:** 25 minutes

### File: `src/components/patterns/PatternSuggestionModal.tsx`

Create modal for pattern suggestion workflow:

```typescript
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { PatternSuggestion } from '../../services/a2aClient';

interface PatternSuggestionModalProps {
  open: boolean;
  suggestion: PatternSuggestion | null;
  isAnalyzing: boolean;
  onClose: () => void;
  onCreatePattern: (patternName: string, patternDescription: string) => void;
}

export default function PatternSuggestionModal({
  open,
  suggestion,
  isAnalyzing,
  onClose,
  onCreatePattern,
}: PatternSuggestionModalProps) {
  const [patternName, setPatternName] = useState('');
  const [patternDescription, setPatternDescription] = useState('');

  // Update fields when suggestion changes
  useState(() => {
    if (suggestion) {
      setPatternName(suggestion.pattern_name);
      setPatternDescription(suggestion.description);
    }
  });

  const handleCreate = () => {
    onCreatePattern(patternName, patternDescription);
  };

  const getEffortColor = (effort: string): 'success' | 'warning' | 'error' => {
    switch (effort) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Pattern Suggestion</DialogTitle>

      <DialogContent dividers>
        {isAnalyzing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
            <CircularProgress />
            <Typography color="text.secondary">
              Analyzing component for pattern worthiness...
            </Typography>
          </Box>
        ) : suggestion ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Worthiness Score */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="subtitle2">Worthiness Score:</Typography>
                <Chip
                  label={`${suggestion.worthiness_score}/10`}
                  color={suggestion.worthiness_score >= 7 ? 'success' : suggestion.worthiness_score >= 5 ? 'warning' : 'error'}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={suggestion.worthiness_score * 10}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>

            {/* Rationale */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Rationale:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {suggestion.rationale}
              </Typography>
            </Box>

            {/* Pattern Details */}
            <Box>
              <TextField
                fullWidth
                label="Pattern Name"
                value={patternName}
                onChange={(e) => setPatternName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Pattern Description"
                value={patternDescription}
                onChange={(e) => setPatternDescription(e.target.value)}
              />
            </Box>

            {/* Effort and Repositories */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="subtitle2">Estimated Effort:</Typography>
              <Chip
                label={suggestion.estimated_effort.toUpperCase()}
                color={getEffortColor(suggestion.estimated_effort)}
                size="small"
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Affected Repositories ({suggestion.affected_repositories.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {suggestion.affected_repositories.map((repo) => (
                  <Chip key={repo} label={repo} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>

            {/* Benefits */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Benefits:
              </Typography>
              <List dense>
                {suggestion.benefits.map((benefit, idx) => (
                  <ListItem key={idx}>
                    <ListItemText primary={benefit} />
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Implementation Notes */}
            {suggestion.implementation_notes.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Implementation Notes:
                </Typography>
                <List dense>
                  {suggestion.implementation_notes.map((note, idx) => (
                    <ListItem key={idx}>
                      <ListItemText primary={note} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Warning for low worthiness */}
            {suggestion.worthiness_score < 5 && (
              <Alert severity="warning">
                This component may not be a good candidate for pattern extraction. Consider reviewing the rationale before proceeding.
              </Alert>
            )}
          </Box>
        ) : (
          <Typography color="text.secondary">No suggestion available.</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {suggestion && !isAnalyzing && (
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!patternName || !patternDescription}
          >
            Create Pattern
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
```

---

## Phase 6: Enhanced Patterns Page
**Estimated Time:** 20 minutes

### File: `src/pages/Patterns.tsx`

Update Patterns page to add tabs, network graph, and min repos slider:

```typescript
import { useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Slider,
  Paper,
} from '@mui/material';
import { ExpandMore, Code } from '@mui/icons-material';
import { useCrossRepoPatterns } from '../hooks/usePatterns';
import PatternNetworkGraph from '../components/patterns/PatternNetworkGraph';
import PatternDetailModal from '../components/patterns/PatternDetailModal';

export default function Patterns() {
  const [searchTerm, setSearchTerm] = useState('');
  const [minOccurrences, setMinOccurrences] = useState(2);
  const [viewMode, setViewMode] = useState<'network' | 'list'>('network');
  const [selectedPattern, setSelectedPattern] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isError, error } = useCrossRepoPatterns(minOccurrences);

  const filteredPatterns = data?.patterns?.filter(pattern =>
    pattern.pattern_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handlePatternClick = (patternName: string) => {
    const pattern = filteredPatterns.find(p => p.pattern_name === patternName);
    if (pattern) {
      setSelectedPattern(pattern);
      setModalOpen(true);
    }
  };

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load patterns: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cross-Repository Patterns
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Discover patterns used across multiple repositories
      </Typography>

      {/* Controls */}
      <Paper sx={{ p: 2, mt: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Search patterns..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Minimum Repositories: {minOccurrences}
          </Typography>
          <Slider
            value={minOccurrences}
            onChange={(_, value) => setMinOccurrences(value as number)}
            min={2}
            max={10}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
        </Box>

        <Tabs value={viewMode} onChange={(_, value) => setViewMode(value)}>
          <Tab label="Network View" value="network" />
          <Tab label="List View" value="list" />
        </Tabs>
      </Paper>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : viewMode === 'network' ? (
        <PatternNetworkGraph patterns={filteredPatterns} onPatternClick={handlePatternClick} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredPatterns.map((pattern) => (
            <Accordion key={pattern.pattern_name}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Code />
                  <Typography variant="h6">{pattern.pattern_name}</Typography>
                  <Chip
                    label={`${pattern.occurrences} repos`}
                    color="primary"
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="subtitle2" gutterBottom>
                  Used in repositories:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {pattern.repositories.map(repo => (
                    <Chip key={repo} label={repo} variant="outlined" />
                  ))}
                </Box>

                {pattern.variations.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Variations:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {pattern.variations.map((variation, idx) => (
                        <Chip key={idx} label={variation} size="small" />
                      ))}
                    </Box>
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {!isLoading && filteredPatterns.length === 0 && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? 'No patterns match your search' : 'No patterns found'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try a different search term' : 'Analyze repositories to discover patterns'}
          </Typography>
        </Box>
      )}

      <PatternDetailModal
        open={modalOpen}
        pattern={selectedPattern}
        onClose={() => setModalOpen(false)}
      />
    </Box>
  );
}
```

---

## Phase 7: ComponentDetection Integration
**Estimated Time:** 25 minutes

### File: `src/components/components/ComponentDetection.tsx`

Add pattern suggestion workflow to ComponentDetection:

**Changes:**
1. Import new hooks and components
2. Add state for pattern suggestion modal
3. Add "Suggest as Pattern" button for duplicated components with 70%+ similarity
4. Integrate PatternSuggestionModal
5. Add related patterns section

**Key additions:**

```typescript
// At the top, add imports
import { useSuggestPattern, useCreatePattern, useCrossRepoPatterns } from '../../hooks/usePatterns';
import PatternSuggestionModal from '../patterns/PatternSuggestionModal';

// In component, add state and hooks
const suggestMutation = useSuggestPattern();
const createMutation = useCreatePattern();
const { data: patternsData } = useCrossRepoPatterns();
const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
const [currentSuggestion, setCurrentSuggestion] = useState<any>(null);
const [analyzingComponent, setAnalyzingComponent] = useState<string | null>(null);

// Add handler functions
const handleSuggestPattern = async (issue: any) => {
  setAnalyzingComponent(issue.component_name);
  setSuggestionModalOpen(true);

  try {
    const suggestion = await suggestMutation.mutateAsync({
      component_name: issue.component_name,
      repository,
      duplication_count: data?.total_duplicates || 0,
      component_type: issue.issue_type,
      similarity_score: issue.similarity_score,
    });
    setCurrentSuggestion(suggestion);
  } catch (error) {
    setSuggestionModalOpen(false);
  } finally {
    setAnalyzingComponent(null);
  }
};

const handleCreatePattern = async (patternName: string, patternDescription: string) => {
  if (!currentSuggestion) return;

  await createMutation.mutateAsync({
    component_name: analyzingComponent!,
    repository,
    pattern_name: patternName,
    pattern_description: patternDescription,
    duplication_count: data?.total_duplicates || 0,
    component_type: 'duplicated',
  });

  setSuggestionModalOpen(false);
  setCurrentSuggestion(null);
};

// In the card content for each issue, add button for high-similarity duplicates
{issue.issue_type === 'duplicated' && issue.similarity_score >= 0.7 && (
  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
    <Button
      variant="outlined"
      size="small"
      fullWidth
      onClick={() => handleSuggestPattern(issue)}
      disabled={analyzingComponent === issue.component_name}
    >
      {analyzingComponent === issue.component_name ? 'Analyzing...' : 'Suggest as Pattern'}
    </Button>
  </Box>
)}

// Add modal at the end, before closing </Box>
<PatternSuggestionModal
  open={suggestionModalOpen}
  suggestion={currentSuggestion}
  isAnalyzing={suggestMutation.isPending}
  onClose={() => {
    setSuggestionModalOpen(false);
    setCurrentSuggestion(null);
    setAnalyzingComponent(null);
  }}
  onCreatePattern={handleCreatePattern}
/>

// Add related patterns section after filters
<Paper sx={{ p: 3, mt: 2 }}>
  <Typography variant="h6" sx={{ mb: 2 }}>
    Related Cross-Repo Patterns
  </Typography>
  {patternsData?.patterns && patternsData.patterns.length > 0 ? (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {patternsData.patterns.slice(0, 5).map((pattern) => (
        <Chip
          key={pattern.pattern_name}
          label={`${pattern.pattern_name} (${pattern.occurrences})`}
          variant="outlined"
          color="primary"
        />
      ))}
    </Box>
  ) : (
    <Typography variant="body2" color="text.secondary">
      No cross-repository patterns found yet.
    </Typography>
  )}
</Paper>
```

---

## Phase 8: Dashboard Updates
**Estimated Time:** 0 minutes (Already complete)

The Dashboard.tsx already displays pattern count from `useCrossRepoPatterns` hook. No changes needed.

---

## Phase 9: Barrel Export File
**Estimated Time:** 2 minutes

### File: `src/components/patterns/index.ts`

Create barrel export for pattern components:

```typescript
export { default as PatternNetworkGraph } from './PatternNetworkGraph';
export { default as PatternDetailModal } from './PatternDetailModal';
export { default as PatternSuggestionModal } from './PatternSuggestionModal';
```

---

## Testing Strategy

### Unit Testing (Per Component)
1. **PatternNetworkGraph**: Verify graph data structure, node/link generation, click handlers
2. **PatternDetailModal**: Verify rendering with pattern data, close handler
3. **PatternSuggestionModal**: Verify form validation, create handler, worthiness display
4. **React Query hooks**: Verify mutation calls, cache invalidation

### Integration Testing
1. **ComponentDetection → Pattern Suggestion**: Click "Suggest as Pattern" → modal opens → form filled → pattern created → cache refreshed
2. **Patterns Page**: Switch tabs → filter by search → adjust min repos slider → click pattern in graph → modal opens
3. **End-to-end flow**: Scan components → detect duplicates → suggest pattern → create pattern → verify in Patterns page

### Manual Testing Checklist
- [ ] ComponentDetection shows "Suggest as Pattern" button for 70%+ similarity duplicates
- [ ] Clicking button opens PatternSuggestionModal with loading state
- [ ] Suggestion displays worthiness score, rationale, benefits, implementation notes
- [ ] Can edit pattern name and description
- [ ] Creating pattern shows toast notification
- [ ] Patterns page refreshes to show new pattern
- [ ] Network graph displays patterns (orange) and repositories (blue)
- [ ] Clicking pattern node opens detail modal
- [ ] List view shows all patterns with filters
- [ ] Min repos slider filters patterns correctly
- [ ] Search term filters patterns in both views

---

## Implementation Order

**Recommended sequence:**
1. Phase 1 (Types & API) - Foundation
2. Phase 2 (Hooks) - Data layer
3. Phase 4 (Detail Modal) - Simple component first
4. Phase 3 (Network Graph) - Complex visualization
5. Phase 5 (Suggestion Modal) - Complex form
6. Phase 9 (Barrel Export) - Quick win
7. Phase 6 (Enhanced Patterns Page) - Integration
8. Phase 7 (ComponentDetection) - Final integration

---

## Risk Assessment

### Low Risk
- Types and API methods (standard pattern)
- React Query hooks (existing pattern established)
- Barrel export file (trivial)

### Medium Risk
- PatternDetailModal (straightforward MUI Dialog)
- PatternSuggestionModal (complex form but clear requirements)

### Higher Risk
- PatternNetworkGraph (complex D3/force-graph integration)
  - Mitigation: Reuse existing ComponentDependencyGraph pattern
- Enhanced Patterns Page (multiple features)
  - Mitigation: Incremental implementation with tabs first
- ComponentDetection integration (multiple state interactions)
  - Mitigation: Careful state management with clear flow

---

## Success Criteria

✅ All components render without errors
✅ Network graph displays patterns and repositories correctly
✅ Pattern suggestion workflow completes successfully
✅ Cache invalidation triggers UI updates
✅ All modals open/close correctly
✅ No TypeScript errors
✅ No console warnings
✅ Toast notifications appear on success/error
✅ All filters work as expected
✅ Manual testing checklist 100% complete

---

## Future Enhancements (Not in Scope)

- Pattern editing/deletion
- Pattern versioning
- Pattern analytics dashboard
- Export patterns to JSON
- Batch pattern operations
- Pattern templates library

---

## Notes

- All components follow existing codebase patterns
- MUI components with sx prop styling (consistent with codebase)
- React Query mutations with proper cache invalidation (per LESSONS_LEARNED.md)
- TypeScript types mirror backend Pydantic models
- No new dependencies required (react-force-graph-2d already installed)
