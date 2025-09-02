import { ParseRequestResult } from '../types';

const HEADER_BODY_SEPARATOR_CRLF = '\r\n\r\n';
const HEADER_BODY_SEPARATOR_LF = '\n\n';

const LINE_SPLIT_REGEX = /\r\n|\n/;
const START_LINE_SPLIT_REGEX = /\s+/;

export function parseHttpRequest(rawText: string): ParseRequestResult {
  const { header, body } = splitHeaderAndBody(rawText);
  const headerLines = header.split(LINE_SPLIT_REGEX);

  const startLine = headerLines[0] ?? '';
  const { method, uri } = parseStartLine(startLine);
  const headers = parseHeaders(headerLines);

  return { method, uri, headers, body };
}

function splitHeaderAndBody(rawText: string): { header: string; body: string } {
  const { index, length } = findHeaderBodySeparator(rawText);

  if (index === -1) {
    return { header: rawText, body: '' };
  }

  return {
    header: rawText.slice(0, index),
    body: rawText.slice(index + length),
  };
}

function findHeaderBodySeparator(rawText: string): { index: number; length: number } {
  let index = rawText.indexOf(HEADER_BODY_SEPARATOR_CRLF);
  let length = HEADER_BODY_SEPARATOR_CRLF.length;

  if (index === -1) {
    index = rawText.indexOf(HEADER_BODY_SEPARATOR_LF);
    length = HEADER_BODY_SEPARATOR_LF.length;
  }

  return { index, length };
}

function parseStartLine(line: string): { method: string; uri: string } {
  const parts = line.trim().split(START_LINE_SPLIT_REGEX);

  return {
    method: parts[0] ?? '',
    uri: parts[1] ?? '',
  };
}

function parseHeaders(lines: string[]): ParseRequestResult['headers'] {
  const headers: ParseRequestResult['headers'] = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const colonPos = line.indexOf(':');

    if (colonPos === -1) continue;

    const name = line.slice(0, colonPos).trim();
    const value = line.slice(colonPos + 1).trim();

    if (headers[name]) {
      if (Array.isArray(headers[name])) {
        (headers[name] as string[]).push(value);
      } else {
        headers[name] = [headers[name] as string, value];
      }
    } else {
      headers[name] = value;
    }
  }

  return headers;
}
