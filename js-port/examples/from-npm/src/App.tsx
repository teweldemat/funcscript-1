import { CssBaseline, Container, Box, Typography, Button, Stack } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import theme from './theme';
import './global.css';
import {FunscScriptEditor} from '@tewelde/funscscript-editor'
import { useState } from 'react';

export default function App() {
  const [exp,setExp] =useState('')
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm">
        <Box sx={{ py: 8 }}>
          <Stack spacing={3} alignItems="center">
            <HomeRoundedIcon fontSize="large" />
            <Typography variant="h4" component="h1">MUI + TypeScript + Webpack</Typography>
            <Typography>Starter is live.</Typography>
            <FunscScriptEditor value={exp} onChange={setExp} />
            <Button variant="contained">Primary Action</Button>
          </Stack>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
