import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useRecommendConsolidationPlan } from '../../hooks/useComponentSensibility';

interface ConsolidationPlanProps {
  repository: string;
}

const getEffortColor = (effort: 'low' | 'medium' | 'high'): 'success' | 'warning' | 'error' => {
  switch (effort) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'error';
  }
};

const getImpactColor = (impact: 'low' | 'medium' | 'high'): 'info' | 'warning' | 'error' => {
  switch (impact) {
    case 'low':
      return 'info';
    case 'medium':
      return 'warning';
    case 'high':
      return 'error';
  }
};

const getActionColor = (action: string): 'default' | 'primary' | 'secondary' => {
  switch (action) {
    case 'merge':
      return 'primary';
    case 'move':
      return 'secondary';
    default:
      return 'default';
  }
};

export default function ConsolidationPlan({ repository }: ConsolidationPlanProps) {
  const { data, isLoading, isError, error } = useRecommendConsolidationPlan(repository);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load consolidation plan: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  if (!data?.success) {
    return <Alert severity="error">Plan generation failed. Please try again.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <ScheduleIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography color="textSecondary" gutterBottom>
              Total Effort
            </Typography>
            <Typography variant="h5">{data.total_effort_hours}h</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
            <Typography color="textSecondary" gutterBottom>
              Total Phases
            </Typography>
            <Typography variant="h5">{data.phases.length}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUpIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
            <Typography color="textSecondary" gutterBottom>
              Total Tasks
            </Typography>
            <Typography variant="h5">
              {data.phases.reduce((sum, phase) => sum + phase.tasks.length, 0)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardHeader title="Consolidation Phases" />
        <CardContent sx={{ pt: 0 }}>
          <Stepper orientation="vertical">
            {data.phases.map((phase, phaseIndex) => (
              <Step
                key={phaseIndex}
                active={true}
                sx={{
                  '& .MuiStepLabel-root': {
                    cursor: 'pointer',
                  },
                }}
              >
                <StepLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Phase {phase.phase_number}: {phase.phase_name}
                    </Typography>
                    <Chip
                      label={`${phase.estimated_effort_hours}h`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </StepLabel>

                <StepContent>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    {phase.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    {phase.tasks.map((task, taskIndex) => (
                      <Accordion key={taskIndex} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <Chip
                              label={task.action}
                              size="small"
                              color={getActionColor(task.action) as 'default' | 'primary' | 'secondary'}
                              variant="outlined"
                            />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {task.source_components.join(', ')} → {task.target_location}
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              <Chip
                                label={task.effort_estimate}
                                size="small"
                                color={getEffortColor(task.effort_estimate)}
                                variant="outlined"
                              />
                              <Chip
                                label={task.impact}
                                size="small"
                                color={getImpactColor(task.impact)}
                                variant="outlined"
                              />
                            </Stack>
                          </Box>
                        </AccordionSummary>

                        <AccordionDetails>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Rationale
                              </Typography>
                              <Typography variant="body2">{task.rationale}</Typography>
                            </Box>

                            {task.dependencies.length > 0 && (
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                  Dependencies
                                </Typography>
                                <List dense>
                                  {task.dependencies.map((dep, depIndex) => (
                                    <ListItem key={depIndex}>
                                      <ListItemIcon sx={{ minWidth: 32 }}>
                                        <InfoIcon fontSize="small" />
                                      </ListItemIcon>
                                      <ListItemText primary={dep} />
                                    </ListItem>
                                  ))}
                                </List>
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Chip
                                label={`Effort: ${task.effort_estimate}`}
                                color={getEffortColor(task.effort_estimate)}
                                size="small"
                              />
                              <Chip
                                label={`Impact: ${task.impact}`}
                                color={getImpactColor(task.impact)}
                                size="small"
                              />
                            </Box>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>

                  <Divider sx={{ my: 2 }} />
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {data.expected_benefits.length > 0 && (
        <Card>
          <CardHeader
            title="Expected Benefits"
            avatar={<CheckCircleIcon sx={{ color: 'success.main' }} />}
          />
          <CardContent>
            <List>
              {data.expected_benefits.map((benefit, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText primary={benefit} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {data.risks.length > 0 && (
        <Card>
          <CardHeader
            title="Identified Risks"
            avatar={<WarningIcon sx={{ color: 'warning.main' }} />}
          />
          <CardContent>
            <List>
              {data.risks.map((risk, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <WarningIcon sx={{ color: 'warning.main' }} />
                  </ListItemIcon>
                  <ListItemText primary={risk} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      <Paper sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined">Export Plan</Button>
        <Button variant="contained">Approve & Execute</Button>
      </Paper>
    </Box>
  );
}
