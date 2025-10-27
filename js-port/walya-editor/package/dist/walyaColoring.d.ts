export type ColoredSegment = {
    start: number;
    end: number;
    nodeType: string;
    color: string | null;
};
export declare const parseNodePalette: string[];
export declare function computeColoredSegments(expression: string, parseNode: unknown | null | undefined): ColoredSegment[];
