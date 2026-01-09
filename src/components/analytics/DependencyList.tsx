import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  InputAdornment,
  Chip,
  Typography,
  Paper,
  Pagination,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { ComponentDependency } from '../../services/a2aClient';

interface DependencyListProps {
  dependencies: ComponentDependency[];
  onComponentClick?: (componentName: string) => void;
}

type SortField = 'source' | 'target' | 'strength' | 'count';
type SortOrder = 'asc' | 'desc';

export default function DependencyList({
  dependencies,
  onComponentClick,
}: DependencyListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('strength');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Filter dependencies based on search query
  const filteredDependencies = useMemo(() => {
    return dependencies.filter(
      dep =>
        dep.source_component.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dep.target_component.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dependencies, searchQuery]);

  // Sort dependencies
  const sortedDependencies = useMemo(() => {
    const sorted = [...filteredDependencies];
    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'source':
          aVal = a.source_component;
          bVal = b.source_component;
          break;
        case 'target':
          aVal = a.target_component;
          bVal = b.target_component;
          break;
        case 'strength':
          aVal = a.strength || 0;
          bVal = b.strength || 0;
          break;
        case 'count':
          aVal = a.import_count;
          bVal = b.import_count;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [filteredDependencies, sortField, sortOrder]);

  // Paginate sorted dependencies
  const paginatedDependencies = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedDependencies.slice(start, start + itemsPerPage);
  }, [sortedDependencies, page]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const pageCount = Math.ceil(sortedDependencies.length / itemsPerPage);

  if (filteredDependencies.length === 0) {
    return (
      <Card>
        <CardHeader title="Dependencies" />
        <CardContent>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              {searchQuery ? 'No dependencies match your search' : 'No dependencies found'}
            </Typography>
          </Paper>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Dependencies"
        subheader={`${sortedDependencies.length} dependencies found`}
        action={
          <TextField
            size="small"
            placeholder="Search dependencies..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'source'}
                    direction={sortOrder}
                    onClick={() => handleSort('source')}
                  >
                    Source Component
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'target'}
                    direction={sortOrder}
                    onClick={() => handleSort('target')}
                  >
                    Target Component
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'count'}
                    direction={sortOrder}
                    onClick={() => handleSort('count')}
                  >
                    Import Count
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'strength'}
                    direction={sortOrder}
                    onClick={() => handleSort('strength')}
                  >
                    Strength
                  </TableSortLabel>
                </TableCell>
                <TableCell>Import Type</TableCell>
                <TableCell align="right">Files</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedDependencies.map((dep, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        cursor: onComponentClick ? 'pointer' : 'default',
                        color: onComponentClick ? 'primary.main' : 'inherit',
                        '&:hover': onComponentClick ? { textDecoration: 'underline' } : {},
                      }}
                      onClick={() => onComponentClick?.(dep.source_component)}
                    >
                      {dep.source_component}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        cursor: onComponentClick ? 'pointer' : 'default',
                        color: onComponentClick ? 'primary.main' : 'inherit',
                        '&:hover': onComponentClick ? { textDecoration: 'underline' } : {},
                      }}
                      onClick={() => onComponentClick?.(dep.target_component)}
                    >
                      {dep.target_component}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{dep.import_count}</TableCell>
                  <TableCell align="right">
                    {(dep.strength * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell>
                    <Chip label={dep.import_type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{dep.files_involved?.length || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {pageCount > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
