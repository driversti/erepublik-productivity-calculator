import { describe, it, expect } from 'vitest';
import { stripJsonComments, stripTrailingCommas } from './jsonc';

// Strip // and /* */ comments so a JSONC config parses with JSON.parse.
describe('stripJsonComments', () => {
  it('removes a trailing line comment', () => {
    expect(JSON.parse(stripJsonComments('{"a": 1} // hi'))).toEqual({ a: 1 });
  });

  it('removes full-line and inline line comments', () => {
    const src = `{
      // owner stats
      "a": 1, // first
      "b": 2
    }`;
    expect(JSON.parse(stripJsonComments(src))).toEqual({ a: 1, b: 2 });
  });

  it('removes block comments', () => {
    expect(JSON.parse(stripJsonComments('{/* note */ "a": 1}'))).toEqual({ a: 1 });
  });

  it('preserves // and /* */ inside string values', () => {
    const src = '{"region": "Lithuania-Minor", "note": "a//b /*c*/ d"}';
    expect(JSON.parse(stripJsonComments(src))).toEqual({ region: 'Lithuania-Minor', note: 'a//b /*c*/ d' });
  });

  it('preserves escaped quotes inside strings', () => {
    const src = '{"q": "she said \\"// hi\\""}';
    expect(JSON.parse(stripJsonComments(src))).toEqual({ q: 'she said "// hi"' });
  });

  it('is a no-op for clean JSON', () => {
    const src = '{"a":1,"b":[1,2,3]}';
    expect(stripJsonComments(src)).toBe(src);
  });
});

describe('stripTrailingCommas', () => {
  it('removes a trailing comma before } and ]', () => {
    expect(JSON.parse(stripTrailingCommas('{"a":1,}'))).toEqual({ a: 1 });
    expect(JSON.parse(stripTrailingCommas('[1,2,3,]'))).toEqual([1, 2, 3]);
  });

  it('removes a trailing comma with whitespace/newlines before the close', () => {
    expect(JSON.parse(stripTrailingCommas('{\n  "a": 1,\n  "b": 2,\n}'))).toEqual({ a: 1, b: 2 });
  });

  it('keeps commas that separate elements', () => {
    expect(JSON.parse(stripTrailingCommas('{"a":1,"b":2}'))).toEqual({ a: 1, b: 2 });
  });

  it('does not touch a comma inside a string value', () => {
    expect(JSON.parse(stripTrailingCommas('{"a":"x,}","b":"y,]"}'))).toEqual({ a: 'x,}', b: 'y,]' });
  });
});
