// App.tsx
import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, CssBaseline, Box } from '@mui/material';
import Navigation from './navigator/Navigation';
import ContentPanel from './ContentPanel';
import ExecutionView from './execution/ExecutionView';
import axios from 'axios';
import { SERVER_URL } from './backend';

const App: React.FC = () => {
  const [sessionMap, setSessionMap] = useState<{ [path: string]: string }>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);

  const handleSelected = (filePath: string) => {
    console.log('selected ' + filePath);
    // Update the current file path
    setCurrentFilePath(filePath);

    // Check if a session already exists for the selected file
    if (sessionMap[filePath]) {
      console.log('session: ' + sessionMap[filePath]);
      setCurrentSessionId(sessionMap[filePath]);
    } else {
      // Create a new session if one does not exist
      createSession(filePath);
    }

    // Save UI state whenever a new path is selected
    saveUiState({ SelectedFile: filePath, SelectedVariable: currentNode, ExpandedNodes: expandedNodes });
  };

  const handleNodeSelect = (node: string | null) => {
    console.log('selected node ' + node);
    setCurrentNode(node);
    saveUiState({ SelectedFile: currentFilePath, SelectedVariable: node, ExpandedNodes: expandedNodes });
  };

  const createSession = (filePath: string) => {
    // API call to create a session
    axios.post(`${SERVER_URL}/api/sessions/create`, { fromFile: filePath })
      .then(response => {
        const newSessionId = response.data.sessionId;
        console.log(newSessionId);
        // Update the session map with the new session
        setSessionMap(prevMap => ({
          ...prevMap,
          [filePath]: newSessionId
        }));
        setCurrentSessionId(newSessionId);
      })
      .catch(error => {
        console.error('Failed to create session:', error);
        alert('Failed to create session: ' + error.message);
      });
  };

  const loadUiState = () => {
    const uiStateJson = localStorage.getItem('uiState');
    if (uiStateJson) {
      const uiState = JSON.parse(uiStateJson);
      setExpandedNodes(uiState.ExpandedNodes || []);
      if (uiState.SelectedFile) {
        handleSelected(uiState.SelectedFile);
      }
      if (uiState.SelectedVariable) {
        handleNodeSelect(uiState.SelectedVariable);
      }
    }
  };

  const saveUiState = (uiState: { SelectedFile: string | null, SelectedVariable: string | null, ExpandedNodes: string[] }) => {
    const currentUiStateJson = localStorage.getItem('uiState');
    const currentUiState = currentUiStateJson ? JSON.parse(currentUiStateJson) : {};
    
    const newUiState = {
      SelectedFile: uiState.SelectedFile !== null ? uiState.SelectedFile : currentUiState.SelectedFile,
      SelectedVariable: uiState.SelectedVariable !== null ? uiState.SelectedVariable : currentUiState.SelectedVariable,
      ExpandedNodes: uiState.ExpandedNodes
    };

    localStorage.setItem('uiState', JSON.stringify(newUiState));
    console.log('UI state saved successfully:', newUiState);
  };

  useEffect(() => {
    // Load UI state from local storage when the component mounts
    loadUiState();
  }, []);

  useEffect(() => {
    // Optional: Logic to handle when current file path changes, if needed
  }, [currentFilePath]);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Navigation
        onSelected={handleSelected}
        initiallySelectedPath={currentFilePath}
      />
      {currentSessionId && (
        <ExecutionView
          sessionId={currentSessionId}
          initiallySelectedNode={currentNode}
          onNodeSelect={handleNodeSelect}
        />
      )}
    </Box>
  );
};

export default App;
