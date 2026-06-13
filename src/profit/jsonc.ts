// Strip // line and /* */ block comments from a JSONC string so it can be passed
// to JSON.parse — lets the inventory config carry inline guidance. Comment markers
// inside string values are preserved. No trailing-comma handling (keep it simple).
export function stripJsonComments(input: string): string {
  let out = '';
  let inStr = false, esc = false, line = false, block = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    const n = input[i + 1];
    if (line) {
      if (c === '\n') { line = false; out += c; }
      continue;
    }
    if (block) {
      if (c === '*' && n === '/') { block = false; i++; }
      continue;
    }
    if (inStr) {
      out += c;
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === '/' && n === '/') { line = true; i++; continue; }
    if (c === '/' && n === '*') { block = true; i++; continue; }
    out += c;
  }
  return out;
}
