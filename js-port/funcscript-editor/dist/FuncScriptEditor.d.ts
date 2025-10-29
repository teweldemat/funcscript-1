import { type CSSProperties } from 'react';
import type { ColoredSegment } from './funcscriptColoring.js';
type RawParseNode = {
    Pos?: number;
    pos?: number;
    Length?: number;
    length?: number;
    Childs?: RawParseNode[];
    childs?: RawParseNode[];
    Children?: RawParseNode[];
    children?: RawParseNode[];
    NodeType?: string;
    nodeType?: string;
    Type?: string;
    type?: string;
};
export type FuncScriptParseNode = RawParseNode;
export type FuncScriptEditorProps = {
    value: string;
    onChange: (value: string) => void;
    onSegmentsChange?: (segments: ColoredSegment[]) => void;
    onError?: (message: string | null) => void;
    onParseNodeChange?: (node: FuncScriptParseNode | null) => void;
    minHeight?: number;
    style?: CSSProperties;
    readOnly?: boolean;
};
declare const FuncScriptEditor: ({ value, onChange, onSegmentsChange, onError, onParseNodeChange, minHeight, style, readOnly }: FuncScriptEditorProps) => import("react/jsx-runtime").JSX.Element;
export default FuncScriptEditor;
