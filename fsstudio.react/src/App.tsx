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

  const handleSelected = (filePath: string) => {
    console.log('seleted'+filePath)
    // Update the current file path
    setCurrentFilePath(filePath);

    // Check if a session already exists for the selected file
    if (sessionMap[filePath]) {
      console.log('session:'+sessionMap[filePath])
      setCurrentSessionId(sessionMap[filePath]);
    } else {
      // Create a new session if one does not exist
      createSession(filePath);
    }
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

  useEffect(() => {
    // Optional: Logic to handle when current file path changes, if needed
  }, [currentFilePath]);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Navigation onSelected={handleSelected} />
      {currentSessionId && (
        <ExecutionView sessionId={currentSessionId} />
      )}
    </Box>
  );
};

export default App;
