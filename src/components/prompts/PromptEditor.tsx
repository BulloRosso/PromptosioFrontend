// src/components/prompts/PromptEditor.tsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import {
  Paper,
  Grid,
  TextField,
  Button,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { promptsApi } from '../../api/apiClient';

interface PromptFormData {
  name: string;
  version: string;
  content: string;
  staticTags: string[];
  dynamicTags: {
    tag: {
      name: string;
      type: 'dynamic';
    };
    condition: {
      envKey: string;
      type: 'matcher' | 'range' | 'list';
      evalFunction?: string;
      evalValue?: string;
      rangeMin?: number;
      rangeMax?: number;
      valueList?: string[];
    };
  }[];
  supportedLanguages: string[];
  conditions: any[];
  metadata: {
    author: string;
    description: string;
    category: string;
    labels: string[];
  };
  config: {
    provider: 'openai' | 'anthropic';
    model: string;
    temperature: number;
    maxTokens: number;
  };
}

export const PromptEditor = () => {
  const { id, version } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, setValue, watch } = useForm<PromptFormData>({
    defaultValues: {
      name: '',
      version: '1.0',
      content: '',
      staticTags: [],
      dynamicTags: [],
      supportedLanguages: ['en'],
      conditions: [],
      metadata: {
        author: '',
        description: '',
        category: '',
        labels: [],
      },
      config: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 500,
      },
    },
  });

  // Fetch prompt data if editing
  const { data: promptData } = useQuery({
    queryKey: ['prompt', id, version],
    queryFn: () => promptsApi.getPrompt(id!, version!),
    enabled: !!id && !!version,
  });

  // Update form when data is fetched
  useEffect(() => {
    if (promptData) {
      reset(promptData);
    }
  }, [promptData, reset]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data: PromptFormData) => {
      if (id && version) {
        return promptsApi.updatePrompt(id, version, data);
      }
      return promptsApi.createPrompt(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      navigate('/');
    },
  });

  const handleStaticTagAdd = () => {
    const tagInput = document.getElementById('static-tag-input') as HTMLInputElement;
    const newTag = tagInput.value.trim();
    if (newTag) {
      const currentTags = watch('staticTags');
      setValue('staticTags', [...currentTags, newTag]);
      tagInput.value = '';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {id ? 'Edit Prompt' : 'Create New Prompt'}
      </Typography>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Name"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="version"
              control={control}
              rules={{ required: 'Version is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Version"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>

          {/* Prompt Content */}
          <Grid item xs={12}>
            <Controller
              name="content"
              control={control}
              rules={{ required: 'Content is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={6}
                  label="Prompt Content"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>

          {/* Static Tags */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Static Tags
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TextField
                id="static-tag-input"
                label="Add Tag"
                size="small"
              />
              <IconButton onClick={handleStaticTagAdd} color="primary">
                <AddIcon />
              </IconButton>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              <Controller
                name="staticTags"
                control={control}
                render={({ field }) => (
                  <>
                    {field.value.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => {
                          const newTags = field.value.filter((_, i) => i !== index);
                          setValue('staticTags', newTags);
                        }}
                      />
                    ))}
                  </>
                )}
              />
            </Box>
          </Grid>

          {/* LLM Configuration */}
          <Grid item xs={12} md={6}>
            <Controller
              name="config.provider"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Provider</InputLabel>
                  <Select {...field} label="Provider">
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="anthropic">Anthropic</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="config.model"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Model</InputLabel>
                  <Select {...field} label="Model">
                    <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                    <MenuItem value="gpt-4">GPT-4</MenuItem>
                    <MenuItem value="claude-2">Claude 2</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="config.temperature"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
                  label="Temperature"
                  inputProps={{ step: 0.1, min: 0, max: 1 }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="config.maxTokens"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
                  label="Max Tokens"
                  inputProps={{ min: 1 }}
                />
              )}
            />
          </Grid>

          {/* Metadata */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Metadata
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="metadata.author"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Author" />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="metadata.category"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Category" />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="metadata.description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                />
              )}
            />
          </Grid>

          {/* Submit Buttons */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={mutation.isPending}
              >
                {id ? 'Update' : 'Create'} Prompt
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};