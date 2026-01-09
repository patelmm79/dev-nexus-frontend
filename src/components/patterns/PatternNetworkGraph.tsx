import { useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Paper } from '@mui/material';
import { CrossRepoPattern } from '../../services/a2aClient';

interface PatternNetworkGraphProps {
  patterns: CrossRepoPattern[];
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

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function PatternNetworkGraph({ patterns, onPatternClick }: PatternNetworkGraphProps) {
  const graphRef = useRef<any>(null);

  // Build graph data
  const graphData: GraphData = {
    nodes: [],
    links: [],
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
