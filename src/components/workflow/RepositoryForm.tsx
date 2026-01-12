import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
  Typography,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useRepositories } from '../../hooks/usePatterns';

export interface RepositoryFormProps {
  onStartWorkflow: (
    repositories: string[],
    config: {
      patternExtraction: boolean;
      dependencyDiscovery: boolean;
    }
  ) => void;
  isLoading?: boolean;
}

export default function RepositoryForm({ onStartWorkflow, isLoading = false }: RepositoryFormProps) {
  const { data: repositoriesData, isLoading: isLoadingRepos } = useRepositories();
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([]);
  const [patternExtraction, setPatternExtraction] = useState(true);
  const [dependencyDiscovery, setDependencyDiscovery] = useState(true);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const availableRepositories = repositoriesData?.repositories.map((r: any) => r.name) || [];

  const handleRepositoryToggle = (repositoryName: string) => {
    setSelectedRepositories((prev) =>
      prev.includes(repositoryName)
        ? prev.filter((r) => r !== repositoryName)
        : [...prev, repositoryName]
    );
    setFormErrors([]); // Clear errors when user makes changes
  };

  const handleSelectAll = () => {
    if (selectedRepositories.length === availableRepositories.length) {
      setSelectedRepositories([]);
    } else {
      setSelectedRepositories([...availableRepositories]);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (selectedRepositories.length === 0) {
      errors.push('Please select at least one repository');
    }

    if (!patternExtraction && !dependencyDiscovery) {
      errors.push('Please enable at least one analysis phase');
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onStartWorkflow(selectedRepositories, {
        patternExtraction,
        dependencyDiscovery,
      });
    }
  };

  if (isLoadingRepos) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {formErrors.length > 0 && (
        <Alert severity="error">
          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
            Please fix the following errors:
          </Typography>
          {formErrors.map((error, idx) => (
            <Typography key={idx} variant="body2" sx={{ ml: 2 }}>
              • {error}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Repository Selection Card */}
      <Card>
        <CardHeader
          title="Select Repositories"
          subheader={`${selectedRepositories.length} of ${availableRepositories.length} selected`}
        />
        <CardContent sx={{ pt: 0 }}>
          {availableRepositories.length === 0 ? (
            <Alert severity="warning">No repositories available. Please add some first.</Alert>
          ) : (
            <>
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSelectAll}
                    disabled={isLoading}
                  >
                    {selectedRepositories.length === availableRepositories.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </Stack>
              </Box>

              <FormGroup>
                {availableRepositories.map((repo) => (
                  <FormControlLabel
                    key={repo}
                    control={
                      <Checkbox
                        checked={selectedRepositories.includes(repo)}
                        onChange={() => handleRepositoryToggle(repo)}
                        disabled={isLoading}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {repo}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </>
          )}
        </CardContent>
      </Card>

      {/* Workflow Configuration Card */}
      <Card>
        <CardHeader title="Analysis Phases" />
        <CardContent sx={{ pt: 0 }}>
          <FormGroup sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={patternExtraction}
                  onChange={(e) => {
                    setPatternExtraction(e.target.checked);
                    setFormErrors([]);
                  }}
                  disabled={isLoading}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Pattern Extraction
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Analyze code for design patterns and best practices
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={dependencyDiscovery}
                  onChange={(e) => {
                    setDependencyDiscovery(e.target.checked);
                    setFormErrors([]);
                  }}
                  disabled={isLoading}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Dependency Discovery
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Identify relationships and dependencies between repositories
                  </Typography>
                </Box>
              }
            />
          </FormGroup>

          {/* Info Boxes */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              ℹ️ Workflow Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              • Pattern Extraction: ~5-15 minutes per repository
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              • Dependency Discovery: ~3-10 minutes per repository
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              • You can monitor progress in real-time after starting
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={isLoading || availableRepositories.length === 0}
          sx={{ minWidth: 200 }}
        >
          {isLoading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Starting Workflow...
            </>
          ) : (
            'Start Workflow'
          )}
        </Button>
      </Box>
    </Box>
  );
}
