import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Typography,
  Paper,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import { useRepositories } from '../../hooks/usePatterns';
import { useComponentDependencies } from '../../hooks/useDependencyAnalysis';
import {
  detectCircularDependencies,
  getCircularDependencyStats,
} from '../../utils/circularDependencyDetector';
import DependencyGraph from '../../components/analytics/DependencyGraph';
import DependencyList from '../../components/analytics/DependencyList';
import CircularDependencyAlerts from '../../components/analytics/CircularDependencyAlerts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`deps-tabpanel-${index}`}
      aria-labelledby={`deps-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export default function DependenciesAnalysis() {
  const [selectedRepository, setSelectedRepository] = useState<string>('');
  const [analysisDepth, setAnalysisDepth] = useState<number>(3);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  // Fetch repositories
  const { data: repositoriesData, isLoading: isLoadingRepos } = useRepositories();

  // Fetch dependencies for selected repository
  const {
    data: dependenciesData,
    isLoading: isLoadingDeps,
    isError,
    error,
  } = useComponentDependencies(selectedRepository, undefined, analysisDepth);

  // Initialize repository selection
  if (selectedRepository === '' && repositoriesData?.repositories && repositoriesData.repositories.length > 0) {
    setSelectedRepository(repositoriesData.repositories[0].name);
  }

  // Detect circular dependencies
  const dependencies =
    dependenciesData && 'dependencies' in dependenciesData && dependenciesData.dependencies
      ? dependenciesData.dependencies
      : [];

  const circularDependencies = detectCircularDependencies(dependencies);
  const circularStats = getCircularDependencyStats(circularDependencies);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Controls */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Repository</InputLabel>
            <Select
              value={selectedRepository}
              label="Repository"
              onChange={(e) => setSelectedRepository(e.target.value)}
              disabled={isLoadingRepos}
            >
              {repositoriesData?.repositories?.map((repo) => (
                <MenuItem key={repo.name} value={repo.name}>
                  {repo.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Analysis Depth: {analysisDepth}
            </Typography>
            <Slider
              value={analysisDepth}
              onChange={(_, value) => setAnalysisDepth(value as number)}
              min={1}
              max={5}
              step={1}
              marks
              valueLabelDisplay="auto"
              disabled={isLoadingDeps}
            />
          </Box>
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Total Dependencies
            </Typography>
            <Typography variant="h5">{dependencies.length}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Circular Dependencies
            </Typography>
            <Typography variant="h5">{circularStats.totalCycles}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Critical Cycles
            </Typography>
            <Typography variant="h5" sx={{ color: circularStats.criticalCycles > 0 ? 'error.main' : 'success.main' }}>
              {circularStats.criticalCycles}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Affected Components
            </Typography>
            <Typography variant="h5">{circularStats.affectedComponents.size}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Circular Dependency Alerts */}
      {circularDependencies.length > 0 && (
        <CircularDependencyAlerts
          cycles={circularDependencies}
          onComponentClick={(comp) => console.log('Component clicked:', comp)}
        />
      )}

      {/* Main Content */}
      {isLoadingDeps ? (
        <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Paper>
      ) : isError ? (
        <Alert severity="error">
          Failed to load dependencies: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      ) : dependencies.length === 0 ? (
        <Alert severity="info">No dependencies found for the selected repository and depth.</Alert>
      ) : (
        <Box>
          {/* View Tabs */}
          <Paper sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={viewMode === 'graph' ? 0 : 1}
              onChange={(_, newValue) => setViewMode(newValue === 0 ? 'graph' : 'list')}
              aria-label="dependency view"
            >
              <Tab label="Graph View" id="deps-tab-0" aria-controls="deps-tabpanel-0" />
              <Tab label="List View" id="deps-tab-1" aria-controls="deps-tabpanel-1" />
            </Tabs>
          </Paper>

          {/* Graph View */}
          <TabPanel value={viewMode === 'graph' ? 0 : 1} index={0}>
            <DependencyGraph
              dependencies={dependencies}
              isLoading={isLoadingDeps}
              isError={isError}
              error={error}
              onNodeClick={(comp) => console.log('Node clicked:', comp)}
              height={600}
            />
          </TabPanel>

          {/* List View */}
          <TabPanel value={viewMode === 'graph' ? 0 : 1} index={1}>
            <DependencyList
              dependencies={dependencies}
              onComponentClick={(comp) => console.log('Component clicked:', comp)}
            />
          </TabPanel>
        </Box>
      )}
    </Box>
  );
}
