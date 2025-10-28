import { useEffect, useRef, type CSSProperties } from 'react';
import { EditorState, StateField, type Range } from '@codemirror/state';
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
import { Engine } from '@tewelde/funscscript/browser';
import type { DefaultFsDataProvider } from '@tewelde/funscscript/browser';
import type { ColoredSegment } from './funscscriptColoring.js';
import { computeColoredSegments } from './funscscriptColoring.js';

// funscscript parser exposed via CommonJS build without type declarations
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import * as parserModule from '@tewelde/funscscript/parser';

const { FunscScriptParser } = parserModule as { FunscScriptParser: any };

/**
 * Props for the {@link FunscScriptEditor} component.
 */
export type FunscScriptEditorProps = {
  /**
   * Current FunscScript expression text to display inside the editor.
   */
  value: string;
  /**
   * Called with the updated text whenever the document changes.
   */
  onChange: (value: string) => void;
  /**
   * Optional callback fired with the list of colored segments generated from the FunscScript parse tree.
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
};

type HighlightCallbacks = {
  getSegmentsCallback: () => ((segments: ColoredSegment[]) => void) | undefined;
  getErrorCallback: () => ((message: string | null) => void) | undefined;
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
};

type FoldRange = {
  lineStart: number;
  from: number;
  to: number;
};

type FunscScriptAnalysis = {
  decorations: DecorationSet;
  segments: ColoredSegment[];
  foldRanges: FoldRange[];
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

const createFunscScriptExtensions = (
  provider: DefaultFsDataProvider,
  callbacks: HighlightCallbacks
) => {
  const { getSegmentsCallback, getErrorCallback } = callbacks;

  const analyze = (state: EditorState): FunscScriptAnalysis => {
    const expression = state.doc.toString();
    let parseNode: RawParseNode | null = null;
    let errorMessage: string | null = null;

    if (expression.trim().length > 0) {
      try {
        const result = FunscScriptParser.parse(provider, expression);
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

    const foldRanges = parseNode ? collectFoldRanges(parseNode, state.doc) : [];

    return {
      decorations: Decoration.set(decorations, true),
      segments,
      foldRanges
    };
  };

  const analysisField = StateField.define<FunscScriptAnalysis>({
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
 * CodeMirror-powered editor with FunscScript-aware parsing, syntax coloring, folding, and telemetry.
 */
const FunscScriptEditor = ({
  value,
  onChange,
  onSegmentsChange,
  onError,
  minHeight = 260,
  style
}: FunscScriptEditorProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const providerRef = useRef<DefaultFsDataProvider | null>(null);

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

    const funscscriptExtensions = createFunscScriptExtensions(provider, {
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
        ...funscscriptExtensions,
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

  return <div ref={containerRef} style={style} />;
};

export default FunscScriptEditor;
