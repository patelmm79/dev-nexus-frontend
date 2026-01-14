import { Typography, Box, Button, Card, CardContent } from '@mui/material';
import {
  CheckCircle,
  Folder,
  Category,
  Hub,
  TrendingUp,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  PlayArrow as WorkflowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useHealth, useRepositories, useCrossRepoPatterns, useExternalAgents } from '../hooks/usePatterns';
import StatCard from '../components/dashboard/StatCard';
import RecentActivity from '../components/agents/RecentActivity';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: health, isLoading: healthLoading } = useHealth();
  const { data: repos, isLoading: reposLoading } = useRepositories();
  const { data: patterns, isLoading: patternsLoading } = useCrossRepoPatterns();
  const { data: agents, isLoading: agentsLoading } = useExternalAgents();

  const healthyAgents = Array.isArray(agents?.agents)
    ? agents!.agents.filter(a => a.status === 'healthy').length
    : 0;

  // Calculate unique pattern variations
  const uniqueVariations = new Set(
    patterns?.patterns?.flatMap(p => p.variations) || []
  ).size;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Pattern Discovery Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Visual exploration of code patterns across repositories
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mt: 3 }}>
        <StatCard
          title="Service Status"
          value={health?.status || 'Unknown'}
          icon={<CheckCircle />}
          color="success"
          loading={healthLoading}
        />

        <StatCard
          title="Repositories"
          value={repos?.total_repositories || repos?.total_count || 0}
          icon={<Folder />}
          color="primary"
          loading={reposLoading}
        />

        <StatCard
          title="Cross-Repo Patterns"
          value={patterns?.total_patterns || 0}
          icon={<Category />}
          color="secondary"
          loading={patternsLoading}
        />

        <StatCard
          title="Connected Agents"
          value={`${healthyAgents}/${Array.isArray(agents?.agents) ? agents!.agents.length : 0}`}
          icon={<Hub />}
          color="info"
          loading={agentsLoading}
        />

        <StatCard
          title="Pattern Variations"
          value={uniqueVariations}
          icon={<TrendingUp />}
          color="warning"
          loading={patternsLoading}
        />
      </Box>

      <Box
        sx={{
          p: 3,
          mt: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Welcome to Dev Nexus
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Navigate using the sidebar to explore repositories, patterns, deployments, and more.
        </Typography>
      </Box>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<VisibilityIcon />}
              onClick={() => navigate('/patterns')}
            >
              Explore Patterns
            </Button>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/components')}
            >
              Component Detection
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/repositories')}
            >
              Manage Repositories
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3, backgroundColor: 'action.hover' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <WorkflowIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6" gutterBottom sx={{ m: 0 }}>
                Repository Initialization
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Automate pattern extraction and dependency discovery across multiple repositories
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<WorkflowIcon />}
            onClick={() => navigate('/repositories/initialize')}
          >
            Start Workflow
          </Button>
        </CardContent>
      </Card>

      <Box sx={{ mt: 4 }}>
        <RecentActivity defaultLimit={10} />
      </Box>
    </Box>
  );
}
