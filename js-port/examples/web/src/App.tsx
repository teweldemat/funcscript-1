import { useCallback, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { alpha } from '@mui/material/styles';
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
  valueOf,
  colorParseTree
} from 'walya';
// walya parser is provided as CommonJS without type definitions
import * as parserModule from 'walya/parser';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { WalyaParser } = parserModule as { WalyaParser: any };

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

const highlightAccent = '#ffb300';
const parseNodePalette = [
  '#1E88E5',
  '#D81B60',
  '#43A047',
  '#FB8C00',
  '#8E24AA',
  '#00ACC1',
  '#FDD835',
  '#5E35B1',
  '#6D4C41',
  '#00897B',
  '#E53935',
  '#7CB342'
];

type TextRange = {
  start: number;
  end: number;
};

type ColoredSegment = {
  start: number;
  end: number;
  nodeType: string;
  color: string | null;
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
      evaluationTree: ParseTreeNode | null;
      parseTree: ParseTreeNode | null;
      expressionText: string;
      colorSegments: ColoredSegment[];
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

const buildParseNodeTree = (node: any, expression: string, path = '0'): ParseTreeNode => {
  if (node && typeof node === 'object' && typeof node.NodeType === 'string') {
    const range = getNodeRange(node);
    const childrenSource = Array.isArray(node.Childs) ? node.Childs : [];
    const children = childrenSource
      .filter(Boolean)
      .map((child: any, index: number) => buildParseNodeTree(child, expression, `${path}.${index}`));
    const detail = range ? expression.slice(range.start, range.end).trim() || undefined : undefined;
    return {
      id: path,
      label: `Parse: ${node.NodeType}`,
      detail,
      range,
      children
    };
  }

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
      const childNode = buildParseNodeTree(kv?.ValueExpression, expression, `${path}.${index}`);
      const keyLabel = typeof kv?.Key === 'string' ? kv.Key : `entry ${index + 1}`;
      return {
        ...childNode,
        label: `${childNode.label} (${keyLabel})`
      };
    });

    if (node?.singleReturn) {
      const returnNode = buildParseNodeTree(node.singleReturn, expression, `${path}.${children.length}`);
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

  if (node?.constructor?.name === 'FunctionCallExpression') {
    const fnExpression = node?.Function ?? node?.functionExpression;
    const params = Array.isArray(node?.Parameters)
      ? node.Parameters
      : Array.isArray(node?.parameters)
        ? node.parameters
        : [];

    const fnValue = fnExpression?.value?.[1];
    const fnCallType = typeof fnValue?.callType === 'string' ? fnValue.callType.toLowerCase() : '';
    const isInfixCall = fnCallType === 'infix' || fnCallType === 'dual';
    const operatorSymbol = typeof fnValue?.symbol === 'string' && fnValue.symbol.trim().length ? fnValue.symbol : null;

    if (isInfixCall && params.length >= 2) {
      const operandNodes: Array<{ raw: Record<string, unknown>; tree: ParseTreeNode }> = params
        .filter((child: any): child is Record<string, unknown> => Boolean(child))
        .map((child: Record<string, unknown>, index: number) => ({
          raw: child,
          tree: buildParseNodeTree(child, expression, `${path}.${index * 2}`)
        }));

      const operatorNodes: ParseTreeNode[] = [];
      for (let idx = 0; idx < params.length - 1; idx += 1) {
        const leftRaw = params[idx];
        const rightRaw = params[idx + 1];
        const leftRange = getNodeRange(leftRaw);
        const rightRange = getNodeRange(rightRaw);
        if (!leftRange || !rightRange) {
          continue;
        }
        const start = leftRange.end;
        const end = Math.max(start, rightRange.start);
        if (end < start) {
          continue;
        }
        const detailSlice = expression.slice(start, end);
        operatorNodes.push({
          id: `${path}.op${idx}`,
          label: operatorSymbol ? `Operator ${operatorSymbol}` : 'Operator',
          detail: detailSlice.trim() || operatorSymbol || detailSlice || 'operator',
          range: { start, end },
          children: []
        });
      }

      const children: ParseTreeNode[] = operandNodes.flatMap((operand, idx): ParseTreeNode[] => {
        const nodes: ParseTreeNode[] = [operand.tree];
        if (idx < operatorNodes.length) {
          nodes.push(operatorNodes[idx]);
        }
        return nodes;
      });

      return {
        id: path,
        label: baseInfo.label,
        detail: baseInfo.detail,
        range,
        children
      };
    }
  }

  const rawChildren = typeof node.getChilds === 'function' ? node.getChilds() : [];
  const children = Array.isArray(rawChildren)
    ? rawChildren
        .filter((child): child is Record<string, unknown> => Boolean(child))
        .map((child, index) => buildParseNodeTree(child, expression, `${path}.${index}`))
    : [];

  return {
    id: path,
    label: baseInfo.label,
    detail: baseInfo.detail,
    range,
    children
  };
};

const buildEvaluationTree = (node: any, expression: string, path = '0'): ParseTreeNode => {
  if (!node || typeof node !== 'object') {
    return {
      id: path,
      label: 'Unknown',
      children: []
    };
  }

  const baseInfo = describeNode(node);
  const range = getNodeRange(node);

  const childrenSource = typeof node.getChilds === 'function' ? node.getChilds() : [];
  const children = Array.isArray(childrenSource)
    ? childrenSource
        .filter((child): child is Record<string, unknown> => Boolean(child))
        .map((child, index) => buildEvaluationTree(child, expression, `${path}.${index}`))
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

const computeColorSegments = (node: unknown, expression: string): ColoredSegment[] => {
  const length = expression.length;
  if (!node || length === 0) {
    return length
      ? [
          {
            start: 0,
            end: length,
            nodeType: 'Expression',
            color: null
          }
        ]
      : [];
  }

  const rawSegments = colorParseTree(node as any);
  const normalized = Array.isArray(rawSegments)
    ? rawSegments
        .map((segment) => {
          const pos = typeof segment?.Pos === 'number' ? segment.Pos : Number(segment?.Pos ?? 0);
          const len = typeof segment?.Length === 'number' ? segment.Length : Number(segment?.Length ?? 0);
          const nodeType = typeof segment?.NodeType === 'string'
            ? segment.NodeType
            : String(segment?.NodeType ?? 'Node');
          const start = Number.isFinite(pos) ? pos : 0;
          const end = Number.isFinite(len) ? start + len : start;
          const safe = sanitizeRange({ start, end }, length);
          if (!safe || safe.start === safe.end) {
            return null;
          }
          return {
            start: safe.start,
            end: safe.end,
            nodeType
          };
        })
        .filter((segment): segment is { start: number; end: number; nodeType: string } => Boolean(segment))
        .sort((a, b) => (a.start === b.start ? a.end - b.end : a.start - b.start))
    : [];

  const colorMap = new Map<string, string>();
  let paletteIndex = 0;
  const getColor = (nodeType: string) => {
    if (colorMap.has(nodeType)) {
      return colorMap.get(nodeType)!;
    }
    const color = parseNodePalette[paletteIndex % parseNodePalette.length];
    paletteIndex += 1;
    colorMap.set(nodeType, color);
    return color;
  };

  const segments: ColoredSegment[] = [];
  let cursor = 0;

  for (const segment of normalized) {
    const start = Math.max(cursor, segment.start);
    const end = Math.max(start, segment.end);

    if (start > cursor) {
      segments.push({
        start: cursor,
        end: start,
        nodeType: 'Whitespace',
        color: null
      });
    }

    if (end > start) {
      segments.push({
        start,
        end,
        nodeType: segment.nodeType,
        color: getColor(segment.nodeType)
      });
    }

    cursor = end;
  }

  if (cursor < length) {
    segments.push({
      start: cursor,
      end: length,
      nodeType: 'Whitespace',
      color: null
    });
  }

  if (segments.length === 0 && length > 0) {
    segments.push({
      start: 0,
      end: length,
      nodeType: 'Expression',
      color: null
    });
  }

  return segments;
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
  segments?: ColoredSegment[];
};

const HighlightedExpression = ({ expression, highlight, segments = [] }: HighlightProps) => {
  const length = expression.length;
  const safeHighlight = sanitizeRange(highlight, length);

  const prepared = (segments.length
    ? segments
    : length
    ? [{ start: 0, end: length, nodeType: 'Expression', color: null }]
    : [])
    .map((segment) => {
      const safe = sanitizeRange({ start: segment.start, end: segment.end }, length);
      if (!safe || safe.start === safe.end) {
        return null;
      }
      return {
        ...segment,
        start: safe.start,
        end: safe.end
      };
    })
    .filter((segment): segment is ColoredSegment => Boolean(segment))
    .sort((a, b) => (a.start === b.start ? a.end - b.end : a.start - b.start));

  const filled: ColoredSegment[] = [];
  let cursor = 0;
  for (const segment of prepared) {
    const start = Math.max(cursor, segment.start);
    const end = Math.max(start, segment.end);
    if (start > cursor) {
      filled.push({ start: cursor, end: start, nodeType: 'Expression', color: null });
    }
    if (end > start) {
      filled.push({ ...segment, start, end });
    }
    cursor = end;
  }
  if (cursor < length) {
    filled.push({ start: cursor, end: length, nodeType: 'Expression', color: null });
  }

  const parts: JSX.Element[] = [];
  let keyCounter = 0;

  const pushPart = (
    partStart: number,
    partEnd: number,
    color: string | null,
    isHighlight: boolean,
    nodeType: string
  ) => {
    if (partEnd <= partStart) {
      return;
    }
    const text = expression.slice(partStart, partEnd);
    const content = text.length ? text : ' ';

    const isColored = Boolean(color);
    const backgroundColor = isColored
      ? alpha(color!, isHighlight ? 0.45 : 0.18)
      : isHighlight
      ? alpha(highlightAccent, 0.3)
      : 'transparent';
    const borderTone = isColored
      ? alpha(color!, isHighlight ? 0.9 : 0.6)
      : isHighlight
      ? highlightAccent
      : 'transparent';
    const boxShadow = isHighlight
      ? `0 0 0 1px ${alpha(color ?? highlightAccent, 0.6)}`
      : undefined;

    parts.push(
      <Box
        component="span"
        key={`expr-${++keyCounter}`}
        sx={{
          display: 'inline',
          backgroundColor,
          color: 'inherit',
          borderRadius: isColored || isHighlight ? 0.5 : 0,
          px: isColored || isHighlight ? 0.35 : 0,
          py: isColored || isHighlight ? 0.1 : 0,
          borderBottom: isHighlight ? `2px solid ${borderTone}` : `1px solid ${borderTone}`,
          boxShadow,
          transition: 'all 0.12s ease-in-out',
          position: 'relative'
        }}
        title={`${nodeType}${isHighlight ? ' (selected)' : ''}`}
      >
        {content}
      </Box>
    );
  };

  for (const segment of filled) {
    if (!safeHighlight || safeHighlight.start >= segment.end || safeHighlight.end <= segment.start) {
      pushPart(segment.start, segment.end, segment.color, false, segment.nodeType);
      continue;
    }

    if (segment.start < safeHighlight.start) {
      pushPart(segment.start, Math.min(safeHighlight.start, segment.end), segment.color, false, segment.nodeType);
    }

    const highlightStart = Math.max(segment.start, safeHighlight.start);
    const highlightEnd = Math.min(segment.end, safeHighlight.end);
    pushPart(highlightStart, highlightEnd, segment.color, true, segment.nodeType);

    if (safeHighlight.end < segment.end) {
      pushPart(Math.max(safeHighlight.end, segment.start), segment.end, segment.color, false, segment.nodeType);
    }
  }

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
      {parts.length > 0 ? parts : expression || ' '}
    </Box>
  );
};

function App() {
  const [expression, setExpression] = useState('1 + 2');
  const [state, setState] = useState<EvaluationState>({ status: 'idle' });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedEvaluationNodeId, setSelectedEvaluationNodeId] = useState<string | null>(null);
  const [selectedParseNodeId, setSelectedParseNodeId] = useState<string | null>(null);
  const [highlightRange, setHighlightRange] = useState<TextRange | null>(null);

  const provider = useMemo(() => new DefaultFsDataProvider(), []);

  const handleEvaluate = () => {
    setIsEvaluating(true);
    try {
      const { block, parseNode } = WalyaParser.parse(provider, expression);
      const typed = ensureTyped(block.evaluate(provider));
      const plain = convertTypedValue(typed);
      const typeName = getTypeName(typed[0]);
      const evaluationTree = buildEvaluationTree(block, expression);
      const parseTree = parseNode
        ? buildParseNodeTree(parseNode, expression)
        : buildParseNodeTree(block, expression);
      const colorSegments = computeColorSegments(parseNode, expression);
      setState({
        status: 'success',
        typed,
        typeName,
        plain,
        evaluationTree,
        parseTree,
        expressionText: expression,
        colorSegments
      });
      setSelectedEvaluationNodeId(evaluationTree?.id ?? null);
      setSelectedParseNodeId(parseTree?.id ?? null);
      setHighlightRange(parseTree?.range ?? evaluationTree?.range ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState({ status: 'error', message });
      setSelectedEvaluationNodeId(null);
      setSelectedParseNodeId(null);
      setHighlightRange(null);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleEvaluationSelect = useCallback((node: ParseTreeNode) => {
    setSelectedEvaluationNodeId(node.id);
    setHighlightRange(node.range ?? null);
  }, []);

  const handleParseSelect = useCallback((node: ParseTreeNode) => {
    setSelectedParseNodeId(node.id);
    setHighlightRange(node.range ?? null);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Typography variant="h3" component="h1" fontWeight={600}>
              Walya Playground
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter a Walya expression to evaluate it in the browser. Try list operations, lambdas, and more.
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
                    Expression Structure
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Explore the evaluation tree (runtime expression blocks) and the parse node tree (source syntax nodes). Clicking any node highlights the corresponding portion of the expression.
                  </Typography>
                  <Stack spacing={2.5}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={2.5}
                      alignItems="stretch"
                    >
                      <Box flex={1} minWidth={0}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          Evaluation Tree
                        </Typography>
                        {state.evaluationTree ? (
                          <ParseTreeNodeView
                            node={state.evaluationTree}
                            onSelect={handleEvaluationSelect}
                            selectedId={selectedEvaluationNodeId}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Evaluation tree is unavailable.
                          </Typography>
                        )}
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          Parse Node Tree
                        </Typography>
                        {state.parseTree ? (
                          <ParseTreeNodeView
                            node={state.parseTree}
                            onSelect={handleParseSelect}
                            selectedId={selectedParseNodeId}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Parse node tree is unavailable.
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Expression Highlight
                      </Typography>
                      <HighlightedExpression
                        expression={state.expressionText}
                        highlight={highlightRange}
                        segments={state.colorSegments}
                      />
                    </Box>
                  </Stack>
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
