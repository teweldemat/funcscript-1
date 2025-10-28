import type { ColoredSegment } from './funscscriptColoring';
export type FunscScriptEditorProps = {
    value: string;
    onChange: (value: string) => void;
    onSegmentsChange?: (segments: ColoredSegment[]) => void;
    onError?: (message: string | null) => void;
    minHeight?: number;
};
declare const FunscScriptEditor: ({ value, onChange, onSegmentsChange, onError, minHeight }: FunscScriptEditorProps) => import("react/jsx-runtime").JSX.Element;
export default FunscScriptEditor;
