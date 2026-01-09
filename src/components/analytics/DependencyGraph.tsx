import { useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  CircularProgress,
  Alert,
  Typography,
  Chip,
} from '@mui/material';
import ForceGraph2D from 'react-force-graph-2d';
import { ComponentDependency } from '../../services/a2aClient';
import { detectCircularDependencies } from '../../utils/circularDependencyDetector';

interface DependencyGraphProps {
  dependencies: ComponentDependency[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onNodeClick?: (componentName: string) => void;
  height?: number;
}

interface GraphNode {
  id: string;
  name: string;
  size: number;
  color: string;
  type: 'component' | 'circular';
  isInCycle: boolean;
}

interface GraphLink {
  source: string;
  target: string;
  strength: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function DependencyGraph({
  dependencies,
  isLoading = false,
  isError = false,
  error = null,
  onNodeClick,
  height = 600,
}: DependencyGraphProps) {
  // Detect circular dependencies
  const circularDependencies = useMemo(
    () => detectCircularDependencies(dependencies),
    [dependencies]
  );

  // Build graph data from dependencies
  const graphData: GraphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const cyclicComponents = new Set<string>();

    // Mark all components in cycles
    circularDependencies.forEach(cycle => {
      cycle.components.forEach(component => {
        cyclicComponents.add(component);
      });
    });

    // Create nodes
    const componentScores = new Map<string, number>();

    // First pass: collect all components and their dependency counts
    dependencies.forEach(dep => {
      if (!componentScores.has(dep.source_component)) {
        componentScores.set(dep.source_component, 0);
      }
      if (!componentScores.has(dep.target_component)) {
        componentScores.set(dep.target_component, 0);
      }
      componentScores.set(dep.source_component, (componentScores.get(dep.source_component) || 0) + 1);
    });

    // Create nodes with sizes based on dependency count
    componentScores.forEach((count, component) => {
      const isInCycle = cyclicComponents.has(component);
      const size = Math.max(3, Math.min(10, count + 2)); // Size between 3-10
      const color = isInCycle ? '#ff5252' : '#4caf50'; // Red if in cycle, green otherwise

      nodes.push({
        id: component,
        name: component,
        size,
        color,
        type: isInCycle ? 'circular' : 'component',
        isInCycle,
      });
    });

    // Create links
    dependencies.forEach(dep => {
      links.push({
        source: dep.source_component,
        target: dep.target_component,
        strength: dep.strength || 0.5,
      });
    });

    return { nodes, links };
  }, [dependencies, circularDependencies]);

  const handleNodeClick = useCallback(
    (node: any) => {
      if (onNodeClick && node.type !== 'location') {
        onNodeClick(node.name);
      }
    },
    [onNodeClick]
  );

  if (isLoading) {
    return (
      <Paper sx={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load dependencies: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <Paper sx={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="textSecondary">No dependencies found</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Legend */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: '#4caf50',
            }}
          />
          <Typography variant="body2">Component with no cycles</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: '#ff5252',
            }}
          />
          <Typography variant="body2">Component in circular dependency</Typography>
        </Box>
        <Chip
          size="small"
          label={`${graphData.nodes.length} components, ${circularDependencies.length} cycles`}
          color="primary"
        />
      </Paper>

      {/* Graph */}
      <Paper sx={{ position: 'relative', height, overflow: 'hidden' }}>
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="name"
          nodeVal="size"
          nodeColor="color"
          linkColor={() => '#cccccc'}
          linkWidth={1}
          linkDirectionalArrowLength={3}
          linkDirectionalArrowRelPos={1}
          onNodeClick={handleNodeClick}
          cooldownTicks={100}
          d3VelocityDecay={0.3}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      </Paper>
    </Box>
  );
}
