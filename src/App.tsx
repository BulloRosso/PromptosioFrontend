// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { 
  ThemeProvider, 
  CssBaseline, 
  createTheme 
} from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PromptList } from './components/prompts/PromptList';
import { PromptEditor } from './components/prompts/PromptEditor';
import { Header } from './components/layout/Header';

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
        <BrowserRouter>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <main style={{ flex: 1, padding: '20px' }}>
              <Routes>
                <Route path="/" element={<PromptList />} />
                <Route path="/prompts/new" element={<PromptEditor />} />
                <Route path="/prompts/:id/:version" element={<PromptEditor />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;