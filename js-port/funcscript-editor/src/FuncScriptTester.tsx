import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode
} from 'react';
import FuncScriptEditor, {
  type FuncScriptEditorProps,
  type FuncScriptParseNode
} from './FuncScriptEditor.js';
import {
  Engine,
  FSDataType,
  type DefaultFsDataProvider,
  type TypedValue
} from '@tewelde/funcscript/browser';

type VariableState = {
  name: string;
  key: string;
  expression: string;
  typedValue: TypedValue | null;
  error: string | null;
};

class TesterDataProvider extends Engine.FsDataProvider {
  private readonly defaultProvider: DefaultFsDataProvider;
  private onDiscovered: (name: string) => void = () => undefined;
  private resolveValue: (name: string) => TypedValue | null = () => null;

  constructor(provider?: DefaultFsDataProvider) {
    const defaultProvider = provider ?? new Engine.DefaultFsDataProvider();
    super(defaultProvider);
    this.defaultProvider = defaultProvider;
  }

  public setCallbacks(
    discovered: (name: string) => void,
    resolver: (name: string) => TypedValue | null
  ) {
    this.onDiscovered = discovered;
    this.resolveValue = resolver;
  }

  public getDefaultProvider() {
    return this.defaultProvider;
  }

  public override get(name: string): TypedValue | null {
    if (this.defaultProvider.isDefined(name)) {
      return this.defaultProvider.get(name);
    }

    if (name) {
      this.onDiscovered(name);
    }

    const resolved = this.resolveValue(name);
    return resolved ?? null;
  }

  public override isDefined(name: string): boolean {
    if (this.defaultProvider.isDefined(name)) {
      return true;
    }
    return this.resolveValue(name) !== null;
  }
}

type EvaluationState = {
  value: TypedValue | null;
  error: string | null;
};

type PersistedTesterState = {
  mode: 'standard' | 'tree';
  collapsedNodeIds: string[];
  showTesting: boolean;
};

const STORAGE_PREFIX = 'funcscript-tester:';

const getStorageKey = (key: string) => `${STORAGE_PREFIX}${key}`;

const sanitizeCollapsedNodeIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
};

const loadPersistedState = (key: string): PersistedTesterState | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(getStorageKey(key));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedTesterState> | null;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const mode = parsed.mode === 'tree' ? 'tree' : 'standard';
    const collapsedNodeIds = sanitizeCollapsedNodeIds(parsed.collapsedNodeIds);
    const showTesting = parsed.showTesting === true;
    return { mode, collapsedNodeIds, showTesting };
  } catch {
    return null;
  }
};

const storePersistedState = (key: string, state: PersistedTesterState) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(getStorageKey(key), JSON.stringify(state));
  } catch {
    // Ignore storage failures (e.g. quota exceeded, private mode)
  }
};

const clamp = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
};

type PointerDragOptions = {
  cursor: CSSProperties['cursor'];
  onMove: (event: PointerEvent) => void;
  onEnd?: () => void;
};

const beginPointerDrag = (
  event: React.PointerEvent<HTMLElement>,
  { cursor, onMove, onEnd }: PointerDragOptions
) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => undefined;
  }

  event.preventDefault();

  const pointerId = event.pointerId;
  const target = event.currentTarget;
  const originalCursor = document.body.style.cursor;
  const originalUserSelect = document.body.style.userSelect;

  if (cursor) {
    document.body.style.cursor = cursor;
  }
  document.body.style.userSelect = 'none';

  let ended = false;

  const cleanup = () => {
    if (ended) {
      return;
    }
    ended = true;
    document.body.style.cursor = originalCursor;
    document.body.style.userSelect = originalUserSelect;
    window.removeEventListener('pointermove', handleMove);
    window.removeEventListener('pointerup', handleUp);
    window.removeEventListener('pointercancel', handleUp);
    try {
      target.releasePointerCapture(pointerId);
    } catch {
      // ignore if pointer capture is unsupported
    }
    if (onEnd) {
      onEnd();
    }
  };

  const handleMove = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== pointerId || ended) {
      return;
    }
    onMove(moveEvent);
  };

  const handleUp = (upEvent: PointerEvent) => {
    if (upEvent.pointerId !== pointerId) {
      return;
    }
    cleanup();
  };

  window.addEventListener('pointermove', handleMove);
  window.addEventListener('pointerup', handleUp);
  window.addEventListener('pointercancel', handleUp);

  try {
    target.setPointerCapture(pointerId);
  } catch {
    // ignore if pointer capture is unsupported
  }

  return cleanup;
};

type ParseTreeNode = {
  id: string;
  typeName: string;
  range: { start: number; end: number } | null;
  expression: string;
  isEditable: boolean;
  children: ParseTreeNode[];
};

type ExpressionPreviewSegment = {
  text: string;
  isSelected: boolean;
  isHovered: boolean;
};

type ExpressionPreviewData = {
  segments: ExpressionPreviewSegment[];
  selectionRange: { start: number; end: number } | null;
  hoverRange: { start: number; end: number } | null;
  hasSelection: boolean;
  selectionText: string | null;
};

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
  'Key',
  'KeyValuePair'
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

const getNodeTypeName = (node: FuncScriptParseNode) => {
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

const clampRange = (start: number, end: number, length: number) => {
  const safeStart = Math.max(0, Math.min(start, length));
  const safeEnd = Math.max(safeStart, Math.min(end, length));
  return safeEnd > safeStart ? { start: safeStart, end: safeEnd } : null;
};

const toNodeRange = (node: FuncScriptParseNode, docLength: number) => {
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

const getChildNodes = (node: FuncScriptParseNode): FuncScriptParseNode[] => {
  const value = node.Childs ?? node.childs ?? node.Children ?? node.children;
  return Array.isArray(value) ? (value as FuncScriptParseNode[]) : [];
};

const buildParseTree = (root: FuncScriptParseNode | null, docText: string): ParseTreeNode | null => {
  if (!root) {
    return null;
  }

  const docLength = docText.length;

  const collapseSingleChild = (node: FuncScriptParseNode, path: number[]) => {
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

  const collectDisplayChildren = (node: FuncScriptParseNode, path: number[]): ParseTreeNode[] => {
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

  const walk = (node: FuncScriptParseNode, path: number[]): ParseTreeNode => {
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

const findDeepestNodeContainingOffset = (
  node: ParseTreeNode | null,
  offset: number
): ParseTreeNode | null => {
  if (!node) {
    return null;
  }

  let bestMatch: ParseTreeNode | null = null;
  const stack: ParseTreeNode[] = [node];

  while (stack.length) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    const range = current.range;
    const contains = range ? offset >= range.start && offset < range.end : false;
    if (contains) {
      bestMatch = current;
    }
    for (const child of current.children) {
      stack.push(child);
    }
  }

  return bestMatch;
};

const resolveNodeForOffset = (
  root: ParseTreeNode | null,
  offset: number,
  docLength: number
): ParseTreeNode | null => {
  if (!root || docLength <= 0) {
    return null;
  }
  const attempts = new Set<number>([offset]);
  if (offset > 0) {
    attempts.add(offset - 1);
  }
  if (offset + 1 < docLength) {
    attempts.add(offset + 1);
  }
  for (const candidate of attempts) {
    const match = findDeepestNodeContainingOffset(root, candidate);
    if (match) {
      return match;
    }
  }
  return null;
};

const findDisplayableTreeNode = (
  node: ParseTreeNode | null,
  nodeIndex: Map<string, ParseTreeNode>
): ParseTreeNode | null => {
  let current: ParseTreeNode | null = node;
  while (current) {
    const hasVisibleChildren = current.children.some((child) => hasVisibleEditableDescendant(child));
    if (current.isEditable || hasVisibleChildren) {
      return current;
    }
    const ancestors = getAncestorNodeIds(current.id);
    if (ancestors.length === 0) {
      break;
    }
    const parentId = ancestors[ancestors.length - 1];
    current = nodeIndex.get(parentId) ?? null;
  }
  return null;
};

const resolveVisibleHoverId = (
  node: ParseTreeNode | null,
  collapsedNodeIds: Set<string>,
  nodeIndex: Map<string, ParseTreeNode>
): string | null => {
  if (!node) {
    return null;
  }

  const displayableNode = findDisplayableTreeNode(node, nodeIndex);
  if (!displayableNode) {
    return null;
  }

  const ancestors = getAncestorNodeIds(displayableNode.id);
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestorId = ancestors[index];
    if (collapsedNodeIds.has(ancestorId)) {
      return ancestorId;
    }
  }
  return displayableNode.id;
};

const getParentNode = (nodeId: string, nodeIndex: Map<string, ParseTreeNode>): ParseTreeNode | null => {
  if (!nodeId || nodeId === 'root') {
    return null;
  }
  const parentId = nodeId.includes('-') ? nodeId.split('-').slice(0, -1).join('-') : 'root';
  return nodeIndex.get(parentId) ?? null;
};

const findFirstEditableDescendant = (node: ParseTreeNode | null): ParseTreeNode | null => {
  if (!node) {
    return null;
  }
  for (const child of node.children) {
    if (child.isEditable) {
      return child;
    }
  }
  for (const child of node.children) {
    const descendant = findFirstEditableDescendant(child);
    if (descendant) {
      return descendant;
    }
  }
  return null;
};

const getCharacterOffsetForPoint = (
  container: HTMLElement,
  clientX: number,
  clientY: number
): number | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => {
      offsetNode: Node;
      offset: number;
    } | null;
  };

  let range: Range | null = null;

  if (typeof doc.caretRangeFromPoint === 'function') {
    try {
      range = doc.caretRangeFromPoint(clientX, clientY);
    } catch {
      range = null;
    }
  }

  if (!range && typeof doc.caretPositionFromPoint === 'function') {
    const position = doc.caretPositionFromPoint(clientX, clientY);
    if (position) {
      const tempRange = doc.createRange();
      try {
        tempRange.setStart(position.offsetNode, position.offset);
        tempRange.collapse(true);
        range = tempRange;
      } catch {
        range = null;
      }
    }
  }

  if (!range) {
    return null;
  }

  const { startContainer } = range;
  if (!container.contains(startContainer)) {
    return null;
  }

  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(container);
  try {
    preCaretRange.setEnd(range.startContainer, range.startOffset);
  } catch {
    return null;
  }

  const length = preCaretRange.toString().length;
  return Number.isFinite(length) ? length : null;
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

const hasVisibleEditableDescendant = (node: ParseTreeNode): boolean => {
  if (node.isEditable) {
    return true;
  }
  for (const child of node.children) {
    if (hasVisibleEditableDescendant(child)) {
      return true;
    }
  }
  return false;
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

const TREE_NODE_INDENT = 12;

const MAIN_SPLIT_MIN = 15;
const MAIN_SPLIT_MAX = 85;
const TREE_PANE_MIN = 160;
const TREE_PANE_MAX = 520;
const VARIABLE_SPLIT_MIN = 25;
const VARIABLE_SPLIT_MAX = 75;
const TREE_EXPRESSION_SPLIT_MIN = 30;
const TREE_EXPRESSION_SPLIT_MAX = 80;

type ParseTreeListProps = {
  node: ParseTreeNode;
  level: number;
  selectedId: string | null;
  hoveredId: string | null;
  collapsedNodeIds: Set<string>;
  onToggleNode: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  pendingSelectedValue: string | null;
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

const ParseTreeList = ({
  node,
  level,
  selectedId,
  hoveredId,
  collapsedNodeIds,
  onToggleNode,
  onSelect,
  pendingSelectedValue
}: ParseTreeListProps) => {
  const isSelected = node.id === selectedId;
  const expressionSource = isSelected && pendingSelectedValue !== null
    ? pendingSelectedValue
    : node.expression;
  const expressionLabel = formatExpressionPreview(expressionSource);
  const isHovered = node.id === hoveredId;
  const isEditable = node.isEditable;
  const isCollapsed = collapsedNodeIds.has(node.id);

  const hasChildren = node.children.length > 0;
  const visibleChildren = hasChildren
    ? node.children.filter((child) => hasVisibleEditableDescendant(child))
    : [];

  const rowStyle: CSSProperties = {
    ...treeRowBaseStyle,
    paddingLeft: TREE_NODE_INDENT * level
  };

  const buttonStyle: CSSProperties = {
    ...treeButtonBaseStyle,
    background: isSelected ? '#dbe9ff' : isHovered ? '#edf4ff' : 'transparent',
    borderColor: isSelected ? '#0969da' : isHovered ? '#9ec3ff' : 'transparent',
    cursor: isEditable ? 'pointer' : 'default',
    color: isEditable ? '#24292f' : '#8c959f'
  };

  const displayLabel = expressionLabel.length > 0 ? expressionLabel : node.typeName;
  const title = node.isEditable ? `Edit ${node.typeName}` : `${node.typeName} (read only)`;

  if (!isEditable && visibleChildren.length === 0) {
    return null;
  }

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
        <button
          type="button"
          style={buttonStyle}
          onClick={() => onSelect(node.id)}
          title={title}
          data-parse-node-id={node.id}
        >
          {displayLabel}
        </button>
      </div>
      {hasChildren && !isCollapsed &&
        visibleChildren.map((child) => (
          <ParseTreeList
            key={child.id}
            node={child}
            level={level + 1}
            selectedId={selectedId}
            hoveredId={hoveredId}
            collapsedNodeIds={collapsedNodeIds}
            onToggleNode={onToggleNode}
            onSelect={onSelect}
            pendingSelectedValue={pendingSelectedValue}
          />
        ))}
    </div>
  );
};

const containerStyle: CSSProperties = {
  display: 'flex',
  border: '1px solid #d0d7de',
  borderRadius: 6,
  backgroundColor: '#ffffff',
  overflow: 'hidden',
  height: '100%',
  minHeight: 0
};

const leftPaneBaseStyle: CSSProperties = {
  flex: 2,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden'
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 8px',
  borderBottom: '1px solid #d0d7de',
  backgroundColor: '#f6f8fa',
  gap: 8
};

const toolbarButtonGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6
};

const modeButtonBaseStyle: CSSProperties = {
  border: '1px solid #d0d7de',
  borderColor: '#d0d7de',
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

const testToggleStyle: CSSProperties = {
  ...modeButtonBaseStyle,
  fontWeight: 600
};

const playButtonStyle: CSSProperties = {
  ...modeButtonBaseStyle,
  padding: '2px 10px',
  fontWeight: 600
};

const leftPaneContentStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  padding: '0.75rem',
  minHeight: 0,
  overflow: 'hidden'
};

const editorBodyStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  minHeight: 0,
  overflow: 'hidden'
};

const standardEditorWrapperStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex'
};

const treeLayoutStyle: CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  border: '1px solid #d0d7de',
  borderRadius: 6,
  overflow: 'hidden',
  backgroundColor: '#ffffff'
};

const treePaneBaseStyle: CSSProperties = {
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

const treeEditorPaneStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0
};

const nodeInfoStyle: CSSProperties = {
  fontSize: 12,
  padding: '6px 12px',
  borderBottom: '1px solid #e1e4e8',
  backgroundColor: '#f6f8fa',
  color: '#24292f'
};

const nodeErrorStyle: CSSProperties = {
  fontSize: 12,
  color: '#cf222e',
  padding: '4px 12px',
  backgroundColor: '#ffebeb',
  borderBottom: '1px solid #ffd7d5'
};

const expressionPreviewBaseStyle: CSSProperties = {
  fontSize: 11,
  lineHeight: 1.4,
  fontFamily: 'Roboto Mono, monospace',
  padding: '8px 12px',
  borderTop: '1px solid #e1e4e8',
  backgroundColor: '#f6f8fa',
  color: '#57606a',
  overflowY: 'auto',
  boxSizing: 'border-box',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word'
};

const expressionSelectedTextStyle: CSSProperties = {
  textDecoration: 'underline',
  fontWeight: 600,
  color: '#24292f'
};

const expressionHoveredTextStyle: CSSProperties = {
  backgroundColor: '#cce4ff',
  color: '#0b4a82',
  borderRadius: 4,
  fontWeight: 600,
  textDecoration: 'none'
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

const testingColumnBaseStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  minHeight: 0,
  padding: '0.75rem',
  borderLeft: '1px solid #d0d7de',
  backgroundColor: '#ffffff',
  overflow: 'hidden'
};

const resultPanelStyle: CSSProperties = {
  border: '1px solid #d0d7de',
  borderRadius: 6,
  padding: '0.75rem',
  minHeight: 120,
  maxHeight: 240,
  overflow: 'auto',
  background: '#f6f8fa',
  flexShrink: 0
};

const variablesListBaseStyle: CSSProperties = {
  border: '1px solid #d0d7de',
  borderRadius: 6,
  padding: '0.5rem',
  minHeight: 0,
  overflowY: 'auto',
  background: '#fff'
};

const listItemStyle: CSSProperties = {
  border: '1px solid transparent',
  borderRadius: 4,
  padding: '0.5rem',
  textAlign: 'left',
  width: '100%',
  background: 'transparent',
  cursor: 'pointer'
};

const selectedListItemStyle: CSSProperties = {
  ...listItemStyle,
  borderColor: '#0969da',
  background: '#dbe9ff'
};

const unsetTokenStyle: CSSProperties = {
  color: '#57606a',
  fontStyle: 'italic'
};

const errorTextStyle: CSSProperties = {
  color: '#d1242f',
  marginTop: '0.25rem',
  whiteSpace: 'pre-wrap'
};

const nodeEditorBaseStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flex: 1,
  minHeight: 0
};

const nodeEditorSurfaceStyle: CSSProperties = {
  flex: 1,
  minHeight: 0
};

const testerEditorStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex'
};

const variableEditorBaseStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden'
};

const variableEditorSurfaceStyle: CSSProperties = {
  flex: 1,
  minHeight: 0
};

const mainSplitterStyle: CSSProperties = {
  width: 6,
  cursor: 'col-resize',
  backgroundColor: '#d8dee4',
  borderLeft: '1px solid #d0d7de',
  borderRight: '1px solid #d0d7de',
  flexShrink: 0
};

const treeSplitterStyle: CSSProperties = {
  width: 6,
  cursor: 'col-resize',
  backgroundColor: '#d8dee4',
  borderLeft: '1px solid #d0d7de',
  borderRight: '1px solid #d0d7de',
  flexShrink: 0
};

const variableSplitterStyle: CSSProperties = {
  height: 8,
  cursor: 'row-resize',
  backgroundColor: '#d8dee4',
  borderTop: '1px solid #d0d7de',
  borderBottom: '1px solid #d0d7de',
  borderRadius: 6,
  flexShrink: 0,
  margin: '0.5rem 0'
};

const treeExpressionSplitterStyle: CSSProperties = {
  height: 8,
  cursor: 'row-resize',
  backgroundColor: '#d8dee4',
  borderTop: '1px solid #d0d7de',
  borderBottom: '1px solid #d0d7de',
  borderRadius: 6,
  flex: '0 0 auto',
  margin: '0.5rem 0'
};

const treeEditorContentStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden'
};

const typedValueToPlain = (typedValue: TypedValue): unknown => {
  const valueType = Engine.typeOf(typedValue);
  const rawValue = Engine.valueOf(typedValue as TypedValue<unknown>);

  switch (valueType) {
    case FSDataType.Null:
    case FSDataType.Boolean:
    case FSDataType.Integer:
    case FSDataType.BigInteger:
    case FSDataType.Float:
    case FSDataType.String:
    case FSDataType.Guid:
      return rawValue;
    case FSDataType.List: {
      if (rawValue && typeof (rawValue as { toArray?: () => TypedValue[] }).toArray === 'function') {
        return (rawValue as { toArray: () => TypedValue[] }).toArray().map(typedValueToPlain);
      }
      return rawValue;
    }
    case FSDataType.KeyValueCollection: {
      if (rawValue && typeof (rawValue as { getAll?: () => Array<readonly [string, TypedValue]> }).getAll === 'function') {
        const entries = (rawValue as {
          getAll: () => Array<readonly [string, TypedValue]>;
        }).getAll();
        const result: Record<string, unknown> = {};
        for (const [key, value] of entries) {
          result[key] = typedValueToPlain(value);
        }
        return result;
      }
      return rawValue;
    }
    default:
      return rawValue;
  }
};

const formatTypedValue = (typedValue: TypedValue): string => {
  const plain = typedValueToPlain(typedValue);
  if (plain === null || plain === undefined) {
    return 'null';
  }
  if (typeof plain === 'string') {
    return plain;
  }
  if (typeof plain === 'number' || typeof plain === 'boolean' || typeof plain === 'bigint') {
    return String(plain);
  }
  try {
    return JSON.stringify(plain, null, 2);
  } catch {
    if (typeof plain === 'object' && plain && 'toString' in plain) {
      return String((plain as { toString: () => string }).toString());
    }
    return String(plain);
  }
};

export type FuncScriptTesterProps = Omit<FuncScriptEditorProps, 'onParseNodeChange' | 'readOnly'> & {
  saveKey?: string;
};

const FuncScriptTester = ({
  value,
  onChange,
  onSegmentsChange,
  onError,
  minHeight,
  style,
  saveKey
}: FuncScriptTesterProps) => {
  const [variables, setVariables] = useState<Map<string, VariableState>>(() => new Map());
  const variablesRef = useRef<Map<string, VariableState>>(variables);
  const [selectedVariableKey, setSelectedVariableKey] = useState<string | null>(null);
  const [variableEditorValue, setVariableEditorValue] = useState('');
  const [resultState, setResultState] = useState<EvaluationState>({ value: null, error: null });

  const initialPersistedState = useMemo(() => (saveKey ? loadPersistedState(saveKey) : null), [saveKey]);

  const [mode, setMode] = useState<'standard' | 'tree'>(initialPersistedState?.mode ?? 'standard');
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(
    () => new Set(initialPersistedState?.collapsedNodeIds ?? [])
  );
  const [showTestingControls, setShowTestingControls] = useState<boolean>(
    initialPersistedState?.showTesting ?? false
  );

  const [currentParseNode, setCurrentParseNode] = useState<FuncScriptParseNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredPreviewRange, setHoveredPreviewRange] = useState<{ start: number; end: number } | null>(
    null
  );
  const [pendingNodeValue, setPendingNodeValue] = useState('');
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [currentParseError, setCurrentParseError] = useState<string | null>(null);
  const [nodeEditorParseError, setNodeEditorParseError] = useState<string | null>(null);

  const pendingSelectionRangeRef = useRef<{ start: number; end: number } | null>(null);
  const selectedNodeRef = useRef<ParseTreeNode | null>(null);
  const hadParseTreeRef = useRef(false);
  const expressionPreviewContainerRef = useRef<HTMLDivElement | null>(null);
  const expressionPreviewSelectionRef = useRef<HTMLSpanElement | null>(null);
  const lastSelectionKeyRef = useRef<string | null>(null);
  const parseTreeContainerRef = useRef<HTMLDivElement | null>(null);
  const selectionSourceRef = useRef<'preview' | 'tree' | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const treeLayoutRef = useRef<HTMLDivElement | null>(null);
  const testingColumnRef = useRef<HTMLDivElement | null>(null);
  const treeEditorContentRef = useRef<HTMLDivElement | null>(null);

  const [mainSplitRatio, setMainSplitRatio] = useState(60);
  const [treePaneWidth, setTreePaneWidth] = useState(260);
  const [variableSplitRatio, setVariableSplitRatio] = useState(50);
  const [treeExpressionSplitRatio, setTreeExpressionSplitRatio] = useState(60);

  const mainDragCleanupRef = useRef<(() => void) | null>(null);
  const treeDragCleanupRef = useRef<(() => void) | null>(null);
  const variableDragCleanupRef = useRef<(() => void) | null>(null);
  const treeExpressionDragCleanupRef = useRef<(() => void) | null>(null);

  const providerRef = useRef<TesterDataProvider | null>(null);
  if (!providerRef.current) {
    providerRef.current = new TesterDataProvider();
  }

  useEffect(() => {
    variablesRef.current = variables;
  }, [variables]);

  useEffect(() => () => {
    mainDragCleanupRef.current?.();
    treeDragCleanupRef.current?.();
    variableDragCleanupRef.current?.();
    treeExpressionDragCleanupRef.current?.();
  }, []);

  useEffect(() => {
    if (!saveKey) {
      setMode((prev) => (prev === 'standard' ? prev : 'standard'));
      setCollapsedNodeIds((prev) => (prev.size === 0 ? prev : new Set<string>()));
      setShowTestingControls(false);
      return;
    }
    const stored = loadPersistedState(saveKey);
    const desiredMode = stored?.mode ?? 'standard';
    setMode((prev) => (prev === desiredMode ? prev : desiredMode));
    setShowTestingControls(stored?.showTesting ?? false);
    setCollapsedNodeIds(new Set(stored?.collapsedNodeIds ?? []));
  }, [saveKey]);

  useEffect(() => {
    if (!saveKey) {
      return;
    }
    storePersistedState(saveKey, {
      mode,
      collapsedNodeIds: Array.from(collapsedNodeIds),
      showTesting: showTestingControls
    });
  }, [saveKey, mode, collapsedNodeIds, showTestingControls]);

  const handleEditorError = useCallback(
    (message: string | null) => {
      setCurrentParseError(message);
      if (onError) {
        onError(message);
      }
    },
    [onError]
  );

  const handleParseNodeChange = useCallback((node: FuncScriptParseNode | null) => {
    setCurrentParseNode(node);
  }, []);

  const evaluateExpression = useCallback((expression: string): {
    typedValue: TypedValue | null;
    error: string | null;
  } => {
    const trimmed = expression.trim();
    if (trimmed.length === 0) {
      return { typedValue: null, error: null };
    }

    try {
      const typedValue = Engine.evaluate(trimmed, new Engine.DefaultFsDataProvider());
      return { typedValue, error: null };
    } catch (err) {
      return {
        typedValue: null,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }, []);

  const evaluateVariableExpression = useCallback(
    (key: string, expression: string) => {
      setVariables((prev) => {
        const current = prev.get(key);
        if (!current) {
          return prev;
        }
        const { typedValue, error } = evaluateExpression(expression);
        const next = new Map(prev);
        next.set(key, {
          ...current,
          expression,
          typedValue,
          error
        });
        variablesRef.current = next;
        return next;
      });
    },
    [evaluateExpression]
  );

  const handleVariableDiscovered = useCallback((name: string) => {
    const key = name.toLowerCase();
    let added = false;
    setVariables((prev) => {
      if (prev.has(key)) {
        return prev;
      }
      added = true;
      const next = new Map(prev);
      next.set(key, {
        name,
        key,
        expression: '',
        typedValue: null,
        error: null
      });
      return next;
    });
    if (added) {
      setSelectedVariableKey((current) => current ?? key);
    }
  }, []);

  useEffect(() => {
    const provider = providerRef.current;
    if (!provider) {
      return;
    }
    provider.setCallbacks(handleVariableDiscovered, (name) => {
      const key = name.toLowerCase();
      const entry = variablesRef.current.get(key);
      return entry?.typedValue ?? null;
    });
  }, [handleVariableDiscovered]);

  const variableEntries = useMemo(() => Array.from(variables.values()), [variables]);

  useEffect(() => {
    if (!selectedVariableKey && variableEntries.length > 0) {
      setSelectedVariableKey(variableEntries[0].key);
    }
  }, [selectedVariableKey, variableEntries]);

  useEffect(() => {
    if (!selectedVariableKey) {
      setVariableEditorValue('');
      return;
    }
    const entry = variables.get(selectedVariableKey);
    const nextValue = entry?.expression ?? '';
    setVariableEditorValue((current) => (current === nextValue ? current : nextValue));
  }, [selectedVariableKey, variables]);

  const handleVariableEditorChange = useCallback(
    (nextValue: string) => {
      setVariableEditorValue(nextValue);
      if (!selectedVariableKey) {
        return;
      }
      setVariables((prev) => {
        const current = prev.get(selectedVariableKey);
        if (!current) {
          return prev;
        }
        const next = new Map(prev);
        next.set(selectedVariableKey, {
          ...current,
          expression: nextValue
        });
        return next;
      });
    },
    [selectedVariableKey]
  );

  const handleVariableEditorBlur = useCallback(() => {
    if (!selectedVariableKey) {
      return;
    }
    evaluateVariableExpression(selectedVariableKey, variableEditorValue);
  }, [evaluateVariableExpression, selectedVariableKey, variableEditorValue]);

  const handleSelectVariable = useCallback((key: string) => {
    setSelectedVariableKey(key);
  }, []);

  const runTest = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) {
      return;
    }

    const nextVariables = new Map<string, VariableState>();
    for (const [key, entry] of variablesRef.current.entries()) {
      const { typedValue, error } = evaluateExpression(entry.expression);

      nextVariables.set(key, {
        ...entry,
        typedValue,
        error
      });
    }

    variablesRef.current = nextVariables;
    setVariables(nextVariables);

    try {
      const evaluated = Engine.evaluate(value, provider);
      setResultState({ value: evaluated, error: null });
    } catch (err) {
      setResultState({
        value: null,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, [evaluateExpression, value]);

  const parseTree = useMemo(() => buildParseTree(currentParseNode, value), [currentParseNode, value]);
  const parseNodeMap = useMemo(() => createParseNodeIndex(parseTree), [parseTree]);
  const firstEditableNode = useMemo(() => findFirstEditableNode(parseTree), [parseTree]);
  const selectedNode = selectedNodeId ? parseNodeMap.get(selectedNodeId) ?? null : null;

  useEffect(() => {
    if (!hoveredNodeId) {
      return;
    }
    if (!parseNodeMap.has(hoveredNodeId)) {
      setHoveredNodeId(null);
      setHoveredPreviewRange(null);
    }
  }, [hoveredNodeId, parseNodeMap]);

  useEffect(() => {
    if (mode !== 'tree') {
      if (hoveredNodeId !== null) {
        setHoveredNodeId(null);
      }
      if (hoveredPreviewRange !== null) {
        setHoveredPreviewRange(null);
      }
    }
  }, [mode, hoveredNodeId, hoveredPreviewRange]);

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
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
      if (!hadParseTreeRef.current) {
        return;
      }
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
      if (current.isEditable) {
        validIds.add(current.id);
      }
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
        const ancestorNode = parseNodeMap.get(ancestorId);
        if (!ancestorNode?.isEditable) {
          continue;
        }
        if (next.delete(ancestorId)) {
          changed = true;
        }
      }
    return changed ? next : prev;
    });
  }, [selectedNodeId, parseNodeMap]);

  useEffect(() => {
    if (selectionSourceRef.current !== 'preview') {
      return;
    }
    if (!selectedNodeId) {
      selectionSourceRef.current = null;
      return;
    }
    const container = parseTreeContainerRef.current;
    if (!container) {
      selectionSourceRef.current = null;
      return;
    }
    const safeId = selectedNodeId.replace(/"/g, '\\"');
    const target = container.querySelector<HTMLElement>(`[data-parse-node-id="${safeId}"]`);
    if (!target) {
      selectionSourceRef.current = null;
      return;
    }
    try {
      target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } catch {
      // ignore scroll errors
    }
    selectionSourceRef.current = null;
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

  const selectNodeById = useCallback(
    (nodeId: string): boolean => {
      if (nodeEditorParseError) {
        return false;
      }
      if (selectedNodeId === nodeId) {
        return false;
      }
      const node = parseNodeMap.get(nodeId);
      if (!node) {
        return false;
      }
      if (!node.isEditable) {
        return false;
      }
      setSelectedNodeId(nodeId);
      setPendingNodeValue(node.expression);
      setHasPendingChanges(false);
      setNodeEditorParseError(null);
      pendingSelectionRangeRef.current = null;
      return true;
    },
    [parseNodeMap, selectedNodeId, nodeEditorParseError]
  );

  const handleTreeNodeSelect = useCallback(
    (nodeId: string) => {
      selectionSourceRef.current = 'tree';
      const changed = selectNodeById(nodeId);
      if (!changed) {
        selectionSourceRef.current = null;
        return;
      }
      selectionSourceRef.current = null;
    },
    [selectNodeById]
  );

  const handlePreviewNodeSelect = useCallback(
    (nodeId: string) => {
      selectionSourceRef.current = 'preview';
      const changed = selectNodeById(nodeId);
      if (!changed) {
        selectionSourceRef.current = null;
      }
    },
    [selectNodeById]
  );

  const applyPendingChanges = useCallback(() => {
    const node = selectedNodeRef.current;
    if (!node || !node.range || !node.isEditable) {
      return;
    }
    if (!hasPendingChanges) {
      return;
    }
    if (nodeEditorParseError || currentParseError) {
      return;
    }
    const { start, end } = node.range;
    const nextDoc = value.slice(0, start) + pendingNodeValue + value.slice(end);
    pendingSelectionRangeRef.current = {
      start,
      end: start + pendingNodeValue.length
    };
    onChange(nextDoc);
    setHasPendingChanges(false);
  }, [hasPendingChanges, nodeEditorParseError, currentParseError, pendingNodeValue, value, onChange]);

  const selectedLabel =
    selectedNode
      ? `${selectedNode.typeName}:${formatExpressionPreview(pendingNodeValue)}`
      : parseTree
      ? 'Select an editable node from the tree'
      : 'No node selected';

  const treeOverlayMessage = useMemo(() => {
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
    if (currentParseError) {
      return 'Resolve the syntax error to edit nodes.';
    }
    return '';
  }, [parseTree, selectedNode, firstEditableNode, currentParseError]);

  const expressionPreviewSegments = useMemo<ExpressionPreviewData | null>(() => {
    if (!value) {
      return null;
    }
    const docLength = value.length;
    const selectionRangeRaw =
      selectedNode?.isEditable && selectedNode.range
        ? clampRange(selectedNode.range.start, selectedNode.range.end, docLength)
        : null;
    const hoverRangeRaw = hoveredPreviewRange
      ? clampRange(hoveredPreviewRange.start, hoveredPreviewRange.end, docLength)
      : null;

    const selectionRange = selectionRangeRaw;
    const hoverRange = hoverRangeRaw;

    if (!selectionRange && !hoverRange) {
      return {
        segments: [
          {
            text: value,
            isSelected: false,
            isHovered: false
          }
        ],
        selectionRange: null,
        hoverRange: null,
        hasSelection: false,
        selectionText: null
      };
    }

    const points = new Set<number>([0, docLength]);
    if (selectionRange) {
      points.add(selectionRange.start);
      points.add(selectionRange.end);
    }
    if (hoverRange) {
      points.add(hoverRange.start);
      points.add(hoverRange.end);
    }

    const sortedPoints = Array.from(points).sort((a, b) => a - b);
    const segments: ExpressionPreviewSegment[] = [];

    for (let index = 0; index < sortedPoints.length - 1; index += 1) {
      const start = sortedPoints[index];
      const end = sortedPoints[index + 1];
      if (end <= start) {
        continue;
      }
      const text = value.slice(start, end);
      if (text.length === 0) {
        continue;
      }
      const isSelected = Boolean(
        selectionRange && start >= selectionRange.start && end <= selectionRange.end
      );
      const isHovered = Boolean(hoverRange && start >= hoverRange.start && end <= hoverRange.end);
      segments.push({ text, isSelected, isHovered });
    }

    if (segments.length === 0) {
      return {
        segments: [
          {
            text: value,
            isSelected: false,
            isHovered: false
          }
        ],
        selectionRange,
        hoverRange,
        hasSelection: Boolean(selectionRange),
        selectionText: selectionRange ? pendingNodeValue : null
      };
    }

    return {
      segments,
      selectionRange,
      hoverRange,
      hasSelection: Boolean(selectionRange),
      selectionText: selectionRange ? pendingNodeValue : null
    };
  }, [selectedNode, value, hoveredPreviewRange, pendingNodeValue]);

  useEffect(() => {
    if (expressionPreviewSegments) {
      return;
    }
    if (hoveredNodeId !== null) {
      setHoveredNodeId(null);
    }
    if (hoveredPreviewRange !== null) {
      setHoveredPreviewRange(null);
    }
  }, [expressionPreviewSegments, hoveredNodeId, hoveredPreviewRange]);

  useEffect(() => {
    const container = expressionPreviewContainerRef.current;
    if (!container) {
      return;
    }

    if (mode !== 'tree') {
      if (container.scrollTop !== 0) {
        container.scrollTop = 0;
      }
      lastSelectionKeyRef.current = null;
      return;
    }

    if (!expressionPreviewSegments) {
      if (container.scrollTop !== 0) {
        container.scrollTop = 0;
      }
      lastSelectionKeyRef.current = null;
      return;
    }

    if (!expressionPreviewSegments.hasSelection || !expressionPreviewSegments.selectionRange) {
      if (container.scrollTop !== 0) {
        container.scrollTop = 0;
      }
      lastSelectionKeyRef.current = null;
      return;
    }

    const selectionRange = expressionPreviewSegments.selectionRange;
    const key = `${selectedNodeId ?? 'null'}:${selectionRange.start}-${selectionRange.end}`;
    if (lastSelectionKeyRef.current === key) {
      return;
    }

    const selection = expressionPreviewSelectionRef.current;
    if (!selection) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    if (containerRect.height <= 0) {
      return;
    }

    const selectionRect = selection.getBoundingClientRect();
    const relativeTop = selectionRect.top - containerRect.top + container.scrollTop;
    const selectionHeight = selectionRect.height || selection.offsetHeight || 0;
    if (!Number.isFinite(relativeTop) || !Number.isFinite(selectionHeight)) {
      return;
    }

    const containerHeight = container.clientHeight;
    if (containerHeight <= 0) {
      return;
    }

    const selectionTop = relativeTop;
    const selectionBottom = relativeTop + selectionHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + containerHeight;
    const maxScroll = Math.max(0, container.scrollHeight - containerHeight);
    const margin = Math.min(24, containerHeight / 4);
    const desiredTop = clamp(selectionTop - margin, 0, maxScroll);

    let targetScroll: number | null = null;
    if (selectionTop < viewTop + margin) {
      targetScroll = desiredTop;
    } else if (selectionBottom > viewBottom - margin) {
      targetScroll = desiredTop;
    }

    if (targetScroll !== null && Math.abs(container.scrollTop - targetScroll) > 1) {
      container.scrollTop = targetScroll;
    }

    lastSelectionKeyRef.current = key;
  }, [mode, expressionPreviewSegments, selectedNodeId]);

  const handleExpressionPreviewMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (mode !== 'tree' || !parseTree || !expressionPreviewSegments) {
        setHoveredNodeId((prev) => (prev === null ? prev : null));
        setHoveredPreviewRange((prev) => (prev === null ? prev : null));
        return;
      }
      const container = expressionPreviewContainerRef.current;
      if (!container) {
        return;
      }
      const docLength = value.length;
      if (docLength === 0) {
        setHoveredNodeId((prev) => (prev === null ? prev : null));
        setHoveredPreviewRange((prev) => (prev === null ? prev : null));
        return;
      }
      const offset = getCharacterOffsetForPoint(container, event.clientX, event.clientY);
      if (offset === null) {
        setHoveredNodeId((prev) => (prev === null ? prev : null));
        setHoveredPreviewRange((prev) => (prev === null ? prev : null));
        return;
      }
      const clampedOffset = clamp(offset, 0, docLength - 1);
      const targetNode = resolveNodeForOffset(parseTree, clampedOffset, docLength);
      const nextRange = targetNode?.range
        ? clampRange(targetNode.range.start, targetNode.range.end, docLength) ?? null
        : null;
      setHoveredPreviewRange((prev) => {
        if (prev && nextRange && prev.start === nextRange.start && prev.end === nextRange.end) {
          return prev;
        }
        if (!prev && !nextRange) {
          return prev;
        }
        return nextRange;
      });
      const nextId = resolveVisibleHoverId(targetNode, collapsedNodeIds, parseNodeMap) ?? null;
      setHoveredNodeId((prev) => (prev === nextId ? prev : nextId));
    },
    [
      mode,
      parseTree,
      expressionPreviewSegments,
      value,
      collapsedNodeIds,
      parseNodeMap
    ]
  );

  const handleExpressionPreviewMouseLeave = useCallback(() => {
    setHoveredNodeId((prev) => (prev === null ? prev : null));
    setHoveredPreviewRange((prev) => (prev === null ? prev : null));
  }, []);

  const handleExpressionPreviewClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (mode !== 'tree' || !parseTree || !expressionPreviewSegments) {
        return;
      }
      const container = expressionPreviewContainerRef.current;
      if (!container) {
        return;
      }
      const docLength = value.length;
      if (docLength === 0) {
        return;
      }
      const offset = getCharacterOffsetForPoint(container, event.clientX, event.clientY);
      if (offset === null) {
        return;
      }
      const clampedOffset = clamp(offset, 0, docLength - 1);
      const targetNode = resolveNodeForOffset(parseTree, clampedOffset, docLength);
      if (!targetNode) {
        return;
      }
      const nextRange = targetNode.range
        ? clampRange(targetNode.range.start, targetNode.range.end, docLength) ?? null
        : null;
      setHoveredPreviewRange((prev) => {
        if (prev && nextRange && prev.start === nextRange.start && prev.end === nextRange.end) {
          return prev;
        }
        if (!prev && !nextRange) {
          return prev;
        }
        return nextRange;
      });
      let selectable: ParseTreeNode | null = null;
      if (targetNode.isEditable) {
        selectable = targetNode;
      } else {
        const parentNode = getParentNode(targetNode.id, parseNodeMap);
        if (parentNode) {
          if (parentNode.children.length === 1 && parentNode.isEditable) {
            selectable = parentNode;
          } else if (parentNode.children.length > 1) {
            selectable = parentNode.children.find((child) => child.isEditable) ?? null;
          }
        }
        if (!selectable) {
          selectable = findFirstEditableDescendant(targetNode);
        }
        if (!selectable && parentNode) {
          selectable = findFirstEditableDescendant(parentNode);
        }
      }

      if (!selectable) {
        return;
      }
      handlePreviewNodeSelect(selectable.id);
    },
    [mode, parseTree, expressionPreviewSegments, value, parseNodeMap, handlePreviewNodeSelect]
  );

  const renderExpressionPreviewSegments = useCallback(() => {
    if (!expressionPreviewSegments) {
      return null;
    }
    const elements: ReactNode[] = [];
    let selectionRefAssigned = false;
    let selectionGroup: { segments: ExpressionPreviewSegment[]; startIndex: number } | null = null;

    const flushSelectionGroup = () => {
      if (!selectionGroup) {
        return;
      }
      const { segments, startIndex } = selectionGroup;
      const containsHover = segments.some((segment) => segment.isHovered);
      const selectionStyle: CSSProperties = {
        ...expressionSelectedTextStyle,
        ...(containsHover ? expressionHoveredTextStyle : {})
      };
      const fallbackText = segments.map((segment) => segment.text).join('');
      const displayText =
        expressionPreviewSegments.selectionText !== null
          ? expressionPreviewSegments.selectionText
          : fallbackText;

      elements.push(
        <span
          key={`selection-group-${startIndex}`}
          ref={!selectionRefAssigned ? expressionPreviewSelectionRef : undefined}
          style={selectionStyle}
        >
          {displayText}
        </span>
      );
      if (!selectionRefAssigned) {
        selectionRefAssigned = true;
      }
      selectionGroup = null;
    };

    expressionPreviewSegments.segments.forEach((segment, index) => {
      if (segment.isSelected) {
        if (!selectionGroup) {
          selectionGroup = { segments: [], startIndex: index };
        }
        selectionGroup.segments.push(segment);
        return;
      }
      flushSelectionGroup();
      const style: CSSProperties = segment.isHovered ? expressionHoveredTextStyle : {};
      elements.push(
        <span key={`expression-segment-${index}`} style={style}>
          {segment.text}
        </span>
      );
    });

    flushSelectionGroup();

    return elements;
  }, [expressionPreviewSegments, expressionPreviewSelectionRef]);

  const resultTypeName = useMemo(() => {
    if (!resultState.value) {
      return null;
    }
    return Engine.getTypeName(Engine.typeOf(resultState.value));
  }, [resultState.value]);

  const formattedResult = useMemo(() => {
    if (!resultState.value) {
      return '';
    }
    return formatTypedValue(resultState.value);
  }, [resultState.value]);

  const resultContent: ReactNode = resultState.error ? (
    <div style={errorTextStyle}>{resultState.error}</div>
  ) : resultState.value ? (
    <>
      <div>
        <strong>Type:</strong> {resultTypeName}
      </div>
      <pre
        style={{
          marginTop: '0.5rem',
          marginBottom: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {formattedResult}
      </pre>
    </>
  ) : (
    <div style={unsetTokenStyle}>No result yet. Enter a script and run the test.</div>
  );

  const handleNodeEditorChange = useCallback(
    (nextValue: string) => {
      setPendingNodeValue(nextValue);
      const node = selectedNodeRef.current;
      if (!node) {
        setHasPendingChanges(false);
        return;
      }
      setHasPendingChanges(nextValue !== node.expression);
    },
    []
  );

  const handleNodeEditorBlur = useCallback(() => {
    applyPendingChanges();
  }, [applyPendingChanges]);

  const safeMainSplitRatio = clamp(mainSplitRatio, MAIN_SPLIT_MIN, MAIN_SPLIT_MAX);
  const safeVariableSplitRatio = clamp(variableSplitRatio, VARIABLE_SPLIT_MIN, VARIABLE_SPLIT_MAX);
  const treeLayoutRect =
    mode === 'tree' && treeLayoutRef.current
      ? treeLayoutRef.current.getBoundingClientRect()
      : null;
  const dynamicTreeMaxWidth = treeLayoutRect && treeLayoutRect.width > 0
    ? Math.max(TREE_PANE_MIN, Math.min(TREE_PANE_MAX, treeLayoutRect.width - 240))
    : TREE_PANE_MAX;
  const safeTreePaneWidth = clamp(treePaneWidth, TREE_PANE_MIN, dynamicTreeMaxWidth);
  const safeTreeExpressionSplitRatio = clamp(
    treeExpressionSplitRatio,
    TREE_EXPRESSION_SPLIT_MIN,
    TREE_EXPRESSION_SPLIT_MAX
  );

  const handleMainSplitterPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!showTestingControls) {
        return;
      }
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }
      const safeRatio = safeMainSplitRatio;
      const startX = event.clientX;
      const startWidth = (rect.width * safeRatio) / 100;

      mainDragCleanupRef.current?.();
      mainDragCleanupRef.current = beginPointerDrag(event, {
        cursor: 'col-resize',
        onMove: (moveEvent) => {
          const delta = moveEvent.clientX - startX;
          const nextWidth = startWidth + delta;
          const nextRatio = (nextWidth / rect.width) * 100;
          setMainSplitRatio(clamp(nextRatio, MAIN_SPLIT_MIN, MAIN_SPLIT_MAX));
        },
        onEnd: () => {
          mainDragCleanupRef.current = null;
        }
      });
    },
    [showTestingControls, safeMainSplitRatio]
  );

  const handleMainSplitterKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!showTestingControls) {
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const direction = event.key === 'ArrowLeft' ? -1 : 1;
        const step = event.shiftKey ? 5 : 2;
        setMainSplitRatio((prev) => clamp(prev + direction * step, MAIN_SPLIT_MIN, MAIN_SPLIT_MAX));
      }
    },
    [showTestingControls]
  );

  const handleTreeSplitterPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (mode !== 'tree') {
        return;
      }
      const layout = treeLayoutRef.current;
      if (!layout) {
        return;
      }
      const rect = layout.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }
      const editorMinWidth = 240;
      const maxWidth = Math.max(TREE_PANE_MIN, Math.min(TREE_PANE_MAX, rect.width - editorMinWidth));
      const startX = event.clientX;
      const startWidth = safeTreePaneWidth;

      treeDragCleanupRef.current?.();
      treeDragCleanupRef.current = beginPointerDrag(event, {
        cursor: 'col-resize',
        onMove: (moveEvent) => {
          const delta = moveEvent.clientX - startX;
          const nextWidth = clamp(startWidth + delta, TREE_PANE_MIN, maxWidth);
          setTreePaneWidth(nextWidth);
        },
        onEnd: () => {
          treeDragCleanupRef.current = null;
        }
      });
    },
    [mode, safeTreePaneWidth]
  );

  const handleTreeSplitterKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (mode !== 'tree') {
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const direction = event.key === 'ArrowLeft' ? -1 : 1;
        const step = event.shiftKey ? 32 : 16;
        const layout = treeLayoutRef.current;
        const rect = layout?.getBoundingClientRect();
        const editorMinWidth = 240;
        const maxWidth = rect
          ? Math.max(TREE_PANE_MIN, Math.min(TREE_PANE_MAX, rect.width - editorMinWidth))
          : TREE_PANE_MAX;
        setTreePaneWidth((prev) => clamp(prev + direction * step, TREE_PANE_MIN, maxWidth));
      }
    },
    [mode]
  );

  const handleVariableSplitterPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!showTestingControls) {
        return;
      }
      const column = testingColumnRef.current;
      if (!column) {
        return;
      }
      const rect = column.getBoundingClientRect();
      if (rect.height <= 0) {
        return;
      }
      const safeRatio = safeVariableSplitRatio;
      const startY = event.clientY;
      const startHeight = (rect.height * safeRatio) / 100;

      variableDragCleanupRef.current?.();
      variableDragCleanupRef.current = beginPointerDrag(event, {
        cursor: 'row-resize',
        onMove: (moveEvent) => {
          const delta = moveEvent.clientY - startY;
          const nextHeight = startHeight + delta;
          const nextRatio = (nextHeight / rect.height) * 100;
          setVariableSplitRatio(clamp(nextRatio, VARIABLE_SPLIT_MIN, VARIABLE_SPLIT_MAX));
        },
        onEnd: () => {
          variableDragCleanupRef.current = null;
        }
      });
    },
    [showTestingControls, safeVariableSplitRatio]
  );

  const handleVariableSplitterKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!showTestingControls) {
        return;
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        const direction = event.key === 'ArrowUp' ? -1 : 1;
        const step = event.shiftKey ? 8 : 4;
        setVariableSplitRatio((prev) => clamp(prev + direction * step, VARIABLE_SPLIT_MIN, VARIABLE_SPLIT_MAX));
      }
    },
    [showTestingControls]
  );

  const handleTreeExpressionSplitterPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (mode !== 'tree') {
        return;
      }
      if (!expressionPreviewSegments) {
        return;
      }
      const container = treeEditorContentRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      if (rect.height <= 0) {
        return;
      }
      const safeRatio = safeTreeExpressionSplitRatio;
      const startY = event.clientY;
      const startHeight = (rect.height * safeRatio) / 100;

      treeExpressionDragCleanupRef.current?.();
      treeExpressionDragCleanupRef.current = beginPointerDrag(event, {
        cursor: 'row-resize',
        onMove: (moveEvent) => {
          const delta = moveEvent.clientY - startY;
          const nextHeight = startHeight + delta;
          const nextRatio = (nextHeight / rect.height) * 100;
          setTreeExpressionSplitRatio(
            clamp(nextRatio, TREE_EXPRESSION_SPLIT_MIN, TREE_EXPRESSION_SPLIT_MAX)
          );
        },
        onEnd: () => {
          treeExpressionDragCleanupRef.current = null;
        }
      });
    },
    [mode, expressionPreviewSegments, safeTreeExpressionSplitRatio]
  );

  const handleTreeExpressionSplitterKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (mode !== 'tree' || !expressionPreviewSegments) {
        return;
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        const direction = event.key === 'ArrowUp' ? -1 : 1;
        const step = event.shiftKey ? 8 : 4;
        setTreeExpressionSplitRatio((prev) =>
          clamp(prev + direction * step, TREE_EXPRESSION_SPLIT_MIN, TREE_EXPRESSION_SPLIT_MAX)
        );
      }
    },
    [mode, expressionPreviewSegments]
  );

  const treeModeDisabled = !parseTree || Boolean(currentParseError);

  const leftPaneStyle = useMemo(() => {
    const base: CSSProperties = {
      ...leftPaneBaseStyle,
      borderRight: showTestingControls ? '1px solid #d0d7de' : 'none'
    };
    if (!showTestingControls) {
      return {
        ...base,
        flex: 1
      };
    }
    return {
      ...base,
      flex: '0 0 auto',
      width: `${safeMainSplitRatio}%`,
      minWidth: 320
    };
  }, [showTestingControls, safeMainSplitRatio]);

  const testingColumnStyle = useMemo(
    () => ({
      ...testingColumnBaseStyle,
      minWidth: 260
    }),
    []
  );

  const treePaneStyle = useMemo(
    () => ({
      ...treePaneBaseStyle,
      flex: '0 0 auto',
      width: safeTreePaneWidth,
      minWidth: TREE_PANE_MIN,
      maxWidth: dynamicTreeMaxWidth
    }),
    [safeTreePaneWidth, dynamicTreeMaxWidth]
  );

  const variablesListStyle = useMemo(
    () => ({
      ...variablesListBaseStyle,
      flexGrow: safeVariableSplitRatio,
      flexShrink: 1,
      flexBasis: 0,
      minHeight: 120
    }),
    [safeVariableSplitRatio]
  );

  const variableEditorContainerStyle = useMemo(
    () => ({
      ...variableEditorBaseStyle,
      flexGrow: 100 - safeVariableSplitRatio,
      flexShrink: 1,
      flexBasis: 0,
      minHeight: 120
    }),
    [safeVariableSplitRatio]
  );

  const baseNodeMinHeight = minHeight ?? 260;
  const nodeEditorMinHeight = expressionPreviewSegments
    ? Math.max(140, Math.min(baseNodeMinHeight, 220))
    : baseNodeMinHeight;

  const nodeEditorContainerStyle = useMemo(() => {
    if (!expressionPreviewSegments) {
      return {
        ...nodeEditorBaseStyle,
        flex: 1,
        minHeight: nodeEditorMinHeight,
        overflow: 'hidden'
      };
    }
    return {
      ...nodeEditorBaseStyle,
      flexGrow: safeTreeExpressionSplitRatio,
      flexShrink: 1,
      flexBasis: 0,
      minHeight: nodeEditorMinHeight,
      overflow: 'hidden'
    };
  }, [expressionPreviewSegments, safeTreeExpressionSplitRatio, nodeEditorMinHeight]);

  const expressionPreviewContainerStyle = useMemo(() => {
    if (!expressionPreviewSegments) {
      return expressionPreviewBaseStyle;
    }
    return {
      ...expressionPreviewBaseStyle,
      flexGrow: 100 - safeTreeExpressionSplitRatio,
      flexShrink: 1,
      flexBasis: 0,
      minHeight: 96
    };
  }, [expressionPreviewSegments, safeTreeExpressionSplitRatio]);

  const testToggleButtonStyle = useMemo(
    () => ({
      ...testToggleStyle,
      ...(showTestingControls ? modeButtonActiveStyle : {})
    }),
    [showTestingControls]
  );

  return (
    <div className="funcscript-tester" ref={containerRef} style={containerStyle}>
      <div style={leftPaneStyle}>
        <div style={toolbarStyle}>
          <div style={toolbarButtonGroupStyle}>
            <button
              type="button"
              style={{
                ...modeButtonBaseStyle,
                ...(mode === 'standard' ? modeButtonActiveStyle : {})
              }}
              onClick={() => setMode('standard')}
            >
              Standard
            </button>
            <button
              type="button"
              style={{
                ...modeButtonBaseStyle,
                ...(mode === 'tree' ? modeButtonActiveStyle : {}),
                ...(treeModeDisabled ? modeButtonDisabledStyle : {})
              }}
              onClick={() => {
                if (!treeModeDisabled) {
                  setMode('tree');
                }
              }}
              disabled={treeModeDisabled}
            >
              Tree
            </button>
            <button
              type="button"
              style={testToggleButtonStyle}
              onClick={() => setShowTestingControls((prev) => !prev)}
              aria-pressed={showTestingControls}
            >
              Test
            </button>
          </div>
          {showTestingControls && (
            <button
              type="button"
              style={playButtonStyle}
              onClick={runTest}
              title="Run test"
              aria-label="Run test"
            >
              {'\u25B6'}
            </button>
          )}
        </div>
        <div style={leftPaneContentStyle}>
          <div style={editorBodyStyle}>
            <div
              style={{
                ...standardEditorWrapperStyle,
                display: mode === 'tree' ? 'none' : 'flex'
              }}
              data-testid="tester-standard-editor"
            >
              <FuncScriptEditor
                value={value}
                onChange={onChange}
                onSegmentsChange={onSegmentsChange}
                onError={handleEditorError}
                onParseNodeChange={handleParseNodeChange}
                minHeight={minHeight ?? 280}
                style={{ ...testerEditorStyle, ...(style ?? {}) }}
              />
            </div>
            {mode === 'tree' && (
              <div ref={treeLayoutRef} style={treeLayoutStyle} data-testid="tester-tree-editor">
                <div ref={parseTreeContainerRef} style={treePaneStyle}>
                  {parseTree ? (
                    <ParseTreeList
                      node={parseTree}
                      level={0}
                      selectedId={selectedNodeId}
                      hoveredId={hoveredNodeId}
                      collapsedNodeIds={collapsedNodeIds}
                      onToggleNode={handleToggleNode}
                      onSelect={handleTreeNodeSelect}
                      pendingSelectedValue={selectedNode ? pendingNodeValue : null}
                    />
                  ) : (
                    <div style={treeEmptyStyle}>Parse tree unavailable. Resolve syntax errors to enable tree mode.</div>
                  )}
                </div>
                <div
                  role="separator"
                  tabIndex={0}
                  aria-orientation="vertical"
                  aria-label="Resize tree panels"
                  aria-valuemin={TREE_PANE_MIN}
                  aria-valuemax={Math.round(dynamicTreeMaxWidth)}
                  aria-valuenow={Math.round(safeTreePaneWidth)}
                  style={treeSplitterStyle}
                  onPointerDown={handleTreeSplitterPointerDown}
                  onKeyDown={handleTreeSplitterKeyDown}
                />
                <div style={treeEditorPaneStyle}>
                  <div style={nodeInfoStyle}>{selectedLabel}</div>
                  {nodeEditorParseError && (
                    <div style={nodeErrorStyle} data-testid="tree-node-error">
                      {nodeEditorParseError}
                    </div>
                  )}
                  <div ref={treeEditorContentRef} style={treeEditorContentStyle}>
                    <div style={nodeEditorContainerStyle} onBlur={handleNodeEditorBlur}>
                      <FuncScriptEditor
                        value={pendingNodeValue}
                        onChange={handleNodeEditorChange}
                        onError={setNodeEditorParseError}
                        minHeight={nodeEditorMinHeight}
                        readOnly={!selectedNode?.isEditable || Boolean(currentParseError)}
                        style={nodeEditorSurfaceStyle}
                      />
                      {treeOverlayMessage ? (
                        <div style={treeEditorOverlayStyle}>{treeOverlayMessage}</div>
                      ) : null}
                    </div>
                    {expressionPreviewSegments && (
                      <>
                        <div
                          role="separator"
                          tabIndex={0}
                          aria-orientation="horizontal"
                          aria-label="Resize expression preview"
                          aria-valuemin={TREE_EXPRESSION_SPLIT_MIN}
                          aria-valuemax={TREE_EXPRESSION_SPLIT_MAX}
                          aria-valuenow={Math.round(safeTreeExpressionSplitRatio)}
                          style={treeExpressionSplitterStyle}
                          onPointerDown={handleTreeExpressionSplitterPointerDown}
                          onKeyDown={handleTreeExpressionSplitterKeyDown}
                        />
                        <div
                          ref={expressionPreviewContainerRef}
                          style={expressionPreviewContainerStyle}
                          onMouseMove={handleExpressionPreviewMouseMove}
                          onMouseLeave={handleExpressionPreviewMouseLeave}
                          onClick={handleExpressionPreviewClick}
                        >
                          {renderExpressionPreviewSegments()}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {showTestingControls && <div style={resultPanelStyle}>{resultContent}</div>}
        </div>
      </div>
      {showTestingControls && (
        <>
          <div
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Resize testing column"
            aria-valuemin={MAIN_SPLIT_MIN}
            aria-valuemax={MAIN_SPLIT_MAX}
            aria-valuenow={Math.round(safeMainSplitRatio)}
            style={mainSplitterStyle}
            onPointerDown={handleMainSplitterPointerDown}
            onKeyDown={handleMainSplitterKeyDown}
          />
          <div ref={testingColumnRef} style={testingColumnStyle}>
            <div style={variablesListStyle}>
              {variableEntries.length === 0 ? (
                <div style={unsetTokenStyle}>Variables will appear here when referenced.</div>
              ) : (
                variableEntries.map((entry) => {
                  const isSelected = entry.key === selectedVariableKey;
                  const hasValue = entry.typedValue !== null && !entry.error;
                  const summaryText = entry.error
                    ? 'Error'
                    : hasValue
                    ? Engine.getTypeName(Engine.typeOf(entry.typedValue as TypedValue))
                    : 'Unset';
                  return (
                    <button
                      key={entry.key}
                      type="button"
                      onClick={() => handleSelectVariable(entry.key)}
                      style={isSelected ? selectedListItemStyle : listItemStyle}
                    >
                      <div>
                        <strong>{entry.name}</strong>
                      </div>
                      <div style={hasValue ? undefined : unsetTokenStyle}>{summaryText}</div>
                      {entry.error ? <div style={errorTextStyle}>{entry.error}</div> : null}
                    </button>
                  );
                })
              )}
            </div>
            <div
              role="separator"
              tabIndex={0}
              aria-orientation="horizontal"
              aria-label="Resize variable editor"
              aria-valuemin={VARIABLE_SPLIT_MIN}
              aria-valuemax={VARIABLE_SPLIT_MAX}
              aria-valuenow={Math.round(safeVariableSplitRatio)}
              style={variableSplitterStyle}
              onPointerDown={handleVariableSplitterPointerDown}
              onKeyDown={handleVariableSplitterKeyDown}
            />
            <div style={variableEditorContainerStyle}>
              <div onBlur={handleVariableEditorBlur} style={variableEditorSurfaceStyle}>
                <FuncScriptEditor
                  key={selectedVariableKey ?? 'variable-editor'}
                  value={variableEditorValue}
                  onChange={handleVariableEditorChange}
                  minHeight={160}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FuncScriptTester;
