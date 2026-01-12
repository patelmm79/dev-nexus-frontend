import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  Typography,
  Alert,
} from '@mui/material';

export interface Dependency {
  source_repository: string;
  target_repository: string;
  dependency_type: string;
  confidence: number;
}

export interface DependencyVerificationProps {
  dependencies?: Dependency[];
  onUpdate?: (dependencies: Dependency[]) => void;
  isLoading?: boolean;
}

export default function DependencyVerification({
  dependencies = [],
  onUpdate,
  isLoading = false,
}: DependencyVerificationProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [minConfidence, setMinConfidence] = useState(0);
  const [editedDependencies, setEditedDependencies] = useState<Dependency[]>(
    dependencies
  );

  const filteredDependencies = useMemo(
    () =>
      editedDependencies.filter(
        (dep) => dep.confidence >= minConfidence
      ),
    [editedDependencies, minConfidence]
  );

  const handleConfidenceChange = (index: number, newConfidence: number) => {
    const updated = [...editedDependencies];
    updated[index] = { ...updated[index], confidence: newConfidence };
    setEditedDependencies(updated);
  };

  const handleSelectToggle = (index: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredDependencies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        new Set(filteredDependencies.map((_, idx) => idx))
      );
    }
  };

  const handleUpdate = () => {
    if (onUpdate) {
      const selectedDeps = editedDependencies.filter((_, idx) =>
        selectedIds.has(idx)
      );
      onUpdate(selectedDeps);
    }
  };

  if (dependencies.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            No dependencies to verify yet. Run workflow analysis first.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card>
        <CardHeader title="Dependency Verification" />
        <CardContent sx={{ pt: 0 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Minimum Confidence: {minConfidence}%
            </Typography>
            <Slider
              value={minConfidence}
              onChange={(_, newValue) => setMinConfidence(newValue as number)}
              min={0}
              max={100}
              step={10}
              marks
              valueLabelDisplay="auto"
              disabled={isLoading}
            />
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedIds.size > 0 &&
                        selectedIds.size < filteredDependencies.length
                      }
                      checked={
                        filteredDependencies.length > 0 &&
                        selectedIds.size === filteredDependencies.length
                      }
                      onChange={handleSelectAll}
                      disabled={isLoading}
                    />
                  </TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Confidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDependencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No dependencies match the confidence filter
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDependencies.map((dep, idx) => (
                    <TableRow key={`${dep.source_repository}-${dep.target_repository}`}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.has(idx)}
                          onChange={() => handleSelectToggle(idx)}
                          disabled={isLoading}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dep.source_repository}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dep.target_repository}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dep.dependency_type}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Slider
                          value={dep.confidence}
                          onChange={(_, newValue) =>
                            handleConfidenceChange(idx, newValue as number)
                          }
                          min={0}
                          max={100}
                          step={5}
                          valueLabelDisplay="auto"
                          sx={{ minWidth: 100 }}
                          disabled={isLoading}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {selectedIds.size} of {filteredDependencies.length} selected
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={handleUpdate}
              disabled={selectedIds.size === 0 || isLoading}
            >
              Update Selected
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
