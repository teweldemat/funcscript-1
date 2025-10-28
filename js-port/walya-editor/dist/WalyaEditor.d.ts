import { type CSSProperties } from 'react';
import type { ColoredSegment } from './walyaColoring.js';
export type WalyaEditorProps = {
    value: string;
    onChange: (value: string) => void;
    onSegmentsChange?: (segments: ColoredSegment[]) => void;
    onError?: (message: string | null) => void;
    minHeight?: number;
    style?: CSSProperties;
};
declare const WalyaEditor: ({ value, onChange, onSegmentsChange, onError, minHeight, style }: WalyaEditorProps) => import("react/jsx-runtime").JSX.Element;
export default WalyaEditor;
