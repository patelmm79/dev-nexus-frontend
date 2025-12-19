import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { ValidateRepositoryArchitectureResponse } from '../../services/a2aClient';
import ComplianceScoreCard from './ComplianceScoreCard';
import ComplianceViolationsList from './ComplianceViolationsList';
import ComplianceCategoryCard from './ComplianceCategoryCard';
import RecommendationsList from './RecommendationsList';
import A2AIntegrationStatus from './A2AIntegrationStatus';

interface ComplianceResultsProps {
  data: ValidateRepositoryArchitectureResponse;
  isLoading?: boolean;
}

export default function ComplianceResults({ data, isLoading }: ComplianceResultsProps) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data.success) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        <Typography variant="h6">Validation Failed</Typography>
        <Typography variant="body2">
          Failed to validate repository architecture. Please try again or check your repository name.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Compliance Score */}
      <ComplianceScoreCard
        score={data.overall_compliance_score}
        grade={data.compliance_grade}
        repository={data.repository}
      />

      {/* Summary Statistics */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ p: 2, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Total Checks
          </Typography>
          <Typography variant="h5">{data.summary.total_checks}</Typography>
        </Box>
        <Box sx={{ p: 2, background: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Passed Checks
          </Typography>
          <Typography variant="h5" sx={{ color: '#4caf50' }}>
            {data.summary.passed_checks}
          </Typography>
        </Box>
        <Box sx={{ p: 2, background: 'rgba(244, 67, 54, 0.1)', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Failed Checks
          </Typography>
          <Typography variant="h5" sx={{ color: '#f44336' }}>
            {data.summary.failed_checks}
          </Typography>
        </Box>
        <Box sx={{ p: 2, background: 'rgba(233, 30, 99, 0.1)', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Critical Violations
          </Typography>
          <Typography variant="h5" sx={{ color: '#e91e63' }}>
            {data.summary.critical_violations}
          </Typography>
        </Box>
      </Box>

      {/* Critical Violations */}
      {data.critical_violations && data.critical_violations.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
            Critical Issues
          </Typography>
          <ComplianceViolationsList violations={data.critical_violations} title="Critical Violations" />
        </>
      )}

      {/* Categories */}
      <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
        Compliance by Category
      </Typography>
      {Object.entries(data.categories).map(([categoryKey, categoryData]) => (
        <ComplianceCategoryCard key={categoryKey} category={categoryKey} data={categoryData} />
      ))}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
            Improvement Roadmap
          </Typography>
          <RecommendationsList recommendations={data.recommendations} />
        </>
      )}

      {/* A2A Integration Status */}
      {data.a2a_integration && <A2AIntegrationStatus integration={data.a2a_integration} />}
    </Box>
  );
}
