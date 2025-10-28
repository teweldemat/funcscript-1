const fs = require('fs');
const path = require('path');

const profilePath = process.argv[2] || 'buganalysis.cpuprofile';
const fullPath = path.resolve(profilePath);
const raw = fs.readFileSync(fullPath, 'utf8');
const profile = JSON.parse(raw);

const nodeMap = new Map();
for (const node of profile.nodes || []) {
  node.selfTime = 0;
  node.totalTime = 0;
  node.children = node.children || [];
  node.parent = node.parent || 0;
  nodeMap.set(node.id, node);
}

const samples = profile.samples || [];
const timeDeltas = profile.timeDeltas || [];
for (let i = 0; i < samples.length; i += 1) {
  const id = samples[i];
  const delta = timeDeltas[i] || 0;
  const node = nodeMap.get(id);
  if (!node) {
    continue;
  }
  node.selfTime += delta;
  let current = node;
  while (current) {
    current.totalTime += delta;
    current = nodeMap.get(current.parent);
  }
}

const totalTime = timeDeltas.reduce((acc, cur) => acc + cur, 0);

function describeNode(node) {
  const frame = node.callFrame || {};
  const name = frame.functionName && frame.functionName.length > 0 ? frame.functionName : '(anonymous)';
  const url = frame.url || '';
  const line = typeof frame.lineNumber === 'number' && frame.lineNumber >= 0 ? `:${frame.lineNumber + 1}` : '';
  return `${name} ${url}${line}`.trim();
}

function printTop(label, accessor) {
  console.log(`\nTop ${label}:`);
  const sorted = Array.from(nodeMap.values())
    .filter((n) => accessor(n) > 0)
    .sort((a, b) => accessor(b) - accessor(a))
    .slice(0, 15);
  for (const node of sorted) {
    const value = accessor(node);
    const percent = totalTime === 0 ? 0 : (value / totalTime) * 100;
    console.log(
      `${percent.toFixed(2).padStart(6)}% ${(value / 1000).toFixed(2).padStart(8)} ms  ${describeNode(node)}`
    );
  }
}

function normalizeUrl(url) {
  if (!url) {
    return '(unknown)';
  }
  if (url.startsWith('file://')) {
    try {
      const filePath = new URL(url);
      return path.normalize(filePath.pathname);
    } catch (err) {
      return url;
    }
  }
  return url;
}

const fileTotals = new Map();
for (const node of nodeMap.values()) {
  if (!node.totalTime) {
    continue;
  }
  const frame = node.callFrame || {};
  const normalized = normalizeUrl(frame.url || '');
  const prev = fileTotals.get(normalized) || 0;
  fileTotals.set(normalized, prev + node.totalTime);
}

function printTopFiles() {
  console.log('\nTop files by inclusive time:');
  const entries = Array.from(fileTotals.entries())
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  for (const [file, value] of entries) {
    const percent = totalTime === 0 ? 0 : (value / totalTime) * 100;
    console.log(
      `${percent.toFixed(2).padStart(6)}% ${(value / 1000).toFixed(2).padStart(8)} ms  ${file}`
    );
  }
}

console.log(`Profile: ${path.basename(fullPath)}`);
console.log(`Total sampled time: ${(totalTime / 1000).toFixed(2)} ms`);

printTop('self time nodes', (n) => n.selfTime);
printTop('inclusive nodes', (n) => n.totalTime);
printTopFiles();
