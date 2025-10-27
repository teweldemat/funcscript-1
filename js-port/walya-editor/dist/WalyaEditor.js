import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin, keymap, drawSelection, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { Engine } from 'walya';
import { computeColoredSegments } from './walyaColoring';
// walya parser exposed via CommonJS build without type declarations
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import * as parserModule from 'walya/parser';
const { WalyaParser } = parserModule;
const areSegmentsEqual = (a, b) => {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i += 1) {
        const segA = a[i];
        const segB = b[i];
        if (segA.start !== segB.start ||
            segA.end !== segB.end ||
            segA.nodeType !== segB.nodeType ||
            segA.color !== segB.color) {
            return false;
        }
    }
    return true;
};
const createHighlightExtension = (provider, callbacks) => {
    const { getSegmentsCallback, getErrorCallback } = callbacks;
    const buildDecorations = (state) => {
        const expression = state.doc.toString();
        let parseNode = null;
        let errorMessage = null;
        if (expression.trim().length > 0) {
            try {
                const result = WalyaParser.parse(provider, expression);
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
        return {
            decorations: Decoration.set(decorations, true),
            segments
        };
    };
    return ViewPlugin.fromClass(class {
        constructor(view) {
            const { decorations, segments } = buildDecorations(view.state);
            this.decorations = decorations;
            this.segments = segments;
        }
        update(update) {
            if (update.docChanged) {
                const { decorations, segments } = buildDecorations(update.state);
                this.decorations = decorations;
                if (!areSegmentsEqual(this.segments, segments)) {
                    this.segments = segments;
                }
                else {
                    this.segments = segments;
                }
            }
        }
    }, {
        decorations: (value) => value.decorations
    });
};
const WalyaEditor = ({ value, onChange, onSegmentsChange, onError, minHeight = 260 }) => {
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
        const highlightExtension = createHighlightExtension(provider, {
            getSegmentsCallback: () => segmentsCallbackRef.current,
            getErrorCallback: () => errorCallbackRef.current
        });
        const state = EditorState.create({
            doc: value,
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
                highlightExtension,
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
    return _jsx("div", { ref: containerRef });
};
export default WalyaEditor;
