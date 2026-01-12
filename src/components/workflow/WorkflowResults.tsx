import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import DependencyVerification, { Dependency } from './DependencyVerification';
import ResultsMetadataView from './ResultsMetadataView';
import { WorkflowStatusResponse, WorkflowMetadata } from '../../services/a2aClient';

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
      id={`workflow-tabpanel-${index}`}
      aria-labelledby={`workflow-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export interface WorkflowResultsProps {
  workflowStatus?: WorkflowStatusResponse;
  metadata?: WorkflowMetadata[];
  dependencies?: Dependency[];
  onStartNew: () => void;
  onUpdateDependencies?: (deps: Dependency[]) => void;
  isLoading?: boolean;
}

export default function WorkflowResults({
  workflowStatus,
  metadata = [],
  dependencies = [],
  onStartNew,
  onUpdateDependencies,
  isLoading = false,
}: WorkflowResultsProps) {
  const [currentTab, setCurrentTab] = useState(0);
  const navigate = useNavigate();

  const totalRepositories = workflowStatus?.repositories.length || 0;
  const completedRepositories =
    workflowStatus?.repositories.filter(
      (r) => r.status === 'completed'
    ).length || 0;
  const totalPatterns = workflowStatus?.repositories.reduce(
    (sum, r) => sum + (r.patterns_extracted || 0),
    0
  ) || 0;
  const totalDependencies = workflowStatus?.repositories.reduce(
    (sum, r) => sum + (r.dependencies_discovered || 0),
    0
  ) || 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Repositories Analyzed
            </Typography>
            <Typography variant="h5">{completedRepositories}/{totalRepositories}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Patterns Extracted
            </Typography>
            <Typography variant="h5">{totalPatterns}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Dependencies Found
            </Typography>
            <Typography variant="h5">{totalDependencies}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="textSecondary" gutterBottom>
              Success Rate
            </Typography>
            <Typography variant="h5">
              {totalRepositories > 0
                ? Math.round((completedRepositories / totalRepositories) * 100)
                : 0}%
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Card>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          aria-label="workflow results tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Summary" id="workflow-tab-0" aria-controls="workflow-tabpanel-0" />
          <Tab label="Dependencies" id="workflow-tab-1" aria-controls="workflow-tabpanel-1" />
          <Tab label="Metadata" id="workflow-tab-2" aria-controls="workflow-tabpanel-2" />
        </Tabs>

        {/* Summary Tab */}
        <TabPanel value={currentTab} index={0}>
          <CardContent sx={{ pt: 0 }}>
            <Stack spacing={2}>
              <Alert severity="success">
                Workflow completed successfully! Review the results below and
                proceed to the next step.
              </Alert>

              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Next Steps
                </Typography>
                <Stack spacing={1}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/analytics')}
                  >
                    📊 View Analytics
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/components')}
                  >
                    🔍 Analyze Components
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={onStartNew}
                    disabled={isLoading}
                  >
                    🔄 Start New Workflow
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </TabPanel>

        {/* Dependencies Tab */}
        <TabPanel value={currentTab} index={1}>
          <DependencyVerification
            dependencies={dependencies}
            onUpdate={onUpdateDependencies}
            isLoading={isLoading}
          />
        </TabPanel>

        {/* Metadata Tab */}
        <TabPanel value={currentTab} index={2}>
          <ResultsMetadataView metadata={metadata} />
        </TabPanel>
      </Card>
    </Box>
  );
}
