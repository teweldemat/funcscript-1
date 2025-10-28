import type { ColoredSegment } from './funcscriptColoring';
export type FuncScriptEditorProps = {
    value: string;
    onChange: (value: string) => void;
    onSegmentsChange?: (segments: ColoredSegment[]) => void;
    onError?: (message: string | null) => void;
    minHeight?: number;
};
declare const FuncScriptEditor: ({ value, onChange, onSegmentsChange, onError, minHeight }: FuncScriptEditorProps) => import("react/jsx-runtime").JSX.Element;
export default FuncScriptEditor;
