// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { 
  Box,
  ThemeProvider, 
  CssBaseline, 
  createTheme 
} from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PromptList } from './components/prompts/PromptList';
import { PromptEditor } from './components/prompts/PromptEditor';
import { Header } from './components/layout/Header';
import StructureEditor from './components/structure/StructureEditor';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
          >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100vh', // Full viewport height
            overflow: 'hidden' // Prevent scrolling
          }}>
            <Header />
            <Box sx={{ 
              flex: 1,  // Take remaining space
              overflow: 'hidden' // Prevent scrolling
            }}>
              <Routes>
                <Route path="/" element={<PromptList />} />
                <Route path="/structure-editor/:name/:version" element={<StructureEditor />} />
                <Route path="/prompts/new" element={<PromptEditor />} />
                <Route path="/prompts/:id/:version" element={<PromptEditor />} />
              </Routes>
            </Box>
          </Box>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;