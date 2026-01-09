import { useState } from 'react';
import { Box, Container, Typography, Tabs, Tab, Paper } from '@mui/material';
import DashboardOverview from './analytics/DashboardOverview';
import DependenciesAnalysis from './analytics/DependenciesAnalysis';
import PatternAnalytics from './analytics/PatternAnalytics';
import ComponentAnalytics from './analytics/ComponentAnalytics';
import ActivityAnalytics from './analytics/ActivityAnalytics';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Analytics() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Analyze component dependencies, patterns, and system metrics across repositories
        </Typography>

        <Paper sx={{ mt: 3, mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="analytics tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Dashboard" id="analytics-tab-0" aria-controls="analytics-tabpanel-0" />
            <Tab label="Component Dependencies" id="analytics-tab-1" aria-controls="analytics-tabpanel-1" />
            <Tab label="Pattern Analytics" id="analytics-tab-2" aria-controls="analytics-tabpanel-2" />
            <Tab label="Component Analytics" id="analytics-tab-3" aria-controls="analytics-tabpanel-3" />
            <Tab label="Activity Analytics" id="analytics-tab-4" aria-controls="analytics-tabpanel-4" />
          </Tabs>
        </Paper>

        <TabPanel value={tabValue} index={0}>
          <DashboardOverview />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <DependenciesAnalysis />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <PatternAnalytics />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <ComponentAnalytics />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <ActivityAnalytics />
        </TabPanel>
      </Box>
    </Container>
  );
}
