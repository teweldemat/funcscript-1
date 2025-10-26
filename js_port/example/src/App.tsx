import { useCallback, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
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
  ensureTyped,
  getTypeName,
  type TypedValue,
  valueOf
} from 'funcscript';
// funcscript parser is provided as CommonJS without type definitions
import * as parserModule from 'funcscript/parser';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { FuncScriptParser } = parserModule as { FuncScriptParser: any };

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

type TextRange = {
  start: number;
  end: number;
};

type ParseTreeNode = {
  id: string;
  label: string;
  detail?: string;
  range?: TextRange;
  children: ParseTreeNode[];
};

type EvaluationState =
  | {
      status: 'idle';
    }
  | {
      status: 'success';
      typed: TypedValue;
      typeName: string;
      plain: unknown;
      parseTree: ParseTreeNode | null;
      expressionText: string;
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

const truncate = (value: string, maxLength = 60): string => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
};

const makePreview = (value: unknown): string => {
  if (typeof value === 'string') {
    return truncate(`"${value}"`);
  }
  const formatted = formatPlain(value);
  return truncate(formatted.replace(/\s+/g, ' ').trim());
};

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const getNodeRange = (node: unknown): TextRange | undefined => {
  if (!node || typeof node !== 'object') {
    return undefined;
  }
  const candidate = node as Record<string, unknown>;
  const start = isFiniteNumber(candidate.Pos) ? (candidate.Pos as number) : isFiniteNumber(candidate.position) ? (candidate.position as number) : null;
  const length = isFiniteNumber(candidate.Length) ? (candidate.Length as number) : isFiniteNumber(candidate.length) ? (candidate.length as number) : null;
  if (start === null || length === null || length < 0) {
    return undefined;
  }
  return { start, end: start + length };
};

const describeNode = (node: any): { label: string; detail?: string } => {
  const typeName = node?.constructor?.name ?? 'Expression';

  switch (typeName) {
    case 'LiteralBlock': {
      const typed = node?.value as TypedValue | undefined;
      if (Array.isArray(typed)) {
        const typeLabel = getTypeName(typed[0]);
        const preview = makePreview(convertTypedValue(typed));
        return {
          label: `Literal (${typeLabel})`,
          detail: preview
        };
      }
      return { label: 'Literal' };
    }
    case 'ReferenceBlock': {
      const name = typeof node?.name === 'string' ? node.name : '(anonymous)';
      return {
        label: 'Reference',
        detail: name
      };
    }
    case 'FunctionCallExpression': {
      const fnExpression = node?.Function ?? node?.functionExpression;
      let fnLabel: string | undefined;
      if (fnExpression?.constructor?.name === 'ReferenceBlock' && typeof fnExpression.name === 'string') {
        fnLabel = fnExpression.name;
      } else if (fnExpression?.constructor?.name === 'LiteralBlock') {
        const funcValue = fnExpression.value?.[1];
        if (funcValue && typeof funcValue === 'object') {
          if (typeof funcValue.symbol === 'string' && funcValue.symbol.trim().length) {
            fnLabel = funcValue.symbol;
          } else if (funcValue.constructor?.name) {
            fnLabel = funcValue.constructor.name;
          }
        }
      }
      const params = Array.isArray(node?.Parameters)
        ? node.Parameters
        : Array.isArray(node?.parameters)
          ? node.parameters
          : [];
      const count = params.length;
      const detail = `${count} argument${count === 1 ? '' : 's'}`;
      return {
        label: fnLabel ? `Call ${fnLabel}` : 'FunctionCall',
        detail
      };
    }
    case 'ListExpression': {
      const items = Array.isArray(node?.ValueExpressions) ? node.ValueExpressions.length : 0;
      return {
        label: 'List',
        detail: `${items} item${items === 1 ? '' : 's'}`
      };
    }
    case 'SelectorExpression':
      return {
        label: 'Selector',
        detail: 'Applies selector to source'
      };
    case 'KvcExpression': {
      const entries = Array.isArray(node?.KeyValues)
        ? node.KeyValues
        : Array.isArray(node?._keyValues)
          ? node._keyValues
          : [];
      const keys = entries
        .map((kv: any) => (typeof kv?.Key === 'string' ? kv.Key : null))
        .filter((key: string | null): key is string => Boolean(key));
      return {
        label: 'KeyValueCollection',
        detail: keys.length ? `Keys: ${keys.join(', ')}` : undefined
      };
    }
    case 'NullExpressionBlock':
      return {
        label: 'Null literal',
        detail: 'null'
      };
    default:
      return {
        label: typeName
      };
  }
};

const buildParseTree = (node: any, path = '0'): ParseTreeNode => {
  if (!node || typeof node !== 'object') {
    return {
      id: path,
      label: 'Unknown',
      children: []
    };
  }

  const baseInfo = describeNode(node);
  const range = getNodeRange(node);

  if (node?.constructor?.name === 'KvcExpression') {
    const entries = Array.isArray(node?.KeyValues)
      ? node.KeyValues
      : Array.isArray(node?._keyValues)
        ? node._keyValues
        : [];
    const children: ParseTreeNode[] = entries.map((kv: any, index: number) => {
      const childNode = buildParseTree(kv?.ValueExpression, `${path}.${index}`);
      const keyLabel = typeof kv?.Key === 'string' ? kv.Key : `entry ${index + 1}`;
      return {
        ...childNode,
        label: `${childNode.label} (${keyLabel})`
      };
    });

    if (node?.singleReturn) {
      const returnNode = buildParseTree(node.singleReturn, `${path}.${children.length}`);
      children.push({
        ...returnNode,
        label: 'Return'
      });
    }

    return {
      id: path,
      label: baseInfo.label,
      detail: baseInfo.detail,
      range,
      children
    };
  }

  const rawChildren = typeof node.getChilds === 'function' ? node.getChilds() : [];
  const children = Array.isArray(rawChildren)
    ? rawChildren
        .filter((child): child is Record<string, unknown> => Boolean(child))
        .map((child, index) => buildParseTree(child, `${path}.${index}`))
    : [];

  return {
    id: path,
    label: baseInfo.label,
    detail: baseInfo.detail,
    range,
    children
  };
};

const sanitizeRange = (range: TextRange | null | undefined, length: number): TextRange | null => {
  if (!range) {
    return null;
  }
  const start = Math.max(0, Math.min(range.start, length));
  const end = Math.max(start, Math.min(range.end, length));
  return { start, end };
};

type ParseTreeNodeViewProps = {
  node: ParseTreeNode;
  depth?: number;
  onSelect: (node: ParseTreeNode) => void;
  selectedId?: string | null;
};

const ParseTreeNodeView = ({ node, depth = 0, onSelect, selectedId }: ParseTreeNodeViewProps) => {
  const isSelected = node.id === selectedId;
  const isInteractive = Boolean(node.range);

  const handleActivate = () => {
    onSelect(node);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <Box sx={{ ml: depth ? 2 : 0, mt: depth ? 1 : 0 }}>
      <Box
        role={isInteractive ? 'button' : 'presentation'}
        tabIndex={isInteractive ? 0 : -1}
        onClick={isInteractive ? handleActivate : undefined}
        onKeyDown={handleKeyDown}
        sx={{
          cursor: isInteractive ? 'pointer' : 'default',
          borderRadius: 1,
          border: '1px solid',
          borderColor: isSelected ? 'primary.main' : 'divider',
          bgcolor: isSelected ? 'primary.light' : 'background.paper',
          px: 1.5,
          py: 1,
          boxShadow: isSelected ? 1 : 0,
          transition: 'background-color 0.2s ease, border-color 0.2s ease'
        }}
      >
        <Typography variant="body2" fontWeight={600} sx={{ mb: node.detail || node.range ? 0.5 : 0 }}>
          {node.label}
        </Typography>
        {node.detail && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {node.detail}
          </Typography>
        )}
        {node.range && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', fontFamily: 'Roboto Mono, monospace' }}
          >
            [{node.range.start}, {node.range.end})
          </Typography>
        )}
      </Box>
      {node.children.length > 0 && (
        <Box sx={{ borderLeft: '1px solid', borderColor: 'divider', ml: 1.5, pl: 1.5, mt: 1.5 }}>
          {node.children.map((child) => (
            <ParseTreeNodeView
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

type HighlightProps = {
  expression: string;
  highlight: TextRange | null;
};

const HighlightedExpression = ({ expression, highlight }: HighlightProps) => {
  const safeRange = sanitizeRange(highlight, expression.length);
  if (!safeRange) {
    return (
      <Box
        component="pre"
        sx={{
          bgcolor: 'background.default',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          p: 2,
          whiteSpace: 'pre-wrap',
          fontFamily: 'Roboto Mono, monospace',
          fontSize: 14,
          minHeight: '3rem'
        }}
      >
        {expression}
      </Box>
    );
  }

  const { start, end } = safeRange;
  const before = expression.slice(0, start);
  const middle = expression.slice(start, end);
  const after = expression.slice(end);

  return (
    <Box
      component="pre"
      sx={{
        bgcolor: 'background.default',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        p: 2,
        whiteSpace: 'pre-wrap',
        fontFamily: 'Roboto Mono, monospace',
        fontSize: 14
      }}
    >
      <Box component="span">{before}</Box>
      {start === end ? (
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            borderLeft: '2px solid',
            borderColor: 'warning.main',
            height: '1.1em',
            verticalAlign: 'text-bottom',
            mx: 0.25
          }}
        />
      ) : (
        <Box
          component="span"
          sx={{
            bgcolor: 'warning.light',
            color: 'inherit',
            borderRadius: 0.5,
            px: 0.5,
            py: 0.25
          }}
        >
          {middle || ' '}
        </Box>
      )}
      <Box component="span">{after}</Box>
    </Box>
  );
};

function App() {
  const [expression, setExpression] = useState('1 + 2');
  const [state, setState] = useState<EvaluationState>({ status: 'idle' });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightRange, setHighlightRange] = useState<TextRange | null>(null);

  const provider = useMemo(() => new DefaultFsDataProvider(), []);

  const handleEvaluate = () => {
    setIsEvaluating(true);
    try {
      const block = FuncScriptParser.parse(provider, expression);
      const typed = ensureTyped(block.evaluate(provider));
      const plain = convertTypedValue(typed);
      const typeName = getTypeName(typed[0]);
      const parseTree = buildParseTree(block);
      setState({
        status: 'success',
        typed,
        typeName,
        plain,
        parseTree,
        expressionText: expression
      });
      setSelectedNodeId(parseTree.id);
      setHighlightRange(parseTree.range ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState({ status: 'error', message });
      setSelectedNodeId(null);
      setHighlightRange(null);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNodeSelect = useCallback((node: ParseTreeNode) => {
    setSelectedNodeId(node.id);
    setHighlightRange(node.range ?? null);
  }, []);

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
                <Divider />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Parse Tree
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Click a node to highlight the matching part of the evaluated expression.
                  </Typography>
                  {state.parseTree ? (
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={2.5}
                      alignItems="stretch"
                    >
                      <Box flex={1} minWidth={0}>
                        <ParseTreeNodeView
                          node={state.parseTree}
                          onSelect={handleNodeSelect}
                          selectedId={selectedNodeId}
                        />
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          Expression Highlight
                        </Typography>
                        <HighlightedExpression
                          expression={state.expressionText}
                          highlight={highlightRange}
                        />
                      </Box>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Parse details are unavailable for this expression.
                    </Typography>
                  )}
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
