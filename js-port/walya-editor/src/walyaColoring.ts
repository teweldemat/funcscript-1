import { colorParseTree } from 'walya';

type RawSegment = {
  Pos?: number;
  pos?: number;
  Length?: number;
  length?: number;
  NodeType?: string;
  nodeType?: string;
};

export type ColoredSegment = {
  start: number;
  end: number;
  nodeType: string;
  color: string | null;
};

export const parseNodePalette = [
  '#1565C0',
  '#C2185B',
  '#2E7D32',
  '#EF6C00',
  '#6A1B9A',
  '#00838F',
  '#FF8F00',
  '#4527A0',
  '#5D4037',
  '#00695C',
  '#C62828',
  '#558B2F'
];

const sanitizeRange = (start: number, end: number, length: number) => {
  const safeStart = Math.max(0, Math.min(start, length));
  const safeEnd = Math.max(safeStart, Math.min(end, length));
  return safeEnd > safeStart ? { start: safeStart, end: safeEnd } : null;
};

export function computeColoredSegments(
  expression: string,
  parseNode: unknown | null | undefined
): ColoredSegment[] {
  const length = expression.length;
  if (!parseNode || length === 0) {
    return length
      ? [
          {
            start: 0,
            end: length,
            nodeType: 'Expression',
            color: null
          }
        ]
      : [];
  }

  let rawSegments: unknown[] = [];
  try {
    const segments = colorParseTree(parseNode as any);
    if (Array.isArray(segments)) {
      rawSegments = segments;
    }
  } catch (error) {
    return length
      ? [
          {
            start: 0,
            end: length,
            nodeType: 'Expression',
            color: null
          }
        ]
      : [];
  }

  const normalized = rawSegments
    .map((segment) => {
      const data = segment as RawSegment;
      const pos = typeof data.Pos === 'number' ? data.Pos : typeof data.pos === 'number' ? data.pos : 0;
      const len = typeof data.Length === 'number' ? data.Length : typeof data.length === 'number' ? data.length : 0;
      const nodeType = typeof data.NodeType === 'string'
        ? data.NodeType
        : typeof data.nodeType === 'string'
        ? data.nodeType
        : 'Node';
      const safe = sanitizeRange(pos, pos + len, length);
      if (!safe) {
        return null;
      }
      return {
        start: safe.start,
        end: safe.end,
        nodeType
      };
    })
    .filter((segment): segment is { start: number; end: number; nodeType: string } => Boolean(segment))
    .sort((a, b) => (a.start === b.start ? a.end - b.end : a.start - b.start));

  const colorMap = new Map<string, string>();
  let paletteIndex = 0;
  const getColor = (nodeType: string) => {
    if (colorMap.has(nodeType)) {
      return colorMap.get(nodeType)!;
    }
    const color = parseNodePalette[paletteIndex % parseNodePalette.length];
    paletteIndex += 1;
    colorMap.set(nodeType, color);
    return color;
  };

  const segments: ColoredSegment[] = [];
  let cursor = 0;
  for (const segment of normalized) {
    const start = Math.max(cursor, segment.start);
    const end = Math.max(start, segment.end);

    if (start > cursor) {
      segments.push({
        start: cursor,
        end: start,
        nodeType: 'Whitespace',
        color: null
      });
    }

    if (end > start) {
      segments.push({
        start,
        end,
        nodeType: segment.nodeType,
        color: getColor(segment.nodeType)
      });
    }

    cursor = end;
  }

  if (cursor < length) {
    segments.push({
      start: cursor,
      end: length,
      nodeType: 'Whitespace',
      color: null
    });
  }

  if (segments.length === 0 && length > 0) {
    segments.push({
      start: 0,
      end: length,
      nodeType: 'Expression',
      color: null
    });
  }

  return segments;
}
