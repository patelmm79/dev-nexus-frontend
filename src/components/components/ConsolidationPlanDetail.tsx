import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useRecommendConsolidationPlan } from '../../hooks/useComponentSensibility';

interface ConsolidationPlanDetailProps {
  open: boolean;
  componentName: string;
  fromRepository: string;
  onClose: () => void;
}

export default function ConsolidationPlanDetail({
  open,
  componentName,
  fromRepository,
  onClose,
}: ConsolidationPlanDetailProps) {
  const { data: planData, isLoading, isError, error } = useRecommendConsolidationPlan(
    componentName,
    fromRepository
  );

  const getPriorityColor = (
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  ): 'error' | 'warning' | 'info' | 'success' => {
    switch (priority) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'success';
    }
  };

  const getRiskColor = (risk: 'LOW' | 'MEDIUM' | 'HIGH'): 'success' | 'warning' | 'error' => {
    switch (risk) {
      case 'LOW':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'error';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Consolidation Plan: {componentName}
          </Typography>
          <Button
            size="small"
            onClick={onClose}
            sx={{ minWidth: 'auto' }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Alert severity="error">
            Failed to load consolidation plan: {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        ) : !planData?.success ? (
          <Alert severity="warning">
            Unable to generate consolidation plan for this component.
          </Alert>
        ) : planData ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Recommendation Summary */}
            <Card>
              <CardHeader
                title="Recommendation"
                avatar={<TrendingUpIcon />}
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Current Location
                    </Typography>
                    <Chip label={planData.from_repository} color="warning" size="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Recommended Location
                    </Typography>
                    <Chip label={planData.to_repository} color="success" size="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Priority
                    </Typography>
                    <Chip
                      label={planData.priority}
                      color={getPriorityColor(planData.priority)}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Confidence
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {(planData.confidence * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Effort Estimate */}
            <Card>
              <CardHeader
                title="Implementation Effort"
                avatar={<ScheduleIcon />}
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h4" color="primary">
                    {planData.estimated_total_effort_hours}
                  </Typography>
                  <Typography color="textSecondary">hours estimated total effort</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader
                title={`Benefits (${planData.benefits?.length || 0})`}
                avatar={<CheckCircleIcon color="success" />}
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <CardContent>
                {planData.benefits && planData.benefits.length > 0 ? (
                  <List sx={{ p: 0 }}>
                    {planData.benefits.map((benefit, idx) => (
                      <ListItem key={idx} sx={{ pl: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={benefit}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No specific benefits identified
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Risks */}
            <Card>
              <CardHeader
                title={`Risks (${planData.risks?.length || 0})`}
                avatar={<WarningIcon color="warning" />}
                titleTypographyProps={{ variant: 'subtitle1' }}
              />
              <CardContent>
                {planData.risks && planData.risks.length > 0 ? (
                  <List sx={{ p: 0 }}>
                    {planData.risks.map((risk, idx) => (
                      <ListItem key={idx} sx={{ pl: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <WarningIcon color="warning" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={risk}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No identified risks
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Migration Phases */}
            {planData.phases && planData.phases.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Migration Phases ({planData.phases.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {planData.phases.map((phase: any, idx: number) => (
                    <Accordion key={idx}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Chip
                            label={`Phase ${phase.phase_number}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                            {phase.name}
                          </Typography>
                          <Chip
                            label={`${phase.estimated_effort_hours}h`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`Risk: ${phase.risk_level}`}
                            size="small"
                            color={getRiskColor(phase.risk_level)}
                            variant="outlined"
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Description
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {phase.description}
                            </Typography>
                          </Box>
                          {phase.affected_files && phase.affected_files.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Affected Files ({phase.affected_files.length})
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {phase.affected_files.map((file: string, fileIdx: number) => (
                                  <Chip
                                    key={fileIdx}
                                    label={file}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
