import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Repositories from './pages/Repositories';
import Patterns from './pages/Patterns';
import Configuration from './pages/Configuration';
import Deployment from './pages/Deployment';
import Agents from './pages/Agents';
import Compliance from './pages/Compliance';
import Components from './pages/Components';
import Analytics from './pages/Analytics';
import { a2aClient } from './services/a2aClient';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  // Initialize API client with saved configuration on app startup
  useEffect(() => {
    const saved = localStorage.getItem('app-config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.apiUrl) {
          a2aClient.setBaseUrl(config.apiUrl);
        }
        if (config.authToken) {
          a2aClient.setAuthToken(config.authToken);
        }
      } catch (e) {
        console.error('Failed to load saved configuration:', e);
      }
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="repositories" element={<Repositories />} />
          <Route path="patterns" element={<Patterns />} />
          <Route path="components" element={<Components />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="analytics/dependencies" element={<Analytics />} />
          <Route path="configuration" element={<Configuration />} />
          <Route path="deployment" element={<Deployment />} />
          <Route path="agents" element={<Agents />} />
          <Route path="compliance" element={<Compliance />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
