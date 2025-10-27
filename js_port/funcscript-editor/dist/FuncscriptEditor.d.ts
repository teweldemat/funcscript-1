import type { ColoredSegment } from './funcscriptColoring';
export type FuncscriptEditorProps = {
    value: string;
    onChange: (value: string) => void;
    onSegmentsChange?: (segments: ColoredSegment[]) => void;
    onError?: (message: string | null) => void;
    minHeight?: number;
};
declare const FuncscriptEditor: ({ value, onChange, onSegmentsChange, onError, minHeight }: FuncscriptEditorProps) => import("react/jsx-runtime").JSX.Element;
export default FuncscriptEditor;
