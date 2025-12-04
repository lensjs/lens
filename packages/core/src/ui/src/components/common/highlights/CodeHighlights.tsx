export const highlightCode = (code: string) => {
  try {
    const tokens: { text: string; type: string }[] = [];

    // Enhanced regex patterns
    const patterns = [
      { type: "comment", regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/g },
      { type: "string", regex: /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g },
      { type: "template", regex: /`([^`\\]|\\.)*`/g },
      {
        type: "keyword",
        regex:
          /\b(const|let|var|function|class|if|else|for|while|return|import|export|from|try|catch|throw|async|await|new|this|super|extends|implements|interface|type|enum|namespace|public|private|protected|static|readonly|abstract|void|null|undefined|true|false)\b/g,
      },
      { type: "function", regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g },
      { type: "className", regex: /\bclass\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g },
      { type: "property", regex: /\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g },
      { type: "number", regex: /\b\d+(\.\d+)?\b/g },
      { type: "operator", regex: /[+\-*/%=<>!&|^~?:]/g },
      { type: "bracket", regex: /[(){}\[\]]/g },
    ];

    // Find all matches
    const allMatches: {
      start: number;
      end: number;
      type: string;
      text: string;
    }[] = [];

    patterns.forEach(({ type, regex }) => {
      try {
        let match;
        while ((match = regex.exec(code)) !== null) {
          // Handle special cases for class names and properties
          if (type === "className" && match[1]) {
            allMatches.push({
              start: match.index + match[0].indexOf(match[1]),
              end: match.index + match[0].indexOf(match[1]) + match[1].length,
              type: "className",
              text: match[1],
            });
          } else if (type === "property" && match[1]) {
            allMatches.push({
              start: match.index + 1, // Skip the dot
              end: match.index + match[0].length,
              type: "property",
              text: match[1],
            });
          } else {
            allMatches.push({
              start: match.index,
              end: match.index + match[0].length,
              type,
              text: match[0],
            });
          }
        }
      } catch (regexError) {
        console.warn(`Regex error for type ${type}:`, regexError);
      }
    });

    // Sort by position
    allMatches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches (keep first one)
    const validMatches = [];
    let lastEnd = 0;
    for (const match of allMatches) {
      if (match.start >= lastEnd) {
        validMatches.push(match);
        lastEnd = match.end;
      }
    }

    // Build tokens
    let currentPos = 0;
    for (const match of validMatches) {
      // Add text before match
      if (match.start > currentPos) {
        tokens.push({
          text: code.slice(currentPos, match.start),
          type: "text",
        });
      }
      // Add match
      tokens.push({
        text: match.text,
        type: match.type,
      });
      currentPos = match.end;
    }

    // Add remaining text
    if (currentPos < code.length) {
      tokens.push({
        text: code.slice(currentPos),
        type: "text",
      });
    }

    return tokens;
  } catch (error) {
    console.error("Error highlighting code:", error);
    return [{ text: code, type: "text" }];
  }
};

export const getClassName = (type: string) => {
  switch (type) {
    case "comment":
      return "text-green-600 dark:text-green-400 italic";
    case "string":
    case "template":
      return "text-orange-600 dark:text-orange-400";
    case "keyword":
      return "text-blue-600 dark:text-blue-400 font-semibold";
    case "function":
      return "text-yellow-600 dark:text-yellow-400 font-medium";
    case "className":
      return "text-teal-600 dark:text-teal-400 font-semibold";
    case "property":
      return "text-indigo-600 dark:text-indigo-400";
    case "number":
      return "text-purple-600 dark:text-purple-400";
    case "operator":
      return "text-pink-600 dark:text-pink-400";
    case "bracket":
      return "text-gray-600 dark:text-gray-400 font-semibold";
    default:
      return "text-gray-800 dark:text-gray-200";
  }
};
