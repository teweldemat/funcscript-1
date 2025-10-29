import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties
} from 'react';
import { Compartment, EditorState, StateField, type Range } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  keymap,
  drawSelection,
  highlightActiveLine
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { foldGutter, foldKeymap, foldService } from '@codemirror/language';
import { lineNumbers } from '@codemirror/view';
import { Engine } from '@tewelde/funcscript/browser';
import type { DefaultFsDataProvider } from '@tewelde/funcscript/browser';
import type { ColoredSegment } from './funcscriptColoring.js';
import { computeColoredSegments } from './funcscriptColoring.js';

// funcscript parser exposed via CommonJS build without type declarations
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import * as parserModule from '@tewelde/funcscript/parser';

const { FuncScriptParser } = parserModule as { FuncScriptParser: any };

/**
 * Props for the {@link FuncScriptEditor} component.
 */
export type FuncScriptEditorProps = {
  /**
   * Current FuncScript expression text to display inside the editor.
   */
  value: string;
  /**
   * Called with the updated text whenever the document changes.
   */
  onChange: (value: string) => void;
  /**
   * Optional callback fired with the list of colored segments generated from the FuncScript parse tree.
   */
  onSegmentsChange?: (segments: ColoredSegment[]) => void;
  /**
   * Optional callback invoked when parsing fails or succeeds (receives `null` on success).
   */
  onError?: (message: string | null) => void;
  /**
   * Minimum height, in pixels, applied to the editor surface.
   */
  minHeight?: number;
  /**
   * Inline styles applied to the editor container element.
   */
  style?: CSSProperties;
  /**
   * Optional key used to persist editor UI state (mode, tree expansion) in local storage.
   */
  saveKey?: string;
};

type HighlightCallbacks = {
  getSegmentsCallback: () => ((segments: ColoredSegment[]) => void) | undefined;
  getErrorCallback: () => ((message: string | null) => void) | undefined;
  getParseNodeCallback: () => ((node: RawParseNode | null) => void) | undefined;
};

type RawParseNode = {
  Pos?: number;
  pos?: number;
  Length?: number;
  length?: number;
  Childs?: RawParseNode[];
  childs?: RawParseNode[];
  Children?: RawParseNode[];
  children?: RawParseNode[];
  NodeType?: string;
  nodeType?: string;
  Type?: string;
  type?: string;
};

type FoldRange = {
  lineStart: number;
  from: number;
  to: number;
};

type FuncScriptAnalysis = {
  decorations: DecorationSet;
  segments: ColoredSegment[];
  foldRanges: FoldRange[];
  parseNode: RawParseNode | null;
};

type PersistedEditorState = {
  mode: 'standard' | 'tree';
  collapsedNodeIds: string[];
};

const STORAGE_PREFIX = 'funcscript-editor:';

const getStorageKey = (key: string) => `${STORAGE_PREFIX}${key}`;

const sanitizeCollapsedNodeIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
};

const loadPersistedState = (key: string): PersistedEditorState | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(getStorageKey(key));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedEditorState> | null;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const mode = parsed.mode === 'tree' ? 'tree' : 'standard';
    const collapsedNodeIds = sanitizeCollapsedNodeIds(parsed.collapsedNodeIds);
    return { mode, collapsedNodeIds };
  } catch {
    return null;
  }
};

const storePersistedState = (key: string, state: PersistedEditorState) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(getStorageKey(key), JSON.stringify(state));
  } catch {
    // Ignore storage failures (e.g. quota exceeded, private mode)
  }
};

const getAncestorNodeIds = (nodeId: string): string[] => {
  if (!nodeId || nodeId === 'root') {
    return [];
  }
  const segments = nodeId.split('-').filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return [];
  }
  const ancestors: string[] = ['root'];
  for (let index = 1; index < segments.length; index += 1) {
    ancestors.push(segments.slice(0, index).join('-'));
  }
  return ancestors;
};

const clampRange = (start: number, end: number, length: number) => {
  const safeStart = Math.max(0, Math.min(start, length));
  const safeEnd = Math.max(safeStart, Math.min(end, length));
  return safeEnd > safeStart ? { start: safeStart, end: safeEnd } : null;
};

const toNodeRange = (node: RawParseNode, docLength: number) => {
  const pos =
    typeof node.Pos === 'number' ? node.Pos : typeof node.pos === 'number' ? node.pos : null;
  const len =
    typeof node.Length === 'number'
      ? node.Length
      : typeof node.length === 'number'
      ? node.length
      : null;
  if (pos === null || len === null) {
    return null;
  }
  return clampRange(pos, pos + len, docLength);
};

const getChildNodes = (node: RawParseNode): RawParseNode[] => {
  const value = node.Childs ?? node.childs ?? node.Children ?? node.children;
  return Array.isArray(value) ? (value as RawParseNode[]) : [];
};

const collectFoldRanges = (root: RawParseNode, doc: EditorState['doc']): FoldRange[] => {
  if (doc.length === 0) {
    return [];
  }

  const stack: RawParseNode[] = [root];
  const byLine = new Map<number, FoldRange>();

  while (stack.length) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const range = toNodeRange(current, doc.length);
    if (range) {
      const { start, end } = range;
      if (end > start) {
        const startPos = Math.min(start, doc.length - 1);
        const endPos = Math.max(startPos, Math.min(end - 1, doc.length - 1));
        const startLine = doc.lineAt(startPos);
        const endLine = doc.lineAt(endPos);
        if (startLine.number < endLine.number) {
          const from = startLine.to;
          const to = endLine.from;
          if (to > from) {
            const existing = byLine.get(startLine.from);
            if (!existing || to - from > existing.to - existing.from) {
              byLine.set(startLine.from, {
                lineStart: startLine.from,
                from,
                to
              });
            }
          }
        }
      }
    }

    for (const child of getChildNodes(current)) {
      stack.push(child);
    }
  }

  return Array.from(byLine.values()).sort((a, b) => a.lineStart - b.lineStart);
};

type ParseTreeNode = {
  id: string;
  typeName: string;
  range: { start: number; end: number } | null;
  expression: string;
  isEditable: boolean;
  children: ParseTreeNode[];
};

// Node types that represent structural containers rather than standalone expressions.
const NON_EDITABLE_NODE_TYPES = new Set<string>([
  'FunctionParameterList',
  'FunctionParameter',
  'FunctionParameters',
  'LambdaParameterList',
  'LambdaParameters',
  'ArgumentList',
  'Arguments',
  'IdentifierList',
  'StatementList',
  'Block',
  'Operator',
  "Key"
]);

const isEditableTypeName = (typeName: string) => {
  if (!typeName) {
    return false;
  }
  if (NON_EDITABLE_NODE_TYPES.has(typeName)) {
    return false;
  }
  if (typeName.includes('Parameter')) {
    return false;
  }
  if (typeName.includes('Argument')) {
    return false;
  }
  if (typeName.endsWith('List') && !typeName.endsWith('ExpressionList')) {
    return false;
  }
  if (typeName.endsWith('Block') || typeName.endsWith('Body')) {
    return false;
  }
  return true;
};

const getNodeTypeName = (node: RawParseNode) => {
  if (typeof node.NodeType === 'string' && node.NodeType.length > 0) {
    return node.NodeType;
  }
  if (typeof node.nodeType === 'string' && node.nodeType.length > 0) {
    return node.nodeType;
  }
  if (typeof node.Type === 'string' && node.Type.length > 0) {
    return node.Type;
  }
  if (typeof node.type === 'string' && node.type.length > 0) {
    return node.type;
  }
  return 'Unknown';
};

const buildParseTree = (root: RawParseNode | null, docText: string): ParseTreeNode | null => {
  if (!root) {
    return null;
  }

  const docLength = docText.length;

  const collapseSingleChild = (node: RawParseNode, path: number[]) => {
    let currentNode = node;
    const collapsedPath = [...path];
    while (true) {
      const children = getChildNodes(currentNode);
      if (children.length !== 1) {
        break;
      }
      currentNode = children[0];
      collapsedPath.push(0);
    }
    return { node: currentNode, path: collapsedPath };
  };

  const collectDisplayChildren = (node: RawParseNode, path: number[]): ParseTreeNode[] => {
    const rawChildren = getChildNodes(node);
    const displayChildren: ParseTreeNode[] = [];
    for (let index = 0; index < rawChildren.length; index += 1) {
      const { node: collapsedNode, path: collapsedPath } = collapseSingleChild(
        rawChildren[index],
        [...path, index]
      );
      displayChildren.push(walk(collapsedNode, collapsedPath));
    }
    return displayChildren;
  };

  const walk = (node: RawParseNode, path: number[]): ParseTreeNode => {
    const range = toNodeRange(node, docLength);
    const expression = range ? docText.slice(range.start, range.end) : '';
    const typeName = getNodeTypeName(node);
    const children = collectDisplayChildren(node, path);
    const id = path.length === 0 ? 'root' : path.join('-');
    return {
      id,
      typeName,
      range,
      expression,
      isEditable: Boolean(range) && isEditableTypeName(typeName),
      children
    };
  };

  return walk(root, []);
};

const createParseNodeIndex = (root: ParseTreeNode | null) => {
  const map = new Map<string, ParseTreeNode>();

  const visit = (node: ParseTreeNode) => {
    map.set(node.id, node);
    for (const child of node.children) {
      visit(child);
    }
  };

  if (root) {
    visit(root);
  }

  return map;
};

const formatExpressionPreview = (expression: string) => {
  const condensed = expression.replace(/\s+/g, ' ').trim();
  if (condensed.length === 0) {
    return '';
  }
  if (condensed.length > 48) {
    return condensed.slice(0, 45) + '...';
  }
  return condensed;
};

const findNodeByRange = (
  root: ParseTreeNode | null,
  target: { start: number; end: number }
): ParseTreeNode | null => {
  if (!root) {
    return null;
  }

  let exactMatch: ParseTreeNode | null = null;
  let startMatch: { node: ParseTreeNode; diff: number } | null = null;
  let overlapMatch: { node: ParseTreeNode; diff: number } | null = null;

  const stack: ParseTreeNode[] = [root];
  while (stack.length) {
    const node = stack.pop();
    if (!node) {
      continue;
    }
    const range = node.range;
    if (range) {
      if (range.start === target.start && range.end === target.end) {
        exactMatch = node;
        break;
      }

      if (range.start === target.start) {
        const diff = Math.abs(range.end - target.end);
        if (!startMatch || diff < startMatch.diff) {
          startMatch = { node, diff };
        }
      }

      const overlaps = !(range.end <= target.start || range.start >= target.end);
      if (overlaps) {
        const diff = Math.abs(range.start - target.start) + Math.abs(range.end - target.end);
        if (!overlapMatch || diff < overlapMatch.diff) {
          overlapMatch = { node, diff };
        }
      }
    }

    for (const child of node.children) {
      stack.push(child);
    }
  }

  if (exactMatch) {
    return exactMatch;
  }
  if (startMatch) {
    return startMatch.node;
  }
  if (overlapMatch) {
    return overlapMatch.node;
  }
  return null;
};

const findFirstEditableNode = (root: ParseTreeNode | null): ParseTreeNode | null => {
  if (!root) {
    return null;
  }
  if (root.isEditable) {
    return root;
  }
  for (const child of root.children) {
    const match = findFirstEditableNode(child);
    if (match) {
      return match;
    }
  }
  return null;
};

const TREE_NODE_INDENT = 12;

type ParseTreeListProps = {
  node: ParseTreeNode;
  level: number;
  selectedId: string | null;
  collapsedNodeIds: Set<string>;
  onToggleNode: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
};

const treeButtonBaseStyle: CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: '1px solid transparent',
  textAlign: 'left',
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: 12,
  transition: 'background-color 0.1s ease'
};

const treeRowBaseStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4
};

const treeToggleButtonStyle: CSSProperties = {
  width: 18,
  height: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid transparent',
  borderRadius: 4,
  background: 'transparent',
  color: '#57606a',
  cursor: 'pointer',
  padding: 0,
  fontSize: 10
};

const treeToggleSpacerStyle: CSSProperties = {
  width: 18,
  height: 18
};

const nonEditableTreeLabelStyle: CSSProperties = {
  ...treeButtonBaseStyle,
  color: '#57606a',
  cursor: 'default'
};

const ParseTreeList = ({
  node,
  level,
  selectedId,
  collapsedNodeIds,
  onToggleNode,
  onSelect
}: ParseTreeListProps) => {
  const expressionLabel = formatExpressionPreview(node.expression);
  const isSelected = node.id === selectedId;
  const isEditable = node.isEditable;
  const displayLabel = expressionLabel || node.typeName;
  const title = expressionLabel ? `${node.typeName}:${expressionLabel}` : node.typeName;
  const hasChildren = node.children.length > 0;
  const isCollapsed = hasChildren && collapsedNodeIds.has(node.id);

  const rowStyle: CSSProperties = {
    ...treeRowBaseStyle,
    marginLeft: level * TREE_NODE_INDENT
  };

  const buttonStyle: CSSProperties = {
    ...treeButtonBaseStyle,
    backgroundColor: isSelected ? '#0366d6' : 'transparent',
    color: isSelected ? '#ffffff' : '#24292f',
    cursor: isEditable ? 'pointer' : 'default'
  };

  return (
    <div>
      <div style={rowStyle}>
        {hasChildren ? (
          <button
            type="button"
            style={treeToggleButtonStyle}
            onClick={() => onToggleNode(node.id)}
            aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} node ${displayLabel}`}
          >
            {isCollapsed ? '▸' : '▾'}
          </button>
        ) : (
          <span style={treeToggleSpacerStyle} />
        )}
        {isEditable ? (
          <button type="button" style={buttonStyle} onClick={() => onSelect(node.id)} title={title}>
            {displayLabel}
          </button>
        ) : (
          <span style={nonEditableTreeLabelStyle} title={title}>
            {displayLabel}
          </span>
        )}
      </div>
      {hasChildren && !isCollapsed &&
        node.children.map((child) => (
          <ParseTreeList
            key={child.id}
            node={child}
            level={level + 1}
            selectedId={selectedId}
            collapsedNodeIds={collapsedNodeIds}
            onToggleNode={onToggleNode}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
};

const containerBaseStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid #d0d7de',
  borderRadius: 6,
  backgroundColor: '#ffffff',
  overflow: 'hidden'
};

const titleBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 8px',
  borderBottom: '1px solid #d0d7de',
  backgroundColor: '#f6f8fa',
  gap: 8
};

const titleTextStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#24292f'
};

const titleControlsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6
};

const modeButtonBaseStyle: CSSProperties = {
  border: '1px solid #d0d7de',
  backgroundColor: '#ffffff',
  color: '#24292f',
  borderRadius: 4,
  fontSize: 12,
  padding: '2px 8px',
  cursor: 'pointer'
};

const modeButtonActiveStyle: CSSProperties = {
  backgroundColor: '#24292f',
  color: '#ffffff',
  borderColor: '#24292f'
};

const modeButtonDisabledStyle: CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed'
};

const bodyBaseStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  minHeight: 0,
  flex: 1
};

const treePaneBaseStyle: CSSProperties = {
  width: 260,
  borderRight: '1px solid #d0d7de',
  overflowY: 'auto',
  padding: '8px 4px',
  backgroundColor: '#fafbfc'
};

const treeEmptyStyle: CSSProperties = {
  fontSize: 12,
  color: '#57606a',
  padding: '4px 6px'
};

const editorPaneBaseStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column'
};

const codeMirrorContainerBaseStyle: CSSProperties = {
  flex: 1
};

const nodeInfoStyle: CSSProperties = {
  fontSize: 12,
  padding: '6px 12px',
  borderBottom: '1px solid #e1e4e8',
  backgroundColor: '#f6f8fa',
  color: '#24292f'
};

const treeEditorContainerBaseStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  position: 'relative',
  borderTop: '1px solid #e1e4e8',
  backgroundColor: '#ffffff'
};

const treeEditorCodeMirrorStyle: CSSProperties = {
  position: 'absolute',
  inset: 0
};

const treeEditorOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  color: '#57606a',
  pointerEvents: 'auto',
  backgroundColor: 'rgba(246, 248, 250, 0.85)'
};

const nodeErrorStyle: CSSProperties = {
  fontSize: 12,
  color: '#cf222e',
  padding: '4px 12px',
  backgroundColor: '#ffebeb',
  borderBottom: '1px solid #ffd7d5'
};

const expressionPreviewContainerStyle: CSSProperties = {
  fontSize: 11,
  lineHeight: 1.4,
  fontFamily: 'Roboto Mono, monospace',
  padding: '8px 12px',
  borderTop: '1px solid #e1e4e8',
  backgroundColor: '#f6f8fa',
  color: '#57606a',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word'
};

const expressionSelectedTextStyle: CSSProperties = {
  textDecoration: 'underline',
  fontWeight: 600,
  color: '#24292f'
};

const createFuncScriptExtensions = (
  provider: DefaultFsDataProvider,
  callbacks: HighlightCallbacks
) => {
  const { getSegmentsCallback, getErrorCallback, getParseNodeCallback } = callbacks;

  const analyze = (state: EditorState): FuncScriptAnalysis => {
    const expression = state.doc.toString();
    let parseNode: RawParseNode | null = null;
    let errorMessage: string | null = null;

    if (expression.trim().length > 0) {
      try {
        const result = FuncScriptParser.parse(provider, expression);
        parseNode = (result?.parseNode as RawParseNode) ?? null;
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : String(error);
      }
    }

    const segments = computeColoredSegments(expression, parseNode);

    const decorations: Range<Decoration>[] = [];
    for (const segment of segments) {
      if (!segment.color) {
        continue;
      }

      const style =
        'color:' +
        segment.color +
        ';font-weight:600;text-shadow:0 0 0.6px rgba(0,0,0,0.25);';
      decorations.push(
        Decoration.mark({
          attributes: {
            style
          }
        }).range(segment.start, segment.end)
      );
    }

    const segmentsCallback = getSegmentsCallback();
    if (segmentsCallback) {
      segmentsCallback(segments);
    }
    const errorCallback = getErrorCallback();
    if (errorCallback) {
      errorCallback(errorMessage);
    }
    const parseNodeCallback = getParseNodeCallback();
    if (parseNodeCallback) {
      parseNodeCallback(parseNode);
    }

    const foldRanges = parseNode ? collectFoldRanges(parseNode, state.doc) : [];

    return {
      decorations: Decoration.set(decorations, true),
      segments,
      foldRanges,
      parseNode
    };
  };

  const analysisField = StateField.define<FuncScriptAnalysis>({
    create(state) {
      return analyze(state);
    },
    update(value, tr) {
      if (!tr.docChanged) {
        return value;
      }
      return analyze(tr.state);
    }
  });

  const highlightPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = view.state.field(analysisField).decorations;
      }

      update(update: ViewUpdate) {
        if (update.docChanged) {
          this.decorations = update.state.field(analysisField).decorations;
        }
      }
    },
    {
      decorations: (value) => value.decorations
    }
  );

  const folding = foldService.of((state, lineStart, _lineEnd) => {
    const analysis = state.field(analysisField, false);
    if (!analysis) {
      return null;
    }
    for (const range of analysis.foldRanges) {
      if (range.lineStart === lineStart) {
        return { from: range.from, to: range.to };
      }
    }
    return null;
  });

  return [analysisField, highlightPlugin, folding];
};

/**
 * CodeMirror-powered editor with FuncScript-aware parsing, syntax coloring, folding, and telemetry.
 */
const FuncScriptEditor = ({
  value,
  onChange,
  onSegmentsChange,
  onError,
  minHeight = 260,
  style,
  saveKey
}: FuncScriptEditorProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeEditorContainerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const nodeEditorViewRef = useRef<EditorView | null>(null);
  const providerRef = useRef<DefaultFsDataProvider | null>(null);

  const initialSavedState = useMemo(() => (saveKey ? loadPersistedState(saveKey) : null), [saveKey]);

  const [mode, setMode] = useState<'standard' | 'tree'>(() => initialSavedState?.mode ?? 'standard');
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(
    () => new Set(initialSavedState?.collapsedNodeIds ?? [])
  );
  const [currentParseNode, setCurrentParseNode] = useState<RawParseNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pendingNodeValue, setPendingNodeValue] = useState('');
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [currentParseError, setCurrentParseError] = useState<string | null>(null);
  const [nodeEditorParseError, setNodeEditorParseError] = useState<string | null>(null);

  useEffect(() => {
    console.log('pendingNodeValue state', pendingNodeValue);
  }, [pendingNodeValue]);

  const segmentsCallbackRef = useRef(onSegmentsChange);
  const userErrorCallbackRef = useRef(onError);
  const parseNodeCallbackRef = useRef<(node: RawParseNode | null) => void>(() => {});
  const analysisErrorCallbackRef = useRef<(message: string | null) => void>(() => {});
  const nodeEditorErrorCallbackRef = useRef<(message: string | null) => void>(() => {});
  const selectedNodeRef = useRef<ParseTreeNode | null>(null);
  const nodeEditorEditableCompartment = useRef(new Compartment());
  const pendingSelectionRangeRef = useRef<{ start: number; end: number } | null>(null);
  const hadParseTreeRef = useRef(false);

  const handleParseNodeUpdate = useCallback((node: RawParseNode | null) => {
    setCurrentParseNode(node);
  }, []);

  parseNodeCallbackRef.current = handleParseNodeUpdate;

  analysisErrorCallbackRef.current = (message) => {
    setCurrentParseError(message);
    const external = userErrorCallbackRef.current;
    if (external) {
      external(message);
    }
  };

  nodeEditorErrorCallbackRef.current = (message) => {
    if (message) {
      console.log('node editor parse error', { message, pendingNodeValue });
    }
    setNodeEditorParseError(message);
  };

  useEffect(() => {
    segmentsCallbackRef.current = onSegmentsChange;
  }, [onSegmentsChange]);

  useEffect(() => {
    userErrorCallbackRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!saveKey) {
      setMode((prev) => (prev === 'standard' ? prev : 'standard'));
      setCollapsedNodeIds((prev) => (prev.size === 0 ? prev : new Set<string>()));
      return;
    }
    const stored = loadPersistedState(saveKey);
    const desiredMode = stored?.mode ?? 'standard';
    setMode((prev) => (prev === desiredMode ? prev : desiredMode));
    setCollapsedNodeIds((prev) => {
      const next = new Set<string>(stored?.collapsedNodeIds ?? []);
      if (prev.size === next.size) {
        let identical = true;
        for (const id of prev) {
          if (!next.has(id)) {
            identical = false;
            break;
          }
        }
        if (identical) {
          return prev;
        }
      }
      return next;
    });
  }, [saveKey]);

  useEffect(() => {
    if (!saveKey) {
      return;
    }
    storePersistedState(saveKey, {
      mode,
      collapsedNodeIds: Array.from(collapsedNodeIds)
    });
  }, [saveKey, mode, collapsedNodeIds]);

  const parseTree = useMemo(() => buildParseTree(currentParseNode, value), [currentParseNode, value]);
  const parseNodeMap = useMemo(() => createParseNodeIndex(parseTree), [parseTree]);
  const firstEditableNode = useMemo(() => findFirstEditableNode(parseTree), [parseTree]);
  const selectedNode = selectedNodeId ? parseNodeMap.get(selectedNodeId) ?? null : null;

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
    const view = nodeEditorViewRef.current;
    if (!view) {
      return;
    }
    const isEditable = Boolean(selectedNode?.range && selectedNode?.isEditable);
    view.dispatch({
      effects: nodeEditorEditableCompartment.current.reconfigure(
        EditorView.editable.of(isEditable)
      )
    });
  }, [selectedNode]);

  useEffect(() => {
    if (parseTree) {
      hadParseTreeRef.current = true;
      return;
    }
    if (mode === 'tree' && hadParseTreeRef.current) {
      setMode('standard');
    }
  }, [mode, parseTree]);

  useEffect(() => {
    if (parseTree) {
      return;
    }
    if (selectedNodeId !== null) {
      setSelectedNodeId(null);
    }
    if (pendingNodeValue !== '') {
      console.log('setPendingNodeValue reset (no parseTree)');
      setPendingNodeValue('');
    }
    if (hasPendingChanges) {
      setHasPendingChanges(false);
    }
    if (nodeEditorParseError) {
      setNodeEditorParseError(null);
    }
  }, [parseTree, selectedNodeId, pendingNodeValue, hasPendingChanges, nodeEditorParseError]);

  useEffect(() => {
    if (!parseTree) {
      setCollapsedNodeIds((prev) => (prev.size === 0 ? prev : new Set<string>()));
      return;
    }
    const validIds = new Set<string>();
    const stack: ParseTreeNode[] = [parseTree];
    while (stack.length) {
      const current = stack.pop();
      if (!current) {
        continue;
      }
      validIds.add(current.id);
      for (const child of current.children) {
        stack.push(child);
      }
    }
    setCollapsedNodeIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (validIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      if (!changed) {
        return prev;
      }
      return next;
    });
  }, [parseTree]);

  useEffect(() => {
    if (!parseTree) {
      return;
    }
    const pendingRange = pendingSelectionRangeRef.current;
    console.log('parseTree effect', {
      hasPendingChanges,
      hasPendingRange: Boolean(pendingRange)
    });
    if (!pendingRange && hasPendingChanges) {
      return;
    }
    if (pendingRange) {
      const safeStart = Math.max(0, Math.min(pendingRange.start, value.length));
      const safeEnd = Math.max(safeStart, Math.min(pendingRange.end, value.length));
      const docFragment = value.slice(safeStart, safeEnd);
      if (docFragment !== pendingNodeValue) {
        return;
      }
      const replacement = findNodeByRange(parseTree, pendingRange);
      if (replacement && replacement.isEditable) {
        const range = replacement.range;
        if (!range || range.start !== pendingRange.start || range.end !== pendingRange.end) {
          return;
        }
        pendingSelectionRangeRef.current = null;
        setSelectedNodeId(replacement.id);
        setPendingNodeValue(replacement.expression);
        setHasPendingChanges(false);
        setNodeEditorParseError(null);
        return;
      }
      pendingSelectionRangeRef.current = null;
    }
    if (selectedNodeId) {
      const existing = parseNodeMap.get(selectedNodeId);
      if (existing && existing.isEditable) {
        return;
      }
    }
    const fallback = firstEditableNode;
    if (fallback) {
      pendingSelectionRangeRef.current = null;
      setSelectedNodeId(fallback.id);
      setPendingNodeValue(fallback.expression);
      setHasPendingChanges(false);
      setNodeEditorParseError(null);
      return;
    }
    pendingSelectionRangeRef.current = null;
    setSelectedNodeId(null);
    setHasPendingChanges(false);
    setNodeEditorParseError(null);
  }, [
    parseTree,
    parseNodeMap,
    selectedNodeId,
    firstEditableNode,
    hasPendingChanges,
    value,
    pendingNodeValue
  ]);

  useEffect(() => {
    if (!selectedNode) {
      return;
    }
    if (!selectedNode.isEditable) {
      return;
    }
    if (!hasPendingChanges && !pendingSelectionRangeRef.current) {
      setNodeEditorParseError(null);
    }
  }, [selectedNode, hasPendingChanges]);

  useEffect(() => {
    if (!selectedNodeId) {
      return;
    }
    setCollapsedNodeIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const ancestorId of getAncestorNodeIds(selectedNodeId)) {
        if (ancestorId === 'root') {
          continue;
        }
        if (next.delete(ancestorId)) {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [selectedNodeId]);

  const handleToggleNode = useCallback((nodeId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      if (selectedNodeId === nodeId) {
        return;
      }
      const node = parseNodeMap.get(nodeId);
      if (!node) {
        return;
      }
      if (!node.isEditable) {
        return;
      }
      setSelectedNodeId(nodeId);
      console.log('setPendingNodeValue select', node.expression);
      setPendingNodeValue(node.expression);
      setHasPendingChanges(false);
      setNodeEditorParseError(null);
      pendingSelectionRangeRef.current = null;
    },
    [parseNodeMap, selectedNodeId]
  );

  const handleApplyChanges = useCallback(() => {
    if (!selectedNode || !selectedNode.range || !selectedNode.isEditable) {
      return;
    }
    if (!hasPendingChanges) {
      return;
    }
    console.log('handleApplyChanges invoked', new Error().stack);
    const { start, end } = selectedNode.range;
    const nextDoc = value.slice(0, start) + pendingNodeValue + value.slice(end);
    pendingSelectionRangeRef.current = {
      start,
      end: start + pendingNodeValue.length
    };
    onChange(nextDoc);
    setHasPendingChanges(false);
  }, [selectedNode, hasPendingChanges, pendingNodeValue, value, onChange]);

  const mergedContainerStyle = useMemo(
    () => ({
      ...containerBaseStyle,
      ...(style ?? {})
    }),
    [style]
  );

  const contentStyle = useMemo(() => {
    const base: CSSProperties = { ...bodyBaseStyle };
    if (mode === 'tree') {
      base.minHeight = minHeight;
    }
    return base;
  }, [mode, minHeight]);

  const codeMirrorContainerStyle = useMemo(
    () => ({
      ...codeMirrorContainerBaseStyle,
      display: mode === 'tree' ? 'none' : 'block'
    }),
    [mode]
  );

  const treeEditorContainerStyle = useMemo(
    () => ({
      ...treeEditorContainerBaseStyle,
      minHeight
    }),
    [minHeight]
  );

  const standardButtonStyle = useMemo(
    () => ({
      ...modeButtonBaseStyle,
      ...(mode === 'standard' ? modeButtonActiveStyle : {})
    }),
    [mode]
  );

  const treeButtonStyle = useMemo(
    () => ({
      ...modeButtonBaseStyle,
      ...(mode === 'tree' ? modeButtonActiveStyle : {}),
      ...(!parseTree ? modeButtonDisabledStyle : {})
    }),
    [mode, parseTree]
  );

  const canApplyChanges =
    mode === 'tree' &&
    Boolean(selectedNode?.range && selectedNode?.isEditable) &&
    hasPendingChanges &&
    !currentParseError &&
    !nodeEditorParseError;

  const applyButtonStyle = useMemo(
    () => ({
      ...modeButtonBaseStyle,
      fontWeight: 600
    }),
    []
  );

  useEffect(() => {
    if (mode !== 'tree') {
      if (nodeEditorViewRef.current) {
        nodeEditorViewRef.current.destroy();
        nodeEditorViewRef.current = null;
      }
      if (nodeEditorParseError !== null) {
        setNodeEditorParseError(null);
      }
      return;
    }

    if (!nodeEditorContainerRef.current) {
      return;
    }

    if (nodeEditorViewRef.current) {
      return;
    }

    const provider = providerRef.current ?? new Engine.DefaultFsDataProvider();
    if (!providerRef.current) {
      providerRef.current = provider;
    }

    const nodeExtensions = createFuncScriptExtensions(provider, {
      getSegmentsCallback: () => undefined,
      getErrorCallback: () => nodeEditorErrorCallbackRef.current,
      getParseNodeCallback: () => undefined
    });

    const view = new EditorView({
      state: EditorState.create({
        doc: pendingNodeValue,
        extensions: [
          history(),
          drawSelection(),
          highlightActiveLine(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.lineWrapping,
          EditorView.theme(
            {
              '&': {
                fontFamily: 'Roboto Mono, monospace',
                minHeight: `${minHeight}px`
              },
              '.cm-content': {
                padding: '16px 0'
              },
              '.cm-scroller': {
                overflow: 'auto'
              }
            },
            { dark: false }
          ),
          ...nodeExtensions,
          nodeEditorEditableCompartment.current.of(
            EditorView.editable.of(
              Boolean(selectedNodeRef.current?.range && selectedNodeRef.current?.isEditable)
            )
          ),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const nextValue = update.state.doc.toString();
              console.log('node editor update', {
                nextValue,
                stack: new Error().stack
              });
              setPendingNodeValue(nextValue);
              const node = selectedNodeRef.current;
              if (node && node.isEditable) {
                setHasPendingChanges(nextValue !== node.expression);
              } else {
                setHasPendingChanges(false);
              }
            }
          })
        ]
      }),
      parent: nodeEditorContainerRef.current
    });

    nodeEditorViewRef.current = view;

    return () => {
      view.destroy();
      nodeEditorViewRef.current = null;
    };
  }, [mode, minHeight]);

  useEffect(() => {
    const view = nodeEditorViewRef.current;
    if (!view) {
      return;
    }
    const currentValue = view.state.doc.toString();
    if (currentValue !== pendingNodeValue) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: pendingNodeValue
        }
      });
    }
  }, [pendingNodeValue]);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const provider = new Engine.DefaultFsDataProvider();
    providerRef.current = provider;

    const funcscriptExtensions = createFuncScriptExtensions(provider, {
      getSegmentsCallback: () => segmentsCallbackRef.current,
      getErrorCallback: () => analysisErrorCallbackRef.current,
      getParseNodeCallback: () => parseNodeCallbackRef.current
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        drawSelection(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab, ...foldKeymap]),
        lineNumbers(),
        EditorView.lineWrapping,
        foldGutter(),
        EditorView.theme(
          {
            '&': {
              fontFamily: 'Roboto Mono, monospace',
              minHeight: `${minHeight}px`
            },
            '.cm-content': {
              padding: '16px 0'
            },
            '.cm-scroller': {
              overflow: 'auto'
            }
          },
          { dark: false }
        ),
        ...funcscriptExtensions,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const nextValue = update.state.doc.toString();
            onChange(nextValue);
          }
        })
      ]
    });

    const view = new EditorView({
      state,
      parent: containerRef.current
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
      providerRef.current = null;
      setCurrentParseNode(null);
    };
  }, [minHeight, onChange]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value
        }
      });
    }
  }, [value]);

  const selectedLabel =
    selectedNode
      ? `${selectedNode.typeName}:${formatExpressionPreview(selectedNode.expression)}`
      : parseTree
      ? 'Select an editable node from the tree'
      : 'No node selected';

  const treeEditorOverlayMessage = useMemo(() => {
    if (!parseTree) {
      return 'Parse tree unavailable. Resolve syntax errors to enable tree mode.';
    }
    if (!firstEditableNode) {
      return 'No editable nodes available for this expression.';
    }
    if (!selectedNode) {
      return 'Select an editable node to modify';
    }
    if (!selectedNode.isEditable) {
      return 'This node is read-only';
    }
    return '';
  }, [parseTree, selectedNode, firstEditableNode]);

  const expressionPreviewSegments = useMemo(() => {
    if (!value) {
      return null;
    }
    const range = selectedNode?.range;
    if (!range || !selectedNode?.isEditable) {
      return {
        before: value,
        selection: '',
        after: '',
        hasSelection: false
      };
    }
    const start = Math.max(0, Math.min(range.start, value.length));
    const end = Math.max(start, Math.min(range.end, value.length));
    if (end <= start) {
      return {
        before: value,
        selection: '',
        after: '',
        hasSelection: false
      };
    }
    return {
      before: value.slice(0, start),
      selection: value.slice(start, end),
      after: value.slice(end),
      hasSelection: true
    };
  }, [selectedNode, value]);

  return (
    <div style={mergedContainerStyle}>
      <div style={titleBarStyle}>
        <span style={titleTextStyle}>{mode === 'tree' ? 'Tree Mode' : 'Standard Mode'}</span>
        <div style={titleControlsStyle}>
          <button type="button" style={standardButtonStyle} onClick={() => setMode('standard')}>
            Standard
          </button>
          <button
            type="button"
            style={treeButtonStyle}
            onClick={() => {
              if (parseTree) {
                setMode('tree');
              }
            }}
            disabled={!parseTree}
            data-testid="tree-mode-toggle"
          >
            Tree
          </button>
          {canApplyChanges && (
            <button
              type="button"
              style={applyButtonStyle}
              onPointerUp={(event) => {
                if (event.pointerType && event.button !== 0) {
                  return;
                }
                handleApplyChanges();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleApplyChanges();
                }
              }}
              title="Apply changes to selected node"
            >
              ✓
            </button>
          )}
        </div>
      </div>
      <div style={contentStyle}>
        {mode === 'tree' && (
          <div style={treePaneBaseStyle}>
            {parseTree ? (
              <ParseTreeList
                node={parseTree}
                level={0}
                selectedId={selectedNodeId}
                collapsedNodeIds={collapsedNodeIds}
                onToggleNode={handleToggleNode}
                onSelect={handleSelectNode}
              />
            ) : (
              <div style={treeEmptyStyle}>Parse tree unavailable. Resolve syntax errors to enable tree mode.</div>
            )}
          </div>
        )}
        <div style={editorPaneBaseStyle}>
          {mode === 'tree' && <div style={nodeInfoStyle}>{selectedLabel}</div>}
          {mode === 'tree' && nodeEditorParseError && (
            <div style={nodeErrorStyle} data-testid="tree-node-error">
              {nodeEditorParseError}
            </div>
          )}
          <div ref={containerRef} style={codeMirrorContainerStyle} data-testid="standard-mode-editor" />
          {mode === 'tree' && (
            <div style={treeEditorContainerStyle} data-testid="tree-mode-editor">
              <div ref={nodeEditorContainerRef} style={treeEditorCodeMirrorStyle} />
              {treeEditorOverlayMessage && (!selectedNode || !selectedNode.isEditable) && (
                <div style={treeEditorOverlayStyle}>{treeEditorOverlayMessage}</div>
              )}
            </div>
          )}
          {mode === 'tree' && expressionPreviewSegments && (
            <div style={expressionPreviewContainerStyle}>
              <span>{expressionPreviewSegments.before}</span>
              {expressionPreviewSegments.hasSelection && (
                <span style={expressionSelectedTextStyle}>
                  {expressionPreviewSegments.selection || ' '}
                </span>
              )}
              <span>{expressionPreviewSegments.after}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FuncScriptEditor;
