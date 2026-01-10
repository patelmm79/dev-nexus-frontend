import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  CircularProgress,
  Alert,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import ForceGraph2D from 'react-force-graph-2d';
import { useListComponents, useAnalyzeComponentCentralityMutation } from '../../hooks/useComponentSensibility';
import ComponentCentralityDetail from './ComponentCentralityDetail';

interface ComponentDependencyGraphProps {
  repository: string;
}

interface GraphNode {
  id: string;
  name: string;
  size: number;
  color: string;
  centrality_score?: number;
  current_location?: string;
  best_location?: string;
}

interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Component Centrality Graph
 * Visualizes all components in a repository with their centrality scores.
 * Node size represents centrality (larger = more central).
 * Node color shows if component is in optimal location (green) or misplaced (orange).
 * Click on a node to see detailed centrality analysis.
 */
export default function ComponentDependencyGraph({ repository }: ComponentDependencyGraphProps) {
  const [selectedComponent, setSelectedComponent] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [analyzedComponents, setAnalyzedComponents] = useState<Map<string, any>>(new Map());
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null);

  const queryClient = useQueryClient();
  // Listen for refresh signals from ComponentDetection
  const refreshSignal = queryClient.getQueryData(['componentAnalysisRefresh']);

  const { data: componentsData, isLoading: isLoadingComponents, isError, error } = useListComponents(repository);
  const centralizeMutation = useAnalyzeComponentCentralityMutation();

  // Log when analysis completes
  const handleAnalysisComplete = useCallback(() => {
    if (analysisStartTime) {
      const duration = Date.now() - analysisStartTime;
      console.log(`✓ Centrality analysis completed for "${repository}" in ${(duration / 1000).toFixed(2)}s`);
      setAnalysisStartTime(null);
    }
  }, [analysisStartTime, repository]);

  // Handle refresh button click
  const handleRefreshAnalysis = useCallback(() => {
    setAnalysisStartTime(Date.now());
    console.log(`🔄 Starting centrality analysis for "${repository}"...`);
    // Reset analyzed components to force fresh analysis
    setAnalyzedComponents(new Map());
  }, [repository]);

  // Reset analyzed components when refresh is triggered
  useEffect(() => {
    if (refreshSignal) {
      console.log('🔄 ComponentDependencyGraph: Refresh signal received, resetting analyzed components', refreshSignal);
      setAnalyzedComponents(new Map());
    }
  }, [refreshSignal]);

  // Analyze components one at a time to get centrality data
  useEffect(() => {
    if (!componentsData?.components || componentsData.components.length === 0) {
      return;
    }

    // Create a set of component names to analyze
    const componentNames = new Set(componentsData.components.map(c => c.name));

    // Check if there are new components to analyze
    const hasNewComponents = Array.from(componentNames).some(name => !analyzedComponents.has(name));

    console.log('📊 Centrality analysis effect running:', {
      componentsCount: componentsData.components.length,
      analyzedCount: analyzedComponents.size,
      hasNewComponents,
    });

    if (!hasNewComponents) {
      console.log('✓ All components already analyzed, skipping');
      return;
    }

    console.log('🔍 Starting centrality analysis for', Array.from(componentNames).filter(name => !analyzedComponents.has(name)));

    // Analyze each component for centrality
    componentsData.components.forEach((component) => {
      // Skip if already analyzed
      if (analyzedComponents.has(component.name)) {
        return;
      }

      // Trigger analysis for this component
      centralizeMutation.mutate(
        {
          component_name: component.name,
          current_location: repository,
        },
        {
          onSuccess: (data) => {
            if (data.success) {
              setAnalyzedComponents((prev) => new Map(prev).set(component.name, data));
            }
          },
        }
      );
    });
  }, [componentsData?.components?.length, repository, analyzedComponents.size]);

  // Build graph data from analyzed components
  const buildGraphData = useCallback((): GraphData => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    if (!componentsData?.components) {
      return { nodes, links };
    }

    componentsData.components.forEach((component) => {
      const analysis = analyzedComponents.get(component.name);

      // Determine color based on optimal location
      let color = '#9e9e9e'; // Gray default while loading
      let centralityScore = 5; // Default size while loading
      let bestLocation = repository;

      if (analysis?.success) {
        centralityScore = analysis.best_location === repository ? 8 : 5;
        bestLocation = analysis.best_location;
        color = analysis.best_location === repository ? '#4caf50' : '#ff9800'; // Green if optimal, orange if not
      }

      nodes.push({
        id: component.name,
        name: component.name,
        size: centralityScore,
        color,
        centrality_score: centralityScore,
        current_location: repository,
        best_location: bestLocation,
      });

      // Create links between misplaced components and their optimal locations
      // This helps visualize consolidation opportunities
      if (analysis?.success && analysis.best_location !== repository) {
        // Create a virtual "target location" node if it doesn't exist
        if (!nodes.find((n) => n.id === `location_${analysis.best_location}`)) {
          nodes.push({
            id: `location_${analysis.best_location}`,
            name: analysis.best_location,
            size: 4,
            color: '#2196f3', // Blue for target locations
          });
        }
        // Link misplaced component to its target location
        links.push({
          source: component.name,
          target: `location_${analysis.best_location}`,
        });
      }
    });

    return { nodes, links };
  }, [componentsData?.components, analyzedComponents, repository]);

  const graphData = buildGraphData();
  const isAnalyzing = centralizeMutation.isPending || analyzedComponents.size < (componentsData?.components?.length || 0);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      // Only allow clicking on component nodes, not location nodes
      if (!node.id.startsWith('location_')) {
        setSelectedComponent({
          name: node.name,
          current_location: node.current_location,
          best_location: node.best_location,
        });
        setDetailOpen(true);
      }
    },
    []
  );

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load components: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  // Call analysis complete handler when all components are analyzed
  useEffect(() => {
    if (!isAnalyzing && analyzedComponents.size > 0) {
      handleAnalysisComplete();
    }
  }, [isAnalyzing, analyzedComponents.size, handleAnalysisComplete]);

  return (
    <Box>
      {/* Controls and Legend */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Component Centrality Analysis
          </Typography>
          <Tooltip title="Refresh centrality analysis">
            <IconButton
              onClick={handleRefreshAnalysis}
              disabled={isAnalyzing}
              color="primary"
              size="small"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#4caf50',
              }}
            />
            <Typography variant="body2">Component in optimal location</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: '#ff9800',
              }}
            />
            <Typography variant="body2">Component should be consolidated</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#2196f3',
              }}
            />
            <Typography variant="body2">Target consolidation location</Typography>
          </Box>
          <Chip
            size="small"
            label={`${componentsData?.total_count || 0} components, ${analyzedComponents.size} analyzed`}
            color="primary"
          />
        </Box>
      </Paper>

      {/* Graph */}
      <Paper sx={{ position: 'relative', height: '600px', overflow: 'hidden' }}>
        {isLoadingComponents ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <CircularProgress />
          </Box>
        ) : graphData.nodes.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <Typography color="textSecondary">No components found in this repository</Typography>
          </Box>
        ) : (
          <>
            {isAnalyzing && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  zIndex: 10,
                }}
              >
                <CircularProgress size={20} />
                <Typography variant="body2">
                  Analyzing components... ({analyzedComponents.size}/{componentsData?.total_count})
                </Typography>
              </Box>
            )}
            <ForceGraph2D
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
          </>
        )}
      </Paper>

      {/* Component Detail Modal */}
      {selectedComponent && (
        <ComponentCentralityDetail
          open={detailOpen}
          componentName={selectedComponent.name}
          currentLocation={selectedComponent.current_location}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </Box>
  );
}
