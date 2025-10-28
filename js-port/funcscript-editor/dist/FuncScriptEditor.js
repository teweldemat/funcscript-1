import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { EditorState, StateField } from '@codemirror/state';
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
const createFuncScriptExtensions = (provider, callbacks) => {
    const { getSegmentsCallback, getErrorCallback } = callbacks;
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
        const foldRanges = parseNode ? collectFoldRanges(parseNode, state.doc) : [];
        return {
            decorations: Decoration.set(decorations, true),
            segments,
            foldRanges
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
    const viewRef = useRef(null);
    const providerRef = useRef(null);
    const segmentsCallbackRef = useRef(onSegmentsChange);
    const errorCallbackRef = useRef(onError);
    useEffect(() => {
        segmentsCallbackRef.current = onSegmentsChange;
    }, [onSegmentsChange]);
    useEffect(() => {
        errorCallbackRef.current = onError;
    }, [onError]);
    useEffect(() => {
        if (!containerRef.current) {
            return undefined;
        }
        const provider = new Engine.DefaultFsDataProvider();
        providerRef.current = provider;
        const funcscriptExtensions = createFuncScriptExtensions(provider, {
            getSegmentsCallback: () => segmentsCallbackRef.current,
            getErrorCallback: () => errorCallbackRef.current
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
    return _jsx("div", { ref: containerRef, style: style });
};
export default FuncScriptEditor;
