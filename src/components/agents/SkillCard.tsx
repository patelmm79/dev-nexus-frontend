/**
 * Skill Card Component - Display individual skill
 */

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,

  Chip,
  Stack,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  PlayArrow as ExecuteIcon,
  Lock as LockedIcon,
  Visibility as InfoIcon,
} from '@mui/icons-material';
import { Skill } from '../../types/agents';
import { useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import { VpnKey as TokenIcon } from '@mui/icons-material';
import { a2aClient } from '../../services/a2aClient';
import { toast } from 'react-hot-toast';

interface SkillCardProps {
  skill: Skill;
  onExecute: () => void;
  highlight?: string;
}

const categoryColors: Record<string, string> = {
  query: '#2196F3',
  search: '#2196F3',
  repository: '#FF9800',
  knowledge: '#4CAF50',
  learning: '#4CAF50',
  integration: '#9C27B0',
  external: '#9C27B0',
  documentation: '#00BCD4',
  monitoring: '#E91E63',
  health: '#E91E63',
};

export default function SkillCard({ skill, onExecute, highlight = '' }: SkillCardProps) {
  const [openToken, setOpenToken] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const savedToken = typeof window !== 'undefined' ? localStorage.getItem('a2a_auth_token') : null;
  // Highlight search term in description
  const highlightedDescription = useMemo(() => {
    if (!highlight) return skill.description;
    const regex = new RegExp(`(${highlight})`, 'gi');
    return skill.description.replace(regex, '<mark>$1</mark>');
  }, [skill.description, highlight]);

  // Get primary tag for color
  const primaryTag = skill.tags[0] || 'other';
  const bgColor = categoryColors[primaryTag] || '#757575';

  return (
    <>
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: 4,
          borderLeft: `4px solid ${bgColor}`,
        },
        borderLeft: '4px solid transparent',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${bgColor}22 0%, ${bgColor}44 100%)`,
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
          <Box flex={1}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                mb: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {skill.name}
              {skill.requires_authentication && (
                <Tooltip title="Requires authentication">
                  <LockedIcon sx={{ fontSize: '1rem', color: 'warning.main' }} />
                </Tooltip>
              )}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
              }}
            >
              {skill.id}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <CardContent sx={{ flex: 1 }}>
        {/* Description */}
        <Typography
          variant="body2"
          sx={{ mb: 2, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: highlightedDescription }}
        />

        {/* Tags */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 2 }}>
          {skill.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              sx={{
                borderColor: categoryColors[tag] || '#999',
                color: categoryColors[tag] || '#999',
              }}
            />
          ))}
        </Stack>

        {/* Input Schema Summary */}
        {skill.input_schema && skill.input_schema.properties && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
              Parameters:
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
              {Object.keys(skill.input_schema.properties).map((param) => (
                <Chip
                  key={param}
                  label={param}
                  size="small"
                  variant="filled"
                  sx={{ fontSize: '0.7rem', height: '20px' }}
                  color="default"
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Examples */}
        {skill.examples && skill.examples.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
              Example:
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                p: 1,
                backgroundColor: 'action.hover',
                borderRadius: 0.5,
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {JSON.stringify(skill.examples[0]?.input || {})}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<ExecuteIcon />}
          onClick={onExecute}
          sx={{
            background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%)`,
            textTransform: 'none',
            fontWeight: 'bold',
          }}
        >
          Execute
        </Button>
        {skill.examples && skill.examples.length > 0 && (
          <Tooltip title="View details">
            <IconButton size="small" onClick={onExecute}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Provide token">
          <IconButton
            size="small"
            onClick={() => setOpenToken(true)}
            sx={{ ml: 1 }}
            aria-label="provide-token"
          >
            <TokenIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
    <Dialog open={openToken} onClose={() => setOpenToken(false)}>
      <DialogTitle>Provide Auth Token</DialogTitle>
      <DialogContent>
        <TextField
          label="Auth token"
          fullWidth
          size="small"
          value={pendingToken}
          onChange={(e) => setPendingToken(e.target.value)}
          helperText={savedToken ? 'Existing token present' : 'Paste token to enable protected skills'}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenToken(false)}>Cancel</Button>
        <Button
          onClick={() => {
            try {
              localStorage.setItem('a2a_auth_token', pendingToken);
              a2aClient.setAuthToken(pendingToken);
              toast.success('Token saved');
              setPendingToken('');
              setOpenToken(false);
            } catch (err) {
              toast.error('Failed to save token');
            }
          }}
          variant="contained"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
