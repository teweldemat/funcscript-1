import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  CssBaseline,
  Divider,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme
} from '@mui/material';
import {
  DefaultFsDataProvider,
  FSDataType,
  KeyValueCollection,
  FsList,
  evaluate,
  getTypeName,
  type TypedValue,
  valueOf
} from 'funcscript';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#7b1fa2'
    }
  }
});

type EvaluationState =
  | {
      status: 'idle';
    }
  | {
      status: 'success';
      typed: TypedValue;
      typeName: string;
      plain: unknown;
    }
  | {
      status: 'error';
      message: string;
    };

const convertTypedValue = (typed: TypedValue): unknown => {
  const [type, raw] = typed;

  const convertDate = (date: Date) => date.toISOString();
  const convertByteArray = (bytes: Uint8Array) => Array.from(bytes);

  switch (type) {
    case FSDataType.Null:
      return null;
    case FSDataType.Boolean:
    case FSDataType.Integer:
    case FSDataType.Float:
      return raw;
    case FSDataType.BigInteger:
      return typeof raw === 'bigint' ? raw.toString() : raw;
    case FSDataType.String:
      return raw;
    case FSDataType.DateTime:
      return raw instanceof Date ? convertDate(raw) : raw;
    case FSDataType.Guid:
      return raw;
    case FSDataType.ByteArray:
      return raw instanceof Uint8Array ? convertByteArray(raw) : raw;
    case FSDataType.List: {
      const list = raw as FsList;
      return Array.from(list).map((item) => convertTypedValue(item));
    }
    case FSDataType.KeyValueCollection: {
      const collection = raw as KeyValueCollection;
      const entries = collection.getAll();
      const result: Record<string, unknown> = {};
      for (const [key, value] of entries) {
        result[key] = convertTypedValue(value);
      }
      return result;
    }
    case FSDataType.Function:
      return '<function>';
    case FSDataType.Error: {
      const err = valueOf(typed);
      if (err && typeof err === 'object') {
        return err;
      }
      return String(raw);
    }
    default:
      return raw;
  }
};

const formatPlain = (value: unknown): string => {
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
};

function App() {
  const [expression, setExpression] = useState('1 + 2');
  const [state, setState] = useState<EvaluationState>({ status: 'idle' });
  const [isEvaluating, setIsEvaluating] = useState(false);

  const provider = useMemo(() => new DefaultFsDataProvider(), []);

  const handleEvaluate = () => {
    setIsEvaluating(true);
    try {
      const typed = evaluate(expression, provider);
      const plain = convertTypedValue(typed);
      const typeName = getTypeName(typed[0]);
      setState({ status: 'success', typed, typeName, plain });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState({ status: 'error', message });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Typography variant="h3" component="h1" fontWeight={600}>
              FuncScript Playground
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter a FuncScript expression to evaluate it in the browser. Try list operations, lambdas, and more.
            </Typography>
            <Alert severity="info" variant="outlined">
              File system functions are disabled in the browser environment.
            </Alert>
          </Stack>

          <Paper elevation={4} sx={{ p: 3 }}>
            <Stack spacing={3}>
              <TextField
                label="Expression"
                value={expression}
                onChange={(event) => setExpression(event.target.value)}
                placeholder={"If(1=1, \"Hello\", \"World\")"}
                minRows={4}
                multiline
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleEvaluate}
                  disabled={isEvaluating || !expression.trim()}
                >
                  {isEvaluating ? 'Evaluating...' : 'Evaluate'}
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {state.status === 'success' && (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h5" component="h2">
                  Result
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Type:
                  </Typography>
                  <Typography variant="body1">{state.typeName}</Typography>
                </Stack>
                <Divider />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Value
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      p: 2,
                      overflowX: 'auto',
                      fontSize: 14,
                      fontFamily: 'Roboto Mono, monospace'
                    }}
                  >
                    {formatPlain(state.plain)}
                  </Box>
                </Box>
              </Stack>
            </Paper>
          )}

          {state.status === 'error' && (
            <Alert severity="error" onClose={() => setState({ status: 'idle' })}>
              {state.message}
            </Alert>
          )}
        </Stack>
      </Container>
    </ThemeProvider>
  );
}

export default App;
