import { useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Container,
  CssBaseline,
  Paper,
  Stack,
  Toolbar,
  Typography
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { FuncScriptTester } from '@tewelde/funcscript-editor';
import { theme } from './theme';

const defaultExpression = 'If(1 = 1, 100 * sin(45), 0)';

function App(): JSX.Element {
  const [expression, setExpression] = useState(defaultExpression);
  const [parseError, setParseError] = useState<string | null>(null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            FuncScript Syntax Highlighting
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ py: 4 }}>
        <Container maxWidth="lg">
          <Stack spacing={4}>
            <Paper elevation={4} sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom>
                    Interactive Playground
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Type FuncScript expressions and see parse-driven syntax highlighting powered by the
                    shared <code>colorParseTree</code> helper.
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: { xs: 440, md: 520 },
                    maxHeight: { xs: 440, md: 520 },
                    '& .funcscript-tester': {
                      height: '100%',
                      maxHeight: '100%',
                      overflow: 'hidden'
                    },
                    '& .funcscript-tester > div': {
                      minHeight: 0,
                      overflow: 'hidden'
                    },
                    '& .funcscript-tester .cm-editor': {
                      height: '100%'
                    },
                    '& .funcscript-tester .cm-scroller': {
                      height: '100%',
                      overflowY: 'auto'
                    }
                  }}
                >
                  <FuncScriptTester
                    value={expression}
                    onChange={setExpression}
                    onError={setParseError}
                    minHeight={320}
                    saveKey='example'
                    style={{ height: '100%' }}
                  />
                </Box>
                {parseError ? (
                  <Alert severity="error" variant="outlined">
                    {parseError}
                  </Alert>
                ) : (
                  <Alert severity="info" variant="outlined">
                    Use the tester to evaluate expressions and capture variables without the parse tree
                    visualization.
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
