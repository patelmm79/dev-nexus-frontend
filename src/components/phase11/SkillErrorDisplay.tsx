/**
 * Phase 11: Error Display Component
 * Displays skill execution errors with metadata and context
 */

import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Typography,
  Chip,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { StandardSkillResponse } from '../../services/a2aClient';

export interface SkillErrorDisplayProps {
  response: StandardSkillResponse;
  skillId?: string;
  onDismiss?: () => void;
  expandable?: boolean;
  showMetadata?: boolean;
}

export function SkillErrorDisplay({
  response,
  skillId,
  onDismiss,
  expandable = true,
  showMetadata = true,
}: SkillErrorDisplayProps) {
  const [expanded, setExpanded] = React.useState(!expandable);

  if (!response || response.success) {
    return null;
  }

  const errorMessage = response.error || 'Unknown error occurred';
  const timestamp = new Date(response.timestamp).toLocaleString();
  const executionTimeMs = response.execution_time_ms;
  const errorType = response.metadata?.error_type;
  const errorCode = response.metadata?.error_code;

  return (
    <Alert
      severity="error"
      onClose={onDismiss}
      sx={{
        mb: 2,
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
    >
      <Stack spacing={1} width="100%">
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
          <Box flex={1}>
            <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
              {skillId ? `Skill "${skillId}" Failed` : 'Operation Failed'}
            </AlertTitle>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {errorMessage}
            </Typography>
          </Box>
          {expandable && (
            <IconButton
              onClick={() => setExpanded(!expanded)}
              size="small"
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          )}
        </Box>

        <Collapse in={expanded}>
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'error.light',
            }}
          >
            {/* Metadata Chips */}
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              {errorType && (
                <Chip
                  label={`Type: ${errorType}`}
                  size="small"
                  variant="outlined"
                  color="error"
                />
              )}
              {errorCode && (
                <Chip
                  label={`Code: ${errorCode}`}
                  size="small"
                  variant="outlined"
                  color="error"
                />
              )}
              <Chip
                label={`${executionTimeMs}ms`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={timestamp}
                size="small"
                variant="outlined"
              />
            </Box>

            {/* Metadata Details */}
            {showMetadata && response.metadata && Object.keys(response.metadata).length > 0 && (
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  Error Metadata:
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    maxHeight: '200px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    m: 0,
                    p: 1,
                    bgcolor: '#f5f5f5',
                    borderRadius: 0.5,
                  }}
                >
                  {JSON.stringify(response.metadata, null, 2)}
                </Box>
              </Paper>
            )}

            {/* Debug Information */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              For debugging: Check browser console for additional error details
            </Typography>
          </Box>
        </Collapse>
      </Stack>
    </Alert>
  );
}

/**
 * Component for displaying multiple skill errors
 */
export interface SkillErrorListProps {
  errors: Array<{
    id: string;
    response: StandardSkillResponse;
    skillId?: string;
  }>;
  onDismiss?: (id: string) => void;
  direction?: 'column' | 'row';
}

export function SkillErrorList({ errors, onDismiss, direction = 'column' }: SkillErrorListProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <Stack direction={direction} spacing={1}>
      {errors.map((error) => (
        <SkillErrorDisplay
          key={error.id}
          response={error.response}
          skillId={error.skillId}
          onDismiss={() => onDismiss?.(error.id)}
        />
      ))}
    </Stack>
  );
}

/**
 * Inline error message component (minimal)
 */
export interface SkillErrorInlineProps {
  response: StandardSkillResponse;
  skillId?: string;
}

export function SkillErrorInline({ response, skillId }: SkillErrorInlineProps) {
  if (!response || response.success) {
    return null;
  }

  const errorMessage = response.error || 'Unknown error occurred';

  return (
    <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
      {skillId ? `${skillId}: ` : ''}
      {errorMessage}
    </Typography>
  );
}
