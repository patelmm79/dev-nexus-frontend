import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Button,
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useAgentCard, useSkillSearch, useSkillsByCategory } from '../hooks/useAgents';
import SkillCard from '../components/agents/SkillCard';
import SkillExecutor from '../components/agents/SkillExecutor';
import type { Skill } from '../types/agents';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Agents() {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [showExecutor, setShowExecutor] = useState(false);

  const { data: agentCard, isLoading: agentLoading, refetch } = useAgentCard();
  const card: any = agentCard;
  const { skills: searchResults } = useSkillSearch(searchQuery);
  const skillsByCategory = useSkillsByCategory();

  if (agentLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!agentCard) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load agent information. Please try again.</Alert>
        <Button onClick={() => refetch()} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Container>
    );
  }

  const categories = Object.keys(skillsByCategory);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Agent Header */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardHeader
          title={
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              {card?.name}
            </Typography>
          }
          subheader={
            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
              {card?.description}
            </Typography>
          }
        />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', color: 'white' }}>
            <Box sx={{ minWidth: 160 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                VERSION
              </Typography>
              <Typography variant="h6">{card?.version}</Typography>
            </Box>
            <Box sx={{ minWidth: 160 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                SKILLS AVAILABLE
              </Typography>
              <Typography variant="h6">{card?.metadata?.skill_count}</Typography>
            </Box>
            <Box sx={{ minWidth: 160 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                ARCHITECTURE
              </Typography>
              <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                {card?.metadata?.architecture}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 160 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                EXTERNAL AGENTS
              </Typography>
              <Typography variant="h6">
                {Object.keys(card?.metadata?.external_agents || {}).length}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search skills by name, description, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </Box>
        {searchQuery && (
          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
            Found {searchResults.length} skill{searchResults.length !== 1 ? 's' : ''}
          </Typography>
        )}
      </Paper>

      {/* Main Content */}
      {showExecutor && selectedSkill ? (
        <SkillExecutor
          skill={selectedSkill}
          onClose={() => {
            setShowExecutor(false);
            setSelectedSkill(null);
          }}
        />
      ) : (
        <>
          {/* Tabs for Browse or Search Results */}
          <Paper>
            <Tabs
              value={tabValue}
              onChange={(_: any, newValue: number) => setTabValue(newValue)}
              aria-label="skills tabs"
            >
              <Tab label={`By Category (${categories.length})`} id="tab-0" />
              <Tab label={`Search Results (${searchResults.length})`} id="tab-1" />
              <Tab label="All Skills" id="tab-2" />
            </Tabs>

            {/* Category View */}
            <TabPanel value={tabValue} index={0}>
              {categories.length === 0 ? (
                <Alert severity="info">No skills available</Alert>
              ) : (
                <Box sx={{ display: 'grid', gap: 3 }}>
                  {categories.map((category) => (
                    <Box key={category}>
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 2,
                          pb: 1,
                          borderBottom: '2px solid',
                          borderColor: 'primary.main',
                        }}
                      >
                        {category} Skills
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
                        {(skillsByCategory as Record<string, typeof card.skills>)[category].map((skill: any) => (
                          <Box key={skill.id}>
                            <SkillCard
                              skill={skill}
                              onExecute={() => {
                                setSelectedSkill(skill);
                                setShowExecutor(true);
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </TabPanel>

            {/* Search Results */}
            <TabPanel value={tabValue} index={1}>
              {searchQuery ? (
                searchResults.length === 0 ? (
                  <Alert severity="info">
                    No skills match your search. Try different keywords.
                  </Alert>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
                    {searchResults.map((skill: any) => (
                      <Box key={skill.id}>
                        <SkillCard
                          skill={skill}
                          onExecute={() => {
                            setSelectedSkill(skill);
                            setShowExecutor(true);
                          }}
                          highlight={searchQuery}
                        />
                      </Box>
                    ))}
                  </Box>
                )
              ) : (
                <Alert severity="info">Enter a search query to find skills</Alert>
              )}
            </TabPanel>

            {/* All Skills */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
                {card.skills?.map((skill: any) => (
                  <Box key={skill.id}>
                    <SkillCard
                      skill={skill}
                      onExecute={() => {
                        setSelectedSkill(skill);
                        setShowExecutor(true);
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </TabPanel>
          </Paper>
        </>
      )}

      {/* External Agents Info */}
      {Object.keys(card.metadata?.external_agents || {}).length > 0 && (
        <Card sx={{ mt: 4 }}>
          <CardHeader title="External Agents" />
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
              {Object.entries(card.metadata?.external_agents || {}).map(([name, description]: any) => (
                <Box key={name}>
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {name.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {String(description)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
