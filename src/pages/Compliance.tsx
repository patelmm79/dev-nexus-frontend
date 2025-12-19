import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Paper,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useValidateArchitectureMutation, useSuggestImprovementsMutation } from '../hooks/usePatterns';
import ComplianceResults from '../components/compliance/ComplianceResults';
import RecommendationsList from '../components/compliance/RecommendationsList';

const VALIDATION_SCOPES = [
  { value: 'license', label: 'License Compliance' },
  { value: 'documentation', label: 'Documentation Standards' },
  { value: 'terraform_init', label: 'Terraform Initialization' },
  { value: 'multi_env', label: 'Multi-Environment Setup' },
  { value: 'terraform_state', label: 'Terraform State Management' },
  { value: 'disaster_recovery', label: 'Disaster Recovery' },
  { value: 'deployment', label: 'Deployment Configuration' },
  { value: 'postgresql', label: 'PostgreSQL Setup' },
  { value: 'ci_cd', label: 'CI/CD Pipeline' },
  { value: 'containerization', label: 'Containerization' },
];

export default function Compliance() {
  const [repository, setRepository] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  const validateMutation = useValidateArchitectureMutation();
  const suggestMutation = useSuggestImprovementsMutation();

  const handleScopeChange = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleValidate = () => {
    if (!repository.trim()) {
      alert('Please enter a repository name');
      return;
    }
    validateMutation.mutate({
      repository: repository.trim(),
      validationScope: selectedScopes.length > 0 ? selectedScopes : undefined,
    });
  };

  const handleGetSuggestions = () => {
    if (!repository.trim()) {
      alert('Please enter a repository name');
      return;
    }
    suggestMutation.mutate({
      repository: repository.trim(),
      maxRecommendations: 15,
    });
  };

  const hasResults = validateMutation.data && validateMutation.data.success;
  const hasSuggestions = suggestMutation.data && suggestMutation.data.success;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Repository Compliance Checker
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Validate your repository against architectural standards and get improvement recommendations
      </Typography>

      {/* Input Section */}
      <Paper sx={{ p: 3, my: 3, background: 'rgba(255, 255, 255, 0.05)' }}>
        <Stack spacing={3}>
          {/* Repository Input */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Repository Name
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g., patelmm79/dev-nexus"
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              variant="outlined"
              disabled={validateMutation.isPending || suggestMutation.isPending}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleValidate();
                }
              }}
              helperText='Format: "owner/repository"'
            />
          </Box>

          {/* Validation Scope Selection */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Validation Scope
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1.5 }}>
              Select specific standards to check, or leave empty to check all standards
            </Typography>
            <FormGroup sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
              {VALIDATION_SCOPES.map((scope) => (
                <FormControlLabel
                  key={scope.value}
                  control={
                    <Checkbox
                      checked={selectedScopes.includes(scope.value)}
                      onChange={() => handleScopeChange(scope.value)}
                      disabled={validateMutation.isPending || suggestMutation.isPending}
                    />
                  }
                  label={scope.label}
                />
              ))}
            </FormGroup>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              onClick={handleValidate}
              disabled={validateMutation.isPending || !repository.trim()}
              sx={{ flex: '1 1 auto', minWidth: 150 }}
            >
              {validateMutation.isPending ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Validating...
                </>
              ) : (
                'Validate Repository'
              )}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleGetSuggestions}
              disabled={suggestMutation.isPending || !repository.trim()}
              sx={{ flex: '1 1 auto', minWidth: 150 }}
            >
              {suggestMutation.isPending ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Loading...
                </>
              ) : (
                'Get Suggestions'
              )}
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Error Messages */}
      {validateMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Validation Error
          </Typography>
          <Typography variant="body2">
            {validateMutation.error instanceof Error
              ? validateMutation.error.message
              : 'An error occurred while validating the repository'}
          </Typography>
        </Alert>
      )}

      {suggestMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Suggestions Error
          </Typography>
          <Typography variant="body2">
            {suggestMutation.error instanceof Error
              ? suggestMutation.error.message
              : 'An error occurred while fetching suggestions'}
          </Typography>
        </Alert>
      )}

      {/* Results Section */}
      {hasResults && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Validation Results
          </Typography>
          <ComplianceResults data={validateMutation.data} />
        </Box>
      )}

      {/* Suggestions Section (standalone) */}
      {hasSuggestions && !hasResults && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Improvement Suggestions
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Recommended improvements for {repository}:
          </Typography>
          <RecommendationsList recommendations={suggestMutation.data.recommendations} maxDisplay={15} />
        </Box>
      )}

      {/* Info Message */}
      {!hasResults && !hasSuggestions && (
        <Paper sx={{ p: 3, textAlign: 'center', background: 'rgba(33, 150, 243, 0.1)' }}>
          <Typography variant="body2" color="textSecondary">
            Enter a repository name and click "Validate Repository" to start checking architectural compliance.
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
            Validation may take 10-30 seconds for large repositories on first run.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
