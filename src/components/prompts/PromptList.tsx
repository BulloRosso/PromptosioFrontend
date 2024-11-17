// src/components/prompts/PromptList.tsx
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  IconButton,
  Button
} from '@mui/material';
import { Edit, Delete, PlayArrow } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promptsApi } from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';

export const PromptList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: prompts, isLoading } = useQuery({
    queryKey: ['prompts'],
    queryFn: promptsApi.getPrompts
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, version }: { id: string, version: string }) => 
      promptsApi.deletePrompt(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Paper sx={{ p: 2 }}>
      <Button 
        variant="contained" 
        onClick={() => navigate('/prompts/new')}
        sx={{ mb: 2 }}
      >
        Create New Prompt
      </Button>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prompts?.map((prompt: any) => (
              <TableRow key={`${prompt.id}-${prompt.version}`}>
                <TableCell>{prompt.name}</TableCell>
                <TableCell>{prompt.version}</TableCell>
                <TableCell>{prompt.staticTags.join(', ')}</TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => navigate(`/prompts/${prompt.id}/${prompt.version}`)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    onClick={() => navigate(`/prompts/${prompt.id}/${prompt.version}/execute`)}
                  >
                    <PlayArrow />
                  </IconButton>
                  <IconButton 
                    onClick={() => deleteMutation.mutate({
                      id: prompt.id,
                      version: prompt.version
                    })}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};