import { Typography, Box } from '@mui/material';
import {
  CheckCircle,
  Folder,
  Category,
  Hub,
} from '@mui/icons-material';
import { useHealth, useRepositories, useCrossRepoPatterns, useExternalAgents } from '../hooks/usePatterns';
import StatCard from '../components/dashboard/StatCard';

export default function Dashboard() {
  const { data: health, isLoading: healthLoading } = useHealth();
  const { data: repos, isLoading: reposLoading } = useRepositories();
  const { data: patterns, isLoading: patternsLoading } = useCrossRepoPatterns();
  const { data: agents, isLoading: agentsLoading } = useExternalAgents();

  const healthyAgents = Array.isArray(agents?.agents)
    ? agents!.agents.filter(a => a.status === 'healthy').length
    : 0;

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
          value={repos?.total_count || 0}
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
    </Box>
  );
}
