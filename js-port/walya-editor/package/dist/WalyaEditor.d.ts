import type { ColoredSegment } from './walyaColoring';
export type WalyaEditorProps = {
    value: string;
    onChange: (value: string) => void;
    onSegmentsChange?: (segments: ColoredSegment[]) => void;
    onError?: (message: string | null) => void;
    minHeight?: number;
};
declare const WalyaEditor: ({ value, onChange, onSegmentsChange, onError, minHeight }: WalyaEditorProps) => import("react/jsx-runtime").JSX.Element;
export default WalyaEditor;
