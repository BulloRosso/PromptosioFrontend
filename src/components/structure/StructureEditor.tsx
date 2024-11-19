import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  addEdge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  applyNodeChanges,
  NodeChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import { useParams } from 'react-router-dom';
import axios from 'axios';

interface Prompt {
  id: string;
  version: string;
  name: string;
  content: string;
  staticTags: string[];
  dynamicTags: any[];
  conditions: any[];
  supportedLanguages: string[];
  parentId?: string;
  metadata: {
    author?: string;
    createdAt: string;
    updatedAt: string;
    description?: string;
    category?: string;
    labels?: string[];
    flowPosition?: {
      x: number;
      y: number;
    };
  };
  config: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Define custom node component
const CustomNode = React.memo(({ data }: { data: any }) => (
  <div>
    <Handle
      type="target"
      position={Position.Top}
      style={{ background: '#000', width: '8px', height: '8px' }}
    />
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: '6px',
        minWidth: 200,
        cursor: 'pointer'
      }}
      onClick={data.onClick}
    >
      <Typography variant="h6" component="div" noWrap>
        {data.name.slice(0, 35)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {data.version}
      </Typography>
      <Box sx={{ mt: 1 }}>
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            data.onAdd();
          }}
        >
          <AddIcon />
        </IconButton>
        {data.showRemove && (
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              data.onRemove();
            }}
          >
            <RemoveIcon />
          </IconButton>
        )}
      </Box>
    </Paper>
    <Handle
      type="source"
      position={Position.Bottom}
      style={{ background: '#000', width: '8px', height: '8px' }}
    />
  </div>
));

// Default edge style
const defaultEdgeOptions = {
  animated: false,
  style: { stroke: '#000', strokeWidth: 1.5 },
  type: 'smoothstep'
};

// Define nodeTypes outside component
const nodeTypes = {
  custom: CustomNode
};

const StructureEditor = () => {
  const { name, version } = useParams();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [parentId, setParentId] = useState<string>('');
  const [existingPrompts, setExistingPrompts] = useState<Prompt[]>([]);
  const [newPromptData, setNewPromptData] = useState({ name: '', version: '1.0' });
  // Keep track of dragging state
  
  const lastPosition = useRef<{ [key: string]: { x: number; y: number } }>({});
  
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const updatedNodes = applyNodeChanges(changes, nds);

      changes.forEach(change => {
        if (
          change.type === 'position' && 
          change.position && 
          change.dragging === false
        ) {
          const node = nds.find(n => n.id === change.id);
          if (!node) return;

          // Get the name from the node's data instead of splitting the ID
          const promptName = node.data.name;
          const promptVersion = node.data.version;

          console.log('Attempting to save position for:', {
            name: promptName,
            version: promptVersion,
            position: change.position
          });

          apiClient.patch(`/prompts/${promptName}/${promptVersion}`, {
            metadata: {
              flowPosition: {
                x: Math.round(change.position.x),
                y: Math.round(change.position.y)
              }
            }
          }).then(() => {
            console.log('Position saved successfully for:', promptName);
          }).catch(error => {
            console.error('Error saving position:', error);
            if (error.response) {
              console.error('Server response:', error.response.data);
            }
          });
        }
      });

      return updatedNodes;
    });
  }, []);
  
  const onConnect = useCallback((params: any) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  const layoutNodes = (parentNode: Node, children: Node[], level = 1) => {
    const VERTICAL_SPACING = 220;
    const HORIZONTAL_SPACING = 250;

    children.forEach((child, index) => {
      child.position = {
        x: parentNode.position.x + (index - (children.length - 1) / 2) * HORIZONTAL_SPACING,
        y: parentNode.position.y + VERTICAL_SPACING
      };
    });
  };

  useEffect(() => {
    const initializeGraph = async () => {
      try {
        const rootPrompt = await apiClient.get(`/prompts/${name}/${version}`);
        const children = await apiClient.get(`/prompts/${name}/${version}/children`);

        const rootNode: Node = {
          id: `${rootPrompt.data.name}_${rootPrompt.data.version}`,
          position: rootPrompt.data.metadata?.flowPosition || { x: 250, y: 5 },
          data: {
            name: rootPrompt.data.name,
            version: rootPrompt.data.version,
            onAdd: () => handleAdd(`${rootPrompt.data.name}_${rootPrompt.data.version}`),
            onClick: () => handleNodeClick(`${rootPrompt.data.name}_${rootPrompt.data.version}`),
            showRemove: false
          },
          type: 'custom',
          draggable: true
        };

        const childNodes: Node[] = children.data.map((child: Prompt) => ({
          id: `${child.name}_${child.version}`,
          position: child.metadata?.flowPosition || { x: 0, y: 0 },
          data: {
            name: child.name,
            version: child.version,
            onAdd: () => handleAdd(`${child.name}_${child.version}`),
            onRemove: () => handleRemove(`${child.name}_${child.version}`),
            onClick: () => handleNodeClick(`${child.name}_${child.version}`),
            showRemove: true
          },
          type: 'custom',
          draggable: true
        }));

        // Only apply automatic layout for nodes without saved positions
        const nodesWithoutPosition = childNodes.filter(
          node => !node.position || (node.position.x === 0 && node.position.y === 0)
        );
        if (nodesWithoutPosition.length > 0) {
          layoutNodes(rootNode, nodesWithoutPosition);
        }

        const childEdges: Edge[] = childNodes.map((child) => ({
          id: `e-${rootNode.id}-${child.id}`,
          source: rootNode.id,
          target: child.id,
          type: 'smoothstep',
          style: { stroke: '#000', strokeWidth: 1.5 }
        }));

        setNodes([rootNode, ...childNodes]);
        setEdges(childEdges);
      } catch (error) {
        console.error('Error initializing graph:', error);
      }
    };

    initializeGraph();
  }, [name, version]);

  const handleNodeClick = (nodeId: string) => {
    const [name, version] = nodeId.split('_');
    window.open(`/prompts/${name}/${version}`, '_blank');
  };

  const handleAdd = (parentNodeId: string) => {
    setParentId(parentNodeId);
    setOpen(true);
  };

  const handleRemove = async (nodeId: string) => {
    try {
      const [promptName, promptVersion] = nodeId.split('_');
      await apiClient.patch(`/prompts/${promptName}/${promptVersion}`, { 
        parentId: null 
      });

      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => 
        edge.source !== nodeId && edge.target !== nodeId
      ));
    } catch (error) {
      console.error('Error removing node:', error);
    }
  };

  const handleCreateConnect = async () => {
    if (tabValue === 0) {
      try {
        const parentNode = nodes.find(node => node.id === parentId);
        if (parentNode) {
          const newPosition = {
            x: parentNode.position.x,
            y: parentNode.position.y + 220
          };

          const createPromptPayload = {
            name: newPromptData.name.toLowerCase().replace(/\s+/g, '-'),
            version: newPromptData.version,
            content: '# New Prompt\n\nEnter your prompt content here.',
            staticTags: ['new'],
            dynamicTags: [],
            conditions: [],
            supportedLanguages: ['en'],
            parentId: parentId,
            metadata: {
              description: 'New prompt created from structure editor',
              category: 'general',
              labels: [],
              flowPosition: newPosition
            },
            config: {
              model: 'gpt-3.5-turbo',
              temperature: 0.7,
              maxTokens: 1000
            }
          };

          const response = await apiClient.post('/prompts', createPromptPayload);

          const newNode: Node = {
            id: `${response.data.name}_${response.data.version}`,
            position: newPosition,
            data: {
              name: response.data.name,
              version: response.data.version,
              onAdd: () => handleAdd(`${response.data.name}_${response.data.version}`),
              onRemove: () => handleRemove(`${response.data.name}_${response.data.version}`),
              onClick: () => handleNodeClick(`${response.data.name}_${response.data.version}`),
              showRemove: true
            },
            type: 'custom',
            draggable: true
          };

          setNodes((nds) => [...nds, newNode]);
          setEdges((eds) => [...eds, {
            id: `e-${parentId}-${newNode.id}`,
            source: parentId,
            target: newNode.id,
            type: 'smoothstep',
            style: { stroke: '#000', strokeWidth: 1.5 }
          }]);
        }
      } catch (error) {
        console.error('Error creating prompt:', error);
      }
    }
    setOpen(false);
  };

  return (
    <Box sx={{ 
      width: '100%', 
      height: 'calc(100% - 16px)', 
      overflow: 'hidden',
      p: 1
    }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add child element
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => setOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="New prompt" />
            <Tab label="Select prompt" />
          </Tabs>
          {tabValue === 0 ? (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Prompt Name"
                value={newPromptData.name}
                onChange={(e) => setNewPromptData(prev => ({ ...prev, name: e.target.value }))}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Version"
                value={newPromptData.version}
                onChange={(e) => setNewPromptData(prev => ({ ...prev, version: e.target.value }))}
                margin="normal"
              />
            </Box>
          ) : (
            <List>
              {existingPrompts.map((prompt) => (
                <ListItem key={`${prompt.name}_${prompt.version}`}>
                  <ListItemText
                    primary={prompt.name}
                    secondary={`Version: ${prompt.version}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateConnect}>Create/Connect</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StructureEditor;