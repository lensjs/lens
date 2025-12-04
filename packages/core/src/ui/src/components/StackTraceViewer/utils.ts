export interface ParsedStackLine {
  function: string | null;
  file: string | null;
  line: string | null;
  column: string | null;
  raw: string;
}

export const parseStackLine = (line: string): ParsedStackLine => {
  // Parse different stack trace formats
  const patterns = [
    // at functionName (file:line:column)
    /at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/,
    // at file:line:column
    /at\s+(.+?):(\d+):(\d+)/,
    // functionName@file:line:column (Firefox style)
    /(.+?)@(.+?):(\d+):(\d+)/,
    // Generic pattern
    /(.+)/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      if (match.length >= 5) {
        return {
          function: match[1]?.trim(),
          file: match[2]?.trim(),
          line: match[3],
          column: match[4],
          raw: line,
        };
      } else if (match.length >= 4) {
        return {
          function: null,
          file: match[1]?.trim(),
          line: match[2],
          column: match[3],
          raw: line,
        };
      } else if (match.length >= 4 && match[0].includes("@")) {
        return {
          function: match[1]?.trim(),
          file: match[2]?.trim(),
          line: match[3],
          column: match[4],
          raw: line,
        };
      }
    }
  }

  return {
    function: null,
    file: null,
    line: null,
    column: null,
    raw: line,
  };
};
