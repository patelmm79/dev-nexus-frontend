import { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Autocomplete,
  CircularProgress,
  Alert,
  Card,
  CardHeader,
} from '@mui/material';
import {
  Extension as ComponentIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useRepositories } from '../hooks/usePatterns';
import ComponentDetection from '../components/components/ComponentDetection';
import ScoringBreakdown from '../components/components/ScoringBreakdown';
import ConsolidationPlan from '../components/components/ConsolidationPlan';
import ComponentDependencyGraph from '../components/components/ComponentDependencyGraph';

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
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Components() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedRepository, setSelectedRepository] = useState<string | null>(null);

  const { data: repositoriesData, isLoading: repositoriesLoading } = useRepositories();

  const repositoryList = useMemo(() => {
    return repositoriesData?.repositories?.map((repo) => repo.name) || [];
  }, [repositoriesData]);

  if (repositoriesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!repositoriesData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load repositories. Please try again.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ComponentIcon sx={{ fontSize: 32, color: 'white' }} />
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                Component Analysis
              </Typography>
            </Box>
          }
          subheader={
            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Analyze, visualize, and plan component consolidation across your repositories
            </Typography>
          }
        />
      </Card>

      {/* Repository Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
          <Autocomplete
            options={repositoryList}
            value={selectedRepository}
            onChange={(_, newValue) => setSelectedRepository(newValue)}
            sx={{ flex: 1, minWidth: 300 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Repository"
                placeholder="Choose a repository to analyze"
                helperText={
                  repositoryList.length > 0
                    ? `${repositoryList.length} repositories available`
                    : 'No repositories available'
                }
              />
            )}
          />
        </Box>

        {selectedRepository && (
          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'success.main' }}>
            ✓ Repository selected: <strong>{selectedRepository}</strong>
          </Typography>
        )}

        {!selectedRepository && (
          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
            Select a repository to view component analysis
          </Typography>
        )}
      </Paper>

      {selectedRepository ? (
        <>
          {/* Tabs Navigation */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              aria-label="component analysis tabs"
            >
              <Tab
                label="Component Detection"
                id="tab-0"
                aria-controls="tabpanel-0"
              />
              <Tab
                label="Scoring Breakdown"
                id="tab-1"
                aria-controls="tabpanel-1"
              />
              <Tab
                label="Consolidation Plan"
                id="tab-2"
                aria-controls="tabpanel-2"
              />
              <Tab
                label="Dependency Graph"
                id="tab-3"
                aria-controls="tabpanel-3"
              />
            </Tabs>

            {/* Tab Panels */}
            <TabPanel value={tabValue} index={0}>
              <ComponentDetection repository={selectedRepository} />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <ScoringBreakdown repository={selectedRepository} />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <ConsolidationPlan repository={selectedRepository} />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <ComponentDependencyGraph repository={selectedRepository} />
            </TabPanel>
          </Paper>
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CategoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Select a repository to begin
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Choose a repository from the dropdown above to view component analysis, scoring, and consolidation recommendations.
          </Typography>
        </Paper>
      )}
    </Container>
  );
}
