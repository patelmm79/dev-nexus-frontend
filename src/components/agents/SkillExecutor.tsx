/**
 * Skill Executor Component - Execute skills with dynamic forms
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  Typography,
  Paper,
  
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  InputLabel,
  
} from '@mui/material';
import {
  PlayArrow as ExecuteIcon,
  ArrowBack as BackIcon,
  ContentCopy as CopyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useExecuteSkill, useExecutionHistory } from '../../hooks/useAgents';
import { Skill, SkillExecutionRequest } from '../../types/agents';
import { a2aClient } from '../../services/a2aClient';
import SkillResultDisplay from './SkillResultDisplay';

interface SkillExecutorProps {
  skill: Skill;
  onClose: () => void;
}

interface FormField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export default function SkillExecutor({ skill, onClose }: SkillExecutorProps) {
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [useExample, setUseExample] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('a2a_auth_token');
    } catch {
      return null;
    }
  });
  const [pendingToken, setPendingToken] = useState('');

  const { mutate: executeSkill, isPending, isSuccess, data: result, error } = useExecuteSkill();
  const { addToHistory } = useExecutionHistory();

  // Parse input schema to form fields
  const formFields = useMemo(() => {
    const fields: FormField[] = [];
    const schema = skill.input_schema;

    if (schema.properties) {
      const required = schema.required || [];
      Object.entries(schema.properties).forEach(([name, prop]: [string, any]) => {
        fields.push({
          name,
          type: prop.type || 'string',
          required: required.includes(name),
          description: prop.description,
        });
      });
    }

    return fields;
  }, [skill]);

  // Handle input change
  const handleInputChange = (fieldName: string, value: any) => {
    setInputs((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Load example into form
  const handleLoadExample = () => {
    if (skill.examples && skill.examples.length > 0) {
      setInputs(skill.examples[0].input);
      setUseExample(true);
      toast.success('Example loaded');
    }
  };

  // Execute skill
  const handleExecute = () => {
    // Validate required fields
    const missing = formFields
      .filter((f) => f.required && !inputs[f.name])
      .map((f) => f.name);

    if (missing.length > 0) {
      toast.error(`Missing required fields: ${missing.join(', ')}`);
      return;
    }

    const request: SkillExecutionRequest = {
      skill_id: skill.id,
      input: inputs,
    };
    // ensure auth token configured for protected skills
    if (skill.requires_authentication && !authToken) {
      toast.error('This skill requires authentication. Provide a token first.');
      return;
    }
    executeSkill(request, {
      onSuccess: (data) => {
        addToHistory(request, data);
        toast.success('Skill executed successfully');
      },
      onError: (err) => {
        toast.error(`Execution failed: ${err.message}`);
      },
    });
  };

  const handleSaveToken = () => {
    try {
      localStorage.setItem('a2a_auth_token', pendingToken);
      a2aClient.setAuthToken(pendingToken);
      setAuthToken(pendingToken);
      toast.success('Auth token saved');
      setPendingToken('');
    } catch (err) {
      toast.error('Failed to save token');
    }
  };

  // Clear form
  const handleClear = () => {
    setInputs({});
    setUseExample(false);
  };

  // Copy result to clipboard
  const handleCopyResult = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      toast.success('Copied to clipboard');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Button
          startIcon={<BackIcon />}
          onClick={onClose}
          variant="outlined"
          size="small"
        >
          Back
        </Button>
        <Typography variant="h5" sx={{ flex: 1 }}>
          {skill.name}
        </Typography>
        {skill.requires_authentication && (
          <Chip label="Requires Auth" color="warning" size="small" />
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        {/* Input Form */}
        <Box sx={{ flex: isSuccess ? '1 1 50%' : '1 1 100%' }}>
          <Card>
            <CardHeader
              title="Input Parameters"
              action={
                skill.examples && skill.examples.length > 0 ? (
                  <Button size="small" onClick={handleLoadExample}>
                    Load Example
                  </Button>
                ) : null
              }
            />
            <CardContent>
              <Stack spacing={2}>
                {/* Skill Description */}
                <Alert severity="info">{skill.description}</Alert>

                {/* Token input for protected skills */}
                {skill.requires_authentication && (
                  <Box sx={{ mb: 2 }}>
                    {authToken ? (
                      <Chip label="Authenticated" color="success" size="small" sx={{ mb: 1 }} />
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          label="Auth token"
                          size="small"
                          value={pendingToken}
                          onChange={(e) => setPendingToken(e.target.value)}
                          helperText="Provide token to enable protected skills"
                        />
                        <Button size="small" variant="contained" onClick={handleSaveToken}>
                          Save
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Form Fields */}
                {formFields.length === 0 ? (
                  <Typography color="text.secondary">This skill has no parameters.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {formFields.map((field) => (
                      <Box key={field.name}>
                        <InputLabel>
                          {field.name}
                          {field.required && <span style={{ color: 'red' }}> *</span>}
                        </InputLabel>
                        {field.type === 'boolean' ? (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={inputs[field.name] || false}
                                onChange={(e) => handleInputChange(field.name, e.target.checked)}
                              />
                            }
                            label={field.description || field.name}
                          />
                        ) : field.type === 'array' ? (
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder={`Enter JSON array or comma-separated values for ${field.name}`}
                            value={Array.isArray(inputs[field.name])
                              ? JSON.stringify(inputs[field.name])
                              : inputs[field.name] || ''
                            }
                            onChange={(e) => {
                              try {
                                const val = e.target.value;
                                if (val.trim().startsWith('[')) {
                                  handleInputChange(field.name, JSON.parse(val));
                                } else {
                                  handleInputChange(field.name, val.split(',').map(s => s.trim()));
                                }
                              } catch {
                                handleInputChange(field.name, e.target.value);
                              }
                            }}
                            helperText={field.description}
                            size="small"
                          />
                        ) : field.type === 'object' ? (
                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder={`Enter JSON object for ${field.name}`}
                            value={typeof inputs[field.name] === 'object'
                              ? JSON.stringify(inputs[field.name])
                              : inputs[field.name] || ''
                            }
                            onChange={(e) => {
                              try {
                                handleInputChange(field.name, JSON.parse(e.target.value));
                              } catch {
                                handleInputChange(field.name, e.target.value);
                              }
                            }}
                            helperText={field.description}
                            size="small"
                          />
                        ) : (
                          <TextField
                            fullWidth
                            type={field.type === 'number' ? 'number' : 'text'}
                            placeholder={`Enter ${field.name}`}
                            value={inputs[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            helperText={field.description}
                            size="small"
                          />
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}

                {/* Use Example Indicator */}
                {useExample && (
                  <Alert severity="info">
                    Using example input. Modify fields as needed before executing.
                  </Alert>
                )}

                {/* Error Display */}
                {error && (
                  <Alert severity="error">
                    <strong>Execution Error:</strong> {error.message}
                  </Alert>
                )}

                {/* Actions */}
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={isPending ? <CircularProgress size={20} /> : <ExecuteIcon />}
                    onClick={handleExecute}
                    disabled={isPending}
                    size="large"
                  >
                    {isPending ? 'Executing...' : 'Execute Skill'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClear}
                    disabled={isPending || Object.keys(inputs).length === 0}
                  >
                    Clear
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Result Display */}
        {isSuccess && result && (
          <Box sx={{ flex: '1 1 50%' }}>
            <Card>
              <CardHeader
                title="Execution Result"
                action={
                  <Button
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={handleCopyResult}
                  >
                    Copy
                  </Button>
                }
              />
              <CardContent sx={{ maxHeight: '600px', overflow: 'auto' }}>
                <SkillResultDisplay result={result} />
              </CardContent>
            </Card>
            </Box>
        )}
        </Box>

      {/* Examples Dialog */}
      {skill.examples && skill.examples.length > 0 && (
        <Dialog
          open={showHistory}
          onClose={() => setShowHistory(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Examples
            <IconButton
              onClick={() => setShowHistory(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {skill.examples.map((example, index) => (
                <Paper key={index} sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {example.description || `Example ${index + 1}`}
                  </Typography>
                  <Typography
                    component="pre"
                    variant="caption"
                    sx={{
                      backgroundColor: '#f5f5f5',
                      p: 1,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: '0.75rem',
                    }}
                  >
                    {JSON.stringify(example.input, null, 2)}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowHistory(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
