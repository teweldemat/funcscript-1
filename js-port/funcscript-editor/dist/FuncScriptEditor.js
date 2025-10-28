import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compartment, EditorState, StateField } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin, keymap, drawSelection, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { foldGutter, foldKeymap, foldService } from '@codemirror/language';
import { lineNumbers } from '@codemirror/view';
import { Engine } from '@tewelde/funcscript/browser';
import { computeColoredSegments } from './funcscriptColoring.js';
// funcscript parser exposed via CommonJS build without type declarations
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import * as parserModule from '@tewelde/funcscript/parser';
const { FuncScriptParser } = parserModule;
const clampRange = (start, end, length) => {
    const safeStart = Math.max(0, Math.min(start, length));
    const safeEnd = Math.max(safeStart, Math.min(end, length));
    return safeEnd > safeStart ? { start: safeStart, end: safeEnd } : null;
};
const toNodeRange = (node, docLength) => {
    const pos = typeof node.Pos === 'number' ? node.Pos : typeof node.pos === 'number' ? node.pos : null;
    const len = typeof node.Length === 'number'
        ? node.Length
        : typeof node.length === 'number'
            ? node.length
            : null;
    if (pos === null || len === null) {
        return null;
    }
    return clampRange(pos, pos + len, docLength);
};
const getChildNodes = (node) => {
    const value = node.Childs ?? node.childs ?? node.Children ?? node.children;
    return Array.isArray(value) ? value : [];
};
const collectFoldRanges = (root, doc) => {
    if (doc.length === 0) {
        return [];
    }
    const stack = [root];
    const byLine = new Map();
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
// Node types that represent structural containers rather than standalone expressions.
const NON_EDITABLE_NODE_TYPES = new Set([
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
    'Operator'
]);
const isEditableTypeName = (typeName) => {
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
const getNodeTypeName = (node) => {
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
const buildParseTree = (root, docText) => {
    if (!root) {
        return null;
    }
    const docLength = docText.length;
    const collapseSingleChild = (node, path) => {
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
    const collectDisplayChildren = (node, path) => {
        const rawChildren = getChildNodes(node);
        const displayChildren = [];
        for (let index = 0; index < rawChildren.length; index += 1) {
            const { node: collapsedNode, path: collapsedPath } = collapseSingleChild(rawChildren[index], [...path, index]);
            displayChildren.push(walk(collapsedNode, collapsedPath));
        }
        return displayChildren;
    };
    const walk = (node, path) => {
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
const createParseNodeIndex = (root) => {
    const map = new Map();
    const visit = (node) => {
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
const formatExpressionPreview = (expression) => {
    const condensed = expression.replace(/\s+/g, ' ').trim();
    if (condensed.length === 0) {
        return '';
    }
    if (condensed.length > 48) {
        return condensed.slice(0, 45) + '...';
    }
    return condensed;
};
const findNodeByRange = (root, target) => {
    if (!root) {
        return null;
    }
    let exactMatch = null;
    let startMatch = null;
    let overlapMatch = null;
    const stack = [root];
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
const findFirstEditableNode = (root) => {
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
const treeButtonBaseStyle = {
    width: '100%',
    background: 'transparent',
    border: '1px solid transparent',
    textAlign: 'left',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 12,
    transition: 'background-color 0.1s ease'
};
const ParseTreeList = ({ node, level, selectedId, onSelect }) => {
    const label = `${node.typeName}:${formatExpressionPreview(node.expression)}`;
    const isSelected = node.id === selectedId;
    const isEditable = node.isEditable;
    const isSelectable = isEditable;
    const displayLabel = label || node.typeName;
    if (!isEditable) {
        return (_jsx("div", { children: node.children.map((child) => (_jsx(ParseTreeList, { node: child, level: level, selectedId: selectedId, onSelect: onSelect }, child.id))) }));
    }
    const style = {
        ...treeButtonBaseStyle,
        marginLeft: level * TREE_NODE_INDENT,
        backgroundColor: isSelected ? '#0366d6' : 'transparent',
        color: isSelected ? '#ffffff' : '#24292f',
        cursor: isSelectable ? 'pointer' : 'default'
    };
    return (_jsxs("div", { children: [_jsx("button", { type: "button", style: style, disabled: !isSelectable, onClick: () => {
                    if (isSelectable) {
                        onSelect(node.id);
                    }
                }, title: label, children: displayLabel }), node.children.map((child) => (_jsx(ParseTreeList, { node: child, level: level + 1, selectedId: selectedId, onSelect: onSelect }, child.id)))] }));
};
const containerBaseStyle = {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #d0d7de',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    overflow: 'hidden'
};
const titleBarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px',
    borderBottom: '1px solid #d0d7de',
    backgroundColor: '#f6f8fa',
    gap: 8
};
const titleTextStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: '#24292f'
};
const titleControlsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6
};
const modeButtonBaseStyle = {
    border: '1px solid #d0d7de',
    backgroundColor: '#ffffff',
    color: '#24292f',
    borderRadius: 4,
    fontSize: 12,
    padding: '2px 8px',
    cursor: 'pointer'
};
const modeButtonActiveStyle = {
    backgroundColor: '#24292f',
    color: '#ffffff',
    borderColor: '#24292f'
};
const modeButtonDisabledStyle = {
    opacity: 0.5,
    cursor: 'not-allowed'
};
const bodyBaseStyle = {
    display: 'flex',
    alignItems: 'stretch',
    minHeight: 0,
    flex: 1
};
const treePaneBaseStyle = {
    width: 260,
    borderRight: '1px solid #d0d7de',
    overflowY: 'auto',
    padding: '8px 4px',
    backgroundColor: '#fafbfc'
};
const treeEmptyStyle = {
    fontSize: 12,
    color: '#57606a',
    padding: '4px 6px'
};
const editorPaneBaseStyle = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column'
};
const codeMirrorContainerBaseStyle = {
    flex: 1
};
const nodeInfoStyle = {
    fontSize: 12,
    padding: '6px 12px',
    borderBottom: '1px solid #e1e4e8',
    backgroundColor: '#f6f8fa',
    color: '#24292f'
};
const treeEditorContainerBaseStyle = {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    borderTop: '1px solid #e1e4e8',
    backgroundColor: '#ffffff'
};
const treeEditorCodeMirrorStyle = {
    position: 'absolute',
    inset: 0
};
const treeEditorOverlayStyle = {
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
const nodeErrorStyle = {
    fontSize: 12,
    color: '#cf222e',
    padding: '4px 12px',
    backgroundColor: '#ffebeb',
    borderBottom: '1px solid #ffd7d5'
};
const expressionPreviewContainerStyle = {
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
const expressionSelectedTextStyle = {
    textDecoration: 'underline',
    fontWeight: 600,
    color: '#24292f'
};
const createFuncScriptExtensions = (provider, callbacks) => {
    const { getSegmentsCallback, getErrorCallback, getParseNodeCallback } = callbacks;
    const analyze = (state) => {
        const expression = state.doc.toString();
        let parseNode = null;
        let errorMessage = null;
        if (expression.trim().length > 0) {
            try {
                const result = FuncScriptParser.parse(provider, expression);
                parseNode = result?.parseNode ?? null;
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : String(error);
            }
        }
        const segments = computeColoredSegments(expression, parseNode);
        const decorations = [];
        for (const segment of segments) {
            if (!segment.color) {
                continue;
            }
            const style = 'color:' +
                segment.color +
                ';font-weight:600;text-shadow:0 0 0.6px rgba(0,0,0,0.25);';
            decorations.push(Decoration.mark({
                attributes: {
                    style
                }
            }).range(segment.start, segment.end));
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
    const analysisField = StateField.define({
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
    const highlightPlugin = ViewPlugin.fromClass(class {
        constructor(view) {
            this.decorations = view.state.field(analysisField).decorations;
        }
        update(update) {
            if (update.docChanged) {
                this.decorations = update.state.field(analysisField).decorations;
            }
        }
    }, {
        decorations: (value) => value.decorations
    });
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
const FuncScriptEditor = ({ value, onChange, onSegmentsChange, onError, minHeight = 260, style }) => {
    const containerRef = useRef(null);
    const nodeEditorContainerRef = useRef(null);
    const viewRef = useRef(null);
    const nodeEditorViewRef = useRef(null);
    const providerRef = useRef(null);
    const [mode, setMode] = useState('standard');
    const [currentParseNode, setCurrentParseNode] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [pendingNodeValue, setPendingNodeValue] = useState('');
    const [hasPendingChanges, setHasPendingChanges] = useState(false);
    const [currentParseError, setCurrentParseError] = useState(null);
    const [nodeEditorParseError, setNodeEditorParseError] = useState(null);
    const segmentsCallbackRef = useRef(onSegmentsChange);
    const userErrorCallbackRef = useRef(onError);
    const parseNodeCallbackRef = useRef(() => { });
    const analysisErrorCallbackRef = useRef(() => { });
    const nodeEditorErrorCallbackRef = useRef(() => { });
    const selectedNodeRef = useRef(null);
    const nodeEditorEditableCompartment = useRef(new Compartment());
    const pendingSelectionRangeRef = useRef(null);
    const handleParseNodeUpdate = useCallback((node) => {
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
        setNodeEditorParseError(message);
    };
    useEffect(() => {
        segmentsCallbackRef.current = onSegmentsChange;
    }, [onSegmentsChange]);
    useEffect(() => {
        userErrorCallbackRef.current = onError;
    }, [onError]);
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
            effects: nodeEditorEditableCompartment.current.reconfigure(EditorView.editable.of(isEditable))
        });
    }, [selectedNode]);
    useEffect(() => {
        if (mode === 'tree' && !parseTree) {
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
            return;
        }
        const pendingRange = pendingSelectionRangeRef.current;
        if (pendingRange) {
            const replacement = findNodeByRange(parseTree, pendingRange);
            if (replacement && replacement.isEditable) {
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
    }, [parseTree, parseNodeMap, selectedNodeId, firstEditableNode]);
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
    const handleSelectNode = useCallback((nodeId) => {
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
        setPendingNodeValue(node.expression);
        setHasPendingChanges(false);
        setNodeEditorParseError(null);
        pendingSelectionRangeRef.current = null;
    }, [parseNodeMap, selectedNodeId]);
    const handleApplyChanges = useCallback(() => {
        if (!selectedNode || !selectedNode.range || !selectedNode.isEditable) {
            return;
        }
        if (!hasPendingChanges) {
            return;
        }
        const { start, end } = selectedNode.range;
        const nextDoc = value.slice(0, start) + pendingNodeValue + value.slice(end);
        pendingSelectionRangeRef.current = {
            start,
            end: start + pendingNodeValue.length
        };
        onChange(nextDoc);
        setHasPendingChanges(false);
    }, [selectedNode, hasPendingChanges, pendingNodeValue, value, onChange]);
    const mergedContainerStyle = useMemo(() => ({
        ...containerBaseStyle,
        ...(style ?? {})
    }), [style]);
    const contentStyle = useMemo(() => {
        const base = { ...bodyBaseStyle };
        if (mode === 'tree') {
            base.minHeight = minHeight;
        }
        return base;
    }, [mode, minHeight]);
    const codeMirrorContainerStyle = useMemo(() => ({
        ...codeMirrorContainerBaseStyle,
        display: mode === 'tree' ? 'none' : 'block'
    }), [mode]);
    const treeEditorContainerStyle = useMemo(() => ({
        ...treeEditorContainerBaseStyle,
        minHeight
    }), [minHeight]);
    const standardButtonStyle = useMemo(() => ({
        ...modeButtonBaseStyle,
        ...(mode === 'standard' ? modeButtonActiveStyle : {})
    }), [mode]);
    const treeButtonStyle = useMemo(() => ({
        ...modeButtonBaseStyle,
        ...(mode === 'tree' ? modeButtonActiveStyle : {}),
        ...(!parseTree ? modeButtonDisabledStyle : {})
    }), [mode, parseTree]);
    const canApplyChanges = mode === 'tree' &&
        Boolean(selectedNode?.range && selectedNode?.isEditable) &&
        hasPendingChanges &&
        !currentParseError &&
        !nodeEditorParseError;
    const applyButtonStyle = useMemo(() => ({
        ...modeButtonBaseStyle,
        fontWeight: 600
    }), []);
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
                    EditorView.theme({
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
                    }, { dark: false }),
                    ...nodeExtensions,
                    nodeEditorEditableCompartment.current.of(EditorView.editable.of(Boolean(selectedNodeRef.current?.range && selectedNodeRef.current?.isEditable))),
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            const nextValue = update.state.doc.toString();
                            setPendingNodeValue(nextValue);
                            const node = selectedNodeRef.current;
                            if (node && node.isEditable) {
                                setHasPendingChanges(nextValue !== node.expression);
                            }
                            else {
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
                EditorView.theme({
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
                }, { dark: false }),
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
    const selectedLabel = selectedNode
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
    return (_jsxs("div", { style: mergedContainerStyle, children: [_jsxs("div", { style: titleBarStyle, children: [_jsx("span", { style: titleTextStyle, children: mode === 'tree' ? 'Tree Mode' : 'Standard Mode' }), _jsxs("div", { style: titleControlsStyle, children: [_jsx("button", { type: "button", style: standardButtonStyle, onClick: () => setMode('standard'), children: "Standard" }), _jsx("button", { type: "button", style: treeButtonStyle, onClick: () => {
                                    if (parseTree) {
                                        setMode('tree');
                                    }
                                }, disabled: !parseTree, children: "Tree" }), canApplyChanges && (_jsx("button", { type: "button", style: applyButtonStyle, onClick: handleApplyChanges, title: "Apply changes to selected node", children: "\u2713" }))] })] }), _jsxs("div", { style: contentStyle, children: [mode === 'tree' && (_jsx("div", { style: treePaneBaseStyle, children: parseTree ? (_jsx(ParseTreeList, { node: parseTree, level: 0, selectedId: selectedNodeId, onSelect: handleSelectNode })) : (_jsx("div", { style: treeEmptyStyle, children: "Parse tree unavailable. Resolve syntax errors to enable tree mode." })) })), _jsxs("div", { style: editorPaneBaseStyle, children: [mode === 'tree' && _jsx("div", { style: nodeInfoStyle, children: selectedLabel }), mode === 'tree' && nodeEditorParseError && (_jsx("div", { style: nodeErrorStyle, children: nodeEditorParseError })), _jsx("div", { ref: containerRef, style: codeMirrorContainerStyle }), mode === 'tree' && (_jsxs("div", { style: treeEditorContainerStyle, children: [_jsx("div", { ref: nodeEditorContainerRef, style: treeEditorCodeMirrorStyle }), treeEditorOverlayMessage && (!selectedNode || !selectedNode.isEditable) && (_jsx("div", { style: treeEditorOverlayStyle, children: treeEditorOverlayMessage }))] })), mode === 'tree' && expressionPreviewSegments && (_jsxs("div", { style: expressionPreviewContainerStyle, children: [_jsx("span", { children: expressionPreviewSegments.before }), expressionPreviewSegments.hasSelection && (_jsx("span", { style: expressionSelectedTextStyle, children: expressionPreviewSegments.selection || ' ' })), _jsx("span", { children: expressionPreviewSegments.after })] }))] })] })] }));
};
export default FuncScriptEditor;
