import { type CSSProperties } from 'react';
import type { ColoredSegment } from './funcscriptColoring.js';
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
/**
 * CodeMirror-powered editor with FuncScript-aware parsing, syntax coloring, folding, and telemetry.
 */
declare const FuncScriptEditor: ({ value, onChange, onSegmentsChange, onError, minHeight, style, saveKey }: FuncScriptEditorProps) => import("react/jsx-runtime").JSX.Element;
export default FuncScriptEditor;
