const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function utf8Bytes(input: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i += 1) {
    let code = input.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < input.length) {
      const next = input.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        i += 1;
      }
    }
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
}

function utf8String(bytes: Uint8Array): string {
  let output = '';
  let i = 0;
  while (i < bytes.length) {
    const first = bytes[i];
    i += 1;
    let code: number;
    if (first < 0x80) {
      code = first;
    } else if ((first & 0xe0) === 0xc0) {
      code = ((first & 0x1f) << 6) | (bytes[i] & 0x3f);
      i += 1;
    } else if ((first & 0xf0) === 0xe0) {
      code = ((first & 0x0f) << 12) | ((bytes[i] & 0x3f) << 6) | (bytes[i + 1] & 0x3f);
      i += 2;
    } else {
      code =
        ((first & 0x07) << 18) |
        ((bytes[i] & 0x3f) << 12) |
        ((bytes[i + 1] & 0x3f) << 6) |
        (bytes[i + 2] & 0x3f);
      i += 3;
    }
    if (code > 0xffff) {
      code -= 0x10000;
      output += String.fromCharCode(0xd800 + (code >> 10), 0xdc00 + (code & 0x3ff));
    } else {
      output += String.fromCharCode(code);
    }
  }
  return output;
}

export function encodeBase64(input: string): string {
  const bytes = utf8Bytes(input);
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    const triple = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    output += ALPHABET[(triple >> 18) & 63];
    output += ALPHABET[(triple >> 12) & 63];
    output += b === undefined ? '=' : ALPHABET[(triple >> 6) & 63];
    output += c === undefined ? '=' : ALPHABET[triple & 63];
  }
  return output;
}

export function decodeBase64(input: string): string {
  const clean = input.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const a = ALPHABET.indexOf(clean[i]);
    const b = ALPHABET.indexOf(clean[i + 1]);
    const c = ALPHABET.indexOf(clean[i + 2]);
    const d = ALPHABET.indexOf(clean[i + 3]);
    if (a < 0 || b < 0) continue;
    const triple = (a << 18) | (b << 12) | ((c < 0 ? 0 : c) << 6) | (d < 0 ? 0 : d);
    bytes.push((triple >> 16) & 255);
    if (c >= 0) bytes.push((triple >> 8) & 255);
    if (d >= 0) bytes.push(triple & 255);
  }
  return utf8String(new Uint8Array(bytes));
}
