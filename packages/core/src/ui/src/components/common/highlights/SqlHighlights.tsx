const MONGO_KEYWORDS = [
  "db",
  "find",
  "insertOne",
  "insertMany",
  "updateOne",
  "updateMany",
  "deleteOne",
  "deleteMany",
  "aggregate",
  "project",
  "match",
  "group",
  "sort",
  "limit",
  "skip",
  "$match",
  "$project",
  "$group",
  "$sort",
  "$limit",
  "$skip",
  "$and",
  "$or",
  "$eq",
  "$ne",
  "$in",
  "$nin",
];
// --- Static constants ---
const KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "OUTER",
  "FULL",
  "ON",
  "AND",
  "OR",
  "NOT",
  "IN",
  "EXISTS",
  "BETWEEN",
  "LIKE",
  "IS",
  "NULL",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "CREATE",
  "TABLE",
  "ALTER",
  "DROP",
  "INDEX",
  "PRIMARY",
  "KEY",
  "FOREIGN",
  "REFERENCES",
  "CONSTRAINT",
  "UNIQUE",
  "CHECK",
  "DEFAULT",
  "AUTO_INCREMENT",
  "IDENTITY",
  "GROUP",
  "BY",
  "HAVING",
  "ORDER",
  "ASC",
  "DESC",
  "LIMIT",
  "OFFSET",
  "UNION",
  "ALL",
  "DISTINCT",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "IF",
  "IFNULL",
  "COALESCE",
  "CAST",
  "CONVERT",
  "SUBSTRING",
  "LENGTH",
  "UPPER",
  "LOWER",
  "TRIM",
];

const FUNCTIONS = [
  "NOW",
  "CURRENT_TIMESTAMP",
  "CURRENT_DATE",
  "CURRENT_TIME",
  "DATE",
  "TIME",
  "YEAR",
  "MONTH",
  "DAY",
  "HOUR",
  "MINUTE",
  "SECOND",
];

const DATA_TYPES = [
  "VARCHAR",
  "CHAR",
  "TEXT",
  "INT",
  "INTEGER",
  "BIGINT",
  "SMALLINT",
  "TINYINT",
  "DECIMAL",
  "NUMERIC",
  "FLOAT",
  "DOUBLE",
  "REAL",
  "BIT",
  "BOOLEAN",
  "BOOL",
  "DATE",
  "TIME",
  "DATETIME",
  "TIMESTAMP",
  "YEAR",
  "BINARY",
  "VARBINARY",
  "BLOB",
  "CLOB",
  "JSON",
  "UUID",
];

export function highlightMongo(query: string) {
  const tokens = query.split(/(\s+|[{}[\]()=,:])/);

  return tokens.map((token, i) => {
    if (!token.trim()) return <span key={i}>{token}</span>;

    if (/^['"`].*['"`]$/.test(token)) {
      // Strings
      return (
        <span key={i} className="text-green-600 dark:text-green-400">
          {token}
        </span>
      );
    }

    if (/^\d+\.?\d*$/.test(token)) {
      // Numbers
      return (
        <span key={i} className="text-orange-600 dark:text-orange-400">
          {token}
        </span>
      );
    }

    if (MONGO_KEYWORDS.includes(token)) {
      // Keywords
      return (
        <span
          key={i}
          className="text-blue-600 dark:text-blue-400 font-semibold"
        >
          {token}
        </span>
      );
    }

    return <span key={i}>{token}</span>;
  });
}

export function highlightSql(sqlText: string) {
  // Split into words, spaces, punctuation, strings, numbers, comments
  const tokens = sqlText.split(
    /(\s+|[(),;]|'[^']*'|"[^"]*"|\b\d+\.?\d*\b|--[^\n]*|\/\*[\s\S]*?\*\/)/
  );

  return tokens.map((token, index) => {
    const trimmed = token.trim();
    if (!trimmed) return <span key={index}>{token}</span>;

    if (
      (token.startsWith("'") && token.endsWith("'")) ||
      (token.startsWith('"') && token.endsWith('"'))
    )
      return (
        <span key={index} className="text-green-600 dark:text-green-400">
          {token}
        </span>
      );

    if (/^\d+\.?\d*$/.test(trimmed))
      return (
        <span key={index} className="text-orange-600 dark:text-orange-400">
          {token}
        </span>
      );

    if (
      token.startsWith("--") ||
      (token.startsWith("/*") && token.endsWith("*/"))
    )
      return (
        <span key={index} className="text-neutral-500 dark:text-neutral-400">
          {token}
        </span>
      );

    if (KEYWORDS.some((k) => k.toLowerCase() === trimmed.toLowerCase()))
      return (
        <span
          key={index}
          className="text-blue-600 dark:text-blue-400 font-semibold"
        >
          {token.toUpperCase()}
        </span>
      );

    if (FUNCTIONS.some((f) => f.toLowerCase() === trimmed.toLowerCase()))
      return (
        <span key={index} className="text-purple-600 dark:text-purple-400">
          {token.toUpperCase()}
        </span>
      );

    if (DATA_TYPES.some((t) => t.toLowerCase() === trimmed.toLowerCase()))
      return (
        <span key={index} className="text-indigo-600 dark:text-indigo-400">
          {token.toUpperCase()}
        </span>
      );

    return <span key={index}>{token}</span>;
  });
}
