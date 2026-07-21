import { FileInfo } from "./FileInfo";
import { FrameBadge } from "./FrameBadge";
import { FunctionName } from "./FunctionName";
import { parseStackLine } from "./utils";

interface StackFrameProps {
  line: string;
  index: number;
  isFirst: boolean;
}

export const StackFrame: React.FC<StackFrameProps> = ({
  line,
  index,
  isFirst,
}) => {
  const parsed = parseStackLine(line);

  return (
    <div
      className={`group hover:bg-surface-2/50 transition-colors ${
        isFirst ? "bg-warning/10" : ""
      }`}
    >
      <div className="flex items-start gap-3 p-3">
        <FrameBadge index={index} isFirst={isFirst} />

        {/* Stack frame details */}
        <div className="flex-1 min-w-0">
          {parsed.function && <FunctionName functionName={parsed.function} />}

          {parsed.file && (
            <FileInfo
              file={parsed.file}
              line={parsed.line || undefined}
              column={parsed.column || undefined}
            />
          )}

          {/* Raw line for unparsed or complex traces */}
          {!parsed.function && !parsed.file && (
            <div className="font-mono text-sm text-fg break-all">
              {parsed.raw}
            </div>
          )}
        </div>

        {isFirst && (
          <div className="flex-shrink-0">
            <div className="bg-warning text-fg px-2 py-1 rounded text-xs font-medium">
              Origin
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
