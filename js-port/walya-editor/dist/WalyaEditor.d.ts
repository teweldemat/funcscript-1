import { type CSSProperties } from 'react';
import type { ColoredSegment } from './walyaColoring.js';
/**
 * Props for the {@link WalyaEditor} component.
 */
export type WalyaEditorProps = {
    /**
     * Current Walya expression text to display inside the editor.
     */
    value: string;
    /**
     * Called with the updated text whenever the document changes.
     */
    onChange: (value: string) => void;
    /**
     * Optional callback fired with the list of colored segments generated from the Walya parse tree.
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
/**
 * CodeMirror-powered editor with Walya-aware parsing, syntax coloring, folding, and telemetry.
 */
declare const WalyaEditor: ({ value, onChange, onSegmentsChange, onError, minHeight, style }: WalyaEditorProps) => import("react/jsx-runtime").JSX.Element;
export default WalyaEditor;
