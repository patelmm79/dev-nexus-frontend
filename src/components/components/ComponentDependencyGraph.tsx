import { useRef, useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Typography,
  Paper,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import ForceGraph2D from 'react-force-graph-2d';
import { useAnalyzeComponentCentrality } from '../../hooks/useComponentSensibility';

interface ComponentDependencyGraphProps {
  repository: string;
}

export default function ComponentDependencyGraph({ repository }: ComponentDependencyGraphProps) {
  const graphRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>(null);

  const { data, isLoading, isError, error } = useAnalyzeComponentCentrality(repository);

  const getScoreColor = (score: number): string => {
    if (score >= 0.9) return '#4caf50';
    if (score >= 0.8) return '#8bc34a';
    if (score >= 0.7) return '#ffc107';
    if (score >= 0.6) return '#ff9800';
    return '#f44336';
  };

  useEffect(() => {
    if (!data?.components) return;

    const nodes = data.components.map((component) => ({
      id: component.component_name,
      name: component.component_name,
      location: component.location,
      score: component.overall_score,
      val: Math.max(5, component.centrality_score * 50),
      color: getScoreColor(component.overall_score),
    }));

    const links: any[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const scoreDiff = Math.abs(nodes[i].score - nodes[j].score);
        if (scoreDiff < 0.3) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            value: 1 - scoreDiff,
          });
        }
      }
    }

    setGraphData({ nodes, links });
  }, [data?.components]);

  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(1.2);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(0.8);
    }
  };

  const handleReset = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 20);
    }
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load dependency graph: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  if (!data?.success || !graphData) {
    return <Alert severity="error">Graph generation failed. Please try again.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<ZoomInIcon />}
            onClick={handleZoomIn}
            variant="outlined"
            size="small"
          >
            Zoom In
          </Button>
          <Button
            startIcon={<ZoomOutIcon />}
            onClick={handleZoomOut}
            variant="outlined"
            size="small"
          >
            Zoom Out
          </Button>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleReset}
            variant="outlined"
            size="small"
          >
            Reset View
          </Button>
        </Stack>

        <Box sx={{ flex: 1 }} />

        <Typography variant="caption" color="textSecondary">
          {graphData.nodes.length} components, {graphData.links.length} relationships
        </Typography>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Score Legend
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#4caf50' }} />
            <Typography variant="caption">A (0.90-1.00)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#8bc34a' }} />
            <Typography variant="caption">B (0.80-0.89)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#ffc107' }} />
            <Typography variant="caption">C (0.70-0.79)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#ff9800' }} />
            <Typography variant="caption">D (0.60-0.69)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#f44336' }} />
            <Typography variant="caption">F (&lt;0.60)</Typography>
          </Box>
        </Stack>
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
          Node size represents centrality score. Connections show similar-scoring components.
        </Typography>
      </Paper>

      <Card sx={{ height: 600 }}>
        {graphData && (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeId="id"
            nodeVal="val"
            nodeColor="color"
            nodeLabel={(node) => `${node.name}\nScore: ${(node.score * 100).toFixed(0)}%`}
            onNodeClick={handleNodeClick}
            linkWidth={() => 2}
            linkColor={() => 'rgba(100, 100, 100, 0.3)'}
            width={typeof window !== 'undefined' ? window.innerWidth - 60 : 1200}
            height={600}
            backgroundColor="transparent"
          />
        )}
      </Card>

      {selectedNode && (
        <Card>
          <CardHeader title="Selected Component Details" />
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Component Name
                </Typography>
                <Typography variant="body1">{selectedNode.name}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Location
                </Typography>
                <Typography variant="body1">{selectedNode.location}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Overall Score
                </Typography>
                <Chip
                  label={`${(selectedNode.score * 100).toFixed(0)}%`}
                  sx={{
                    backgroundColor: getScoreColor(selectedNode.score),
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Centrality Score
                </Typography>
                <Typography variant="body2">
                  {(selectedNode.val / 50 * 100).toFixed(0)}% (Node size indicator)
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Graph Information
        </Typography>
        <Typography variant="body2" color="textSecondary">
          This force-directed graph visualizes component relationships based on centrality scores.
          Components with similar scores are connected, showing potential consolidation candidates.
          Click on a node to view detailed information.
        </Typography>
      </Paper>
    </Box>
  );
}
