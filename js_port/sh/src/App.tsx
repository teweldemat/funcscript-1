import { useMemo, useState } from 'react';
import {
  Alert,
  AppBar,
  Box,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Paper,
  Stack,
  Toolbar,
  Typography
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import FuncscriptEditor from './components/FuncscriptEditor';
import type { ColoredSegment } from './lib/funcscriptColoring';
import { parseNodePalette } from './lib/funcscriptColoring';
import { theme } from './theme';

const defaultExpression = 'If(1 = 1, 100 * sin(45), 0)';

function App(): JSX.Element {
  const [expression, setExpression] = useState(defaultExpression);
  const [segments, setSegments] = useState<ColoredSegment[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const activeSegments = useMemo(() => {
    const map = new Map<string, string>();
    for (const segment of segments) {
      if (!segment.color) {
        continue;
      }
      if (!map.has(segment.nodeType)) {
        map.set(segment.nodeType, segment.color);
      }
    }
    return Array.from(map.entries());
  }, [segments]);

  const uncovered = segments.some((segment) => segment.color === null);

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
                <FuncscriptEditor
                  value={expression}
                  onChange={setExpression}
                  onSegmentsChange={setSegments}
                  onError={setParseError}
                  minHeight={280}
                />
                {parseError ? (
                  <Alert severity="error" variant="outlined">
                    {parseError}
                  </Alert>
                ) : (
                  <Alert severity="info" variant="outlined">
                    Highlighted {segments.filter((segment) => segment.color).length} spans across{' '}
                    {segments.length} segments.
                    {uncovered ? ' Some characters use fallback styling.' : ''}
                  </Alert>
                )}
                <Divider />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Node Legend
                  </Typography>
                  {activeSegments.length ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {activeSegments.map(([nodeType, color]) => (
                        <Chip
                          key={nodeType}
                          label={nodeType}
                          variant="outlined"
                          sx={{
                            borderColor: color,
                            color,
                            fontWeight: 600
                          }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Start typing to see node highlights appear.
                    </Typography>
                  )}
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Palette
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {parseNodePalette.map((color) => (
                      <Box
                        key={color}
                        sx={{
                          width: 32,
                          height: 16,
                          borderRadius: 1,
                          bgcolor: `${color}99`,
                          border: `1px solid ${color}`
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
