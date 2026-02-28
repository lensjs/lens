import { useMemo, useState } from "react";
import DetailPanel from "../../components/DetailPanel";
import TabbedDataViewer from "../../components/tabs/TabbedDataViewer";
import type { OneMail, Mailbox, MimePart, MailHeader } from "../../types";
import { humanDifferentDate } from "@lensjs/date";
import { Download, FileIcon, Calendar, Copy, Check } from "lucide-react";

type Attachment = {
  filename: string;
  contentType: string;
  body: string;
  transferEncoding?: string;
  size?: number;
  contentId?: string;
};

type CalendarEvent = {
  method: string;
  filename: string;
  summary?: string;
  start?: string;
  end?: string;
  location?: string;
  raw: string;
};

const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-500 hover:text-slate-300"
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  );
};

const MailDetails = ({ mail }: { mail: OneMail }) => {
  const data = mail.data;

  const formatMailbox = (mailbox: Mailbox[] | Mailbox | undefined) => {
    if (!mailbox) return "-";
    const boxes = Array.isArray(mailbox) ? mailbox : [mailbox];
    return boxes
      .map((b) =>
        b.name ? `${decodeRFC2047(b.name)} <${b.address}>` : b.address,
      )
      .join(", ");
  };

  const { label: happenedLabel, exact: happenedExact } = humanDifferentDate(
    mail.created_at,
  );

  const decodeQuotedPrintable = (text: string) => {
    const bytes: number[] = [];
    const tempText = text.replace(/=\r?\n/g, "");
    for (let i = 0; i < tempText.length; i++) {
      if (tempText[i] === "=" && /^[0-9A-F]{2}$/i.test(tempText.substring(i + 1, i + 3))) {
        bytes.push(parseInt(tempText.substring(i + 1, i + 3), 16));
        i += 2;
      } else {
        bytes.push(tempText.charCodeAt(i));
      }
    }
    try {
      return new TextDecoder().decode(new Uint8Array(bytes));
    } catch (e) {
      return tempText;
    }
  };

  const decodeRFC2047 = (text: string): string => {
    return text.replace(/=\?([^?]+)\?([QB])\?([^?]+)\?=/gi, (_, charset, encoding, data) => {
      if (encoding.toUpperCase() === "B") {
        try {
          const bin = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
          return new TextDecoder(charset).decode(bin);
        } catch (e) {
          return data;
        }
      } else {
        const decoded = data
          .replace(/_/g, " ")
          .replace(/=([0-9A-F]{2})/gi, (__: string, hex: string) =>
            String.fromCharCode(parseInt(hex, 16)),
          );
        try {
          return new TextDecoder(charset).decode(
            Uint8Array.from([...decoded].map((c) => c.charCodeAt(0))),
          );
        } catch (e) {
          return decoded;
        }
      }
    });
  };

  const decodeBase64ToUTF8 = (b64: string) => {
    try {
      const binaryString = atob(b64.replace(/\s/g, ""));
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch (e) {
      return b64;
    }
  };

  const parseIcs = (ics: string, method: string, filename: string): CalendarEvent => {
    const unfolded = ics.replace(/\r?\n[ \t]/g, "");
    const lines = unfolded.split(/\r?\n/);

    const getVal = (key: string) => {
        const line = lines.find(l => l.toUpperCase().startsWith(`${key.toUpperCase()}:`));
        if (!line) return undefined;
        const colonIndex = line.indexOf(":");
        return line.slice(colonIndex + 1).trim();
    };

    const formatDate = (val?: string) => {
        if (!val) return undefined;
        const m = val.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/);
        if (m) return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]} UTC`;
        return val;
    };

    return {
        method,
        filename,
        summary: getVal("SUMMARY"),
        start: formatDate(getVal("DTSTART")),
        end: formatDate(getVal("DTEND")),
        location: getVal("LOCATION"),
        raw: ics
    };
  };

  const extractFromRaw = (
    fullEml: string,
    rootContentType: string,
  ): { preview: { body: string; type: string } | null; attachments: Attachment[]; calendar?: CalendarEvent } => {
    let htmlPreview: { body: string; type: string } | null = null;
    let plainPreview: { body: string; type: string } | null = null;
    let calendar: CalendarEvent | undefined = undefined;
    const collectedAttachments: Attachment[] = [];

    const getBoundary = (headerBlock: string) => {
      const match = headerBlock.match(/boundary="?([^";\s]+)"?/i);
      return match ? match[1] : null;
    };

    const parsePartInfo = (part: string) => {
      const partHeaderEnd = part.indexOf("\n\n") !== -1 ? part.indexOf("\n\n") : part.indexOf("\r\n\r\n");
      if (partHeaderEnd === -1) return null;

      const headers = part.substring(0, partHeaderEnd).toLowerCase();
      const body = part.substring(partHeaderEnd).trim();

      const contentTypeMatch = headers.match(/content-type:\s*([^;\r\n]+)/i);
      const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : "text/plain";

      const filenameMatch = headers.match(/filename="?([^";\r\n]+)"?/i) || headers.match(/name="?([^";\r\n]+)"?/i);
      const filename = filenameMatch ? filenameMatch[1] : "attachment";

      const contentIdMatch = headers.match(/content-id:\s*<([^>]+)>/i) || headers.match(/content-id:\s*([^;\r\n]+)/i);
      const contentId = contentIdMatch ? contentIdMatch[1].trim() : undefined;

      const disposition = headers.includes("content-disposition: attachment") ? "attachment" : "inline";
      const transferEncoding = headers.includes("content-transfer-encoding: base64") ? "base64" : 
                               headers.includes("content-transfer-encoding: quoted-printable") ? "quoted-printable" : undefined;

      return { headers, body, contentType, filename, disposition, transferEncoding, contentId };
    };

    const traverseRaw = (content: string, boundary: string) => {
      const segments = content.split(`--${boundary}`);
      
      for (let i = 1; i < segments.length; i++) {
        const segment = segments[i];
        if (segment.trim().startsWith("--")) continue;

        const partInfo = parsePartInfo(segment);
        if (!partInfo) continue;

        if (partInfo.contentType.startsWith("multipart/")) {
          const innerBoundary = getBoundary(partInfo.headers);
          if (innerBoundary && innerBoundary !== boundary) {
            traverseRaw(partInfo.body, innerBoundary);
          }
        } else if (partInfo.contentType.includes("text/calendar")) {
            const methodMatch = partInfo.headers.match(/method=([^;\r\n]+)/i);
            const method = methodMatch ? methodMatch[1].toUpperCase() : "PUBLISH";
            let body = partInfo.body;
            if (partInfo.transferEncoding === "quoted-printable") body = decodeQuotedPrintable(body);
            if (partInfo.transferEncoding === "base64") body = decodeBase64ToUTF8(body);
            calendar = parseIcs(body, method, partInfo.filename);
        } else if (partInfo.disposition === "attachment" || (!partInfo.contentType.includes("text/html") && !partInfo.contentType.includes("text/plain"))) {
          collectedAttachments.push({
            filename: partInfo.filename,
            contentType: partInfo.contentType,
            body: partInfo.body,
            transferEncoding: partInfo.transferEncoding,
            size: partInfo.body.length,
            contentId: partInfo.contentId
          });
        } else if (partInfo.contentType.includes("text/html")) {
          let body = partInfo.body;
          if (partInfo.transferEncoding === "quoted-printable") body = decodeQuotedPrintable(body);
          if (partInfo.transferEncoding === "base64") body = decodeBase64ToUTF8(body);
          if (!htmlPreview) htmlPreview = { body, type: "text/html" };
        } else if (partInfo.contentType.includes("text/plain")) {
          let body = partInfo.body;
          if (partInfo.transferEncoding === "quoted-printable") body = decodeQuotedPrintable(body);
          if (partInfo.transferEncoding === "base64") body = decodeBase64ToUTF8(body);
          if (!plainPreview) plainPreview = { body, type: "text/plain" };
        }
      }
    };

    const rootBoundary = getBoundary(rootContentType);
    if (rootBoundary) {
      traverseRaw(fullEml, rootBoundary);
    } else {
      const info = parsePartInfo(fullEml) || { body: fullEml, contentType: rootContentType, transferEncoding: undefined, contentId: undefined };
      let body = info.body;
      if (info.transferEncoding === "quoted-printable") body = decodeQuotedPrintable(body);
      if (info.transferEncoding === "base64") body = decodeBase64ToUTF8(body);
      htmlPreview = { body, type: info.contentType };
    }

    return { preview: htmlPreview || plainPreview, attachments: collectedAttachments, calendar };
  };

  const findAllAttachmentsAndCalendar = (part: MimePart): { attachments: Attachment[], calendar?: CalendarEvent } => {
    const attachments: Attachment[] = [];
    let calendar: CalendarEvent | undefined = undefined;

    const traverse = (p: MimePart) => {
      if (p.contentType.includes("text/calendar")) {
          const methodMatch = p.contentType.match(/method=([^;\r\n]+)/i);
          const method = methodMatch ? methodMatch[1].toUpperCase() : "PUBLISH";
          let body = p.body || "";
          if (p.transferEncoding === "base64") body = decodeBase64ToUTF8(body);
          else if (p.transferEncoding === "quoted-printable") body = decodeQuotedPrintable(body);
          calendar = parseIcs(body, method, p.filename || "invite.ics");
      } else if (p.contentDisposition === "attachment" || (!p.contentType.includes("text/html") && !p.contentType.includes("text/plain") && !p.contentType.includes("multipart/"))) {
        if (p.body) {
          attachments.push({
            filename: p.filename || "file",
            contentType: p.contentType,
            body: p.body,
            transferEncoding: p.transferEncoding,
            size: p.size,
            contentId: p.contentId?.replace(/[<>]/g, "")
          });
        }
      }
      if (p.parts) p.parts.forEach(traverse);
    };
    traverse(part);
    return { attachments, calendar };
  };

  const extractedData = useMemo(() => {
    const { attachments, calendar: treeCalendar } = findAllAttachmentsAndCalendar(data.mime);
    let calendar = treeCalendar;

    const findBestPreviewPart = (part: MimePart): MimePart | null => {
        if (part.contentType.includes("text/html")) return part;
        if (part.contentType.includes("text/plain") && !part.contentDisposition) return part;
        if (part.parts) {
            if (part.contentType.includes("multipart/alternative")) {
                const html = part.parts.find(p => p.contentType.includes("text/html"));
                if (html) return html;
                return part.parts.find(p => p.contentType.includes("text/plain")) || null;
            }
            for (const child of part.parts) {
                const found = findBestPreviewPart(child);
                if (found) return found;
            }
        }
        return null;
    };

    const previewPart = findBestPreviewPart(data.mime);
    let preview: { body: string; type: string } | null = null;

    if (previewPart && previewPart.body) {
        let body = previewPart.body;
        if (previewPart.transferEncoding === "base64") body = decodeBase64ToUTF8(body);
        else if (previewPart.transferEncoding === "quoted-printable") body = decodeQuotedPrintable(body);
        preview = { body, type: previewPart.contentType };
    } else if (data.mime.body) {
        const rawRes = extractFromRaw(data.mime.body, data.mime.contentType);
        preview = rawRes.preview;
        calendar = calendar || rawRes.calendar;
        if (attachments.length === 0) attachments.push(...rawRes.attachments);
    }

    if (preview && preview.type.includes("text/html")) {
        let html = preview.body;
        attachments.forEach(att => {
            if (att.contentId) {
                const b64 = att.transferEncoding === "base64" ? att.body.replace(/\s/g, "") : btoa(att.body);
                const dataUri = `data:${att.contentType};base64,${b64}`;
                const escapedId = att.contentId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`cid:<?${escapedId}>?`, 'g');
                html = html.replace(regex, dataUri);
            }
        });
        preview.body = html;
    }

    return { preview, attachments, calendar };
  }, [data.mime]);

  const buildEmlReconstruction = () => {
    const lines: string[] = [];
    const pushHeader = (name: string, value: string | undefined) => {
      if (value) lines.push(`${name}: ${value}`);
    };

    const formatBoxes = (boxes: Mailbox[] | undefined) => {
      if (!boxes) return undefined;
      return boxes.map(b => b.name ? `"${b.name}" <${b.address}>` : b.address).join(", ");
    };

    pushHeader("MIME-Version", "1.0");
    pushHeader("Date", data.date || new Date().toUTCString());
    pushHeader("Subject", data.subject);
    pushHeader("From", formatBoxes(data.from));
    pushHeader("To", formatBoxes(data.to));
    if (data.cc && data.cc.length > 0) pushHeader("Cc", formatBoxes(data.cc));
    if (data.replyTo && data.replyTo.length > 0) pushHeader("Reply-To", formatBoxes(data.replyTo));
    pushHeader("Message-ID", data.messageId);

    data.headers.forEach((h: MailHeader) => {
      const protectedHeaders = ["mime-version", "date", "subject", "from", "to", "cc", "bcc", "reply-to", "message-id", "content-type"];
      if (!protectedHeaders.includes(h.name.toLowerCase())) {
        pushHeader(h.name, h.value);
      }
    });

    const buildPart = (part: MimePart): string => {
      const partLines: string[] = [];

      if (part.contentType.startsWith("multipart/")) {
        const innerBoundary = `----LensJS_Inner_${Math.random().toString(36).substring(2)}`;
        partLines.push(`Content-Type: ${part.contentType}; boundary="${innerBoundary}"`);
        partLines.push("");
        
        if (part.parts) {
          part.parts.forEach(p => {
            partLines.push(`--${innerBoundary}`);
            partLines.push(buildPart(p));
          });
          partLines.push(`--${innerBoundary}--`);
        }
      } else {
        partLines.push(`Content-Type: ${part.contentType}${part.filename ? `; name="${part.filename}"` : ""}`);
        if (part.contentDisposition) {
          partLines.push(`Content-Disposition: ${part.contentDisposition}${part.filename ? `; filename="${part.filename}"` : ""}`);
        }
        if (part.transferEncoding) partLines.push(`Content-Transfer-Encoding: ${part.transferEncoding}`);
        if (part.contentId) partLines.push(`Content-ID: <${part.contentId.replace(/[<>]/g, "")}>`);
        partLines.push("");
        partLines.push(part.body || "");
      }

      return partLines.join("\r\n");
    };

    const mimeContent = buildPart(data.mime);
    return lines.join("\r\n") + "\r\n" + mimeContent;
  };

  const handleDownloadEml = () => {
    let emlContent = "";
    if (data.raw) {
      emlContent = data.raw.body;
      if (data.raw.transferEncoding === "base64") {
        try { emlContent = atob(emlContent.replace(/\s/g, "")); } catch (e) {}
      }
    } else {
      emlContent = buildEmlReconstruction();
    }

    const blob = new Blob([emlContent], { type: "message/rfc822" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.subject || "mail"}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAttachment = (att: Attachment | { body: string, filename: string, contentType: string, transferEncoding?: string }) => {
    let content: string | Uint8Array = att.body;
    if (att.transferEncoding === "base64") {
        const binaryStr = atob(att.body.replace(/\s/g, ""));
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);
        content = bytes;
    } else if (att.transferEncoding === "quoted-printable") {
        content = decodeQuotedPrintable(att.body);
    }

    const blob = new Blob([content as any], { type: att.contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = att.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const metadataItems = [
    {
      label: "Subject",
      value: data.subject ? decodeRFC2047(data.subject) : "(No Subject)",
      className: "font-bold text-base",
    },
    { label: "From", value: formatMailbox(data.from) },
    { label: "To", value: formatMailbox(data.to) },
    { label: "Date", value: data.date || "-" },
    { label: "Happened", value: <span title={happenedExact}>{happenedLabel}</span> },
    { label: "Message ID", value: data.messageId || "-" },
    {
        label: "Actions",
        value: (
          <button
            onClick={handleDownloadEml}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Download .eml
          </button>
        ),
      },
  ];

  if (data.cc && data.cc.length > 0) {
    metadataItems.splice(3, 0, { label: "Cc", value: formatMailbox(data.cc) });
  }
  if (data.bcc && data.bcc.length > 0) {
    metadataItems.splice(4, 0, { label: "Bcc", value: formatMailbox(data.bcc) });
  }

  const displayAttachments = extractedData.attachments;

  if (displayAttachments.length > 0) {
      metadataItems.push({
          label: "Attachments",
          value: (
              <div className="flex flex-wrap gap-2 mt-1">
                  {displayAttachments.map((att, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleDownloadAttachment(att)}
                        className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs font-medium transition-colors max-w-xs overflow-hidden"
                        title={`${att.filename} (${att.contentType})`}
                      >
                          <FileIcon size={14} className="text-slate-400" />
                          <span className="truncate text-slate-200">{att.filename}</span>
                          <Download size={12} className="text-slate-500" />
                      </button>
                  ))}
              </div>
          )
      });
  }

  const tabs = [
    {
      id: "preview",
      label: "Preview",
      content: extractedData.preview?.body ? (
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900">
          {extractedData.preview.type.includes("text/html") ? (
            <iframe
              title="Mail Preview"
              srcDoc={extractedData.preview.body}
              className="w-full min-h-[500px] border-none bg-white"
              sandbox="allow-popups allow-popups-to-escape-sandbox"
            />
          ) : (
            <pre className="p-4 whitespace-pre-wrap font-sans text-sm text-slate-300 bg-slate-950">
              {extractedData.preview.body}
            </pre>
          )}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500">No preview available</div>
      ),
    },
    {
        id: "calendar",
        label: "Calendar",
        shouldShow: !!extractedData.calendar,
        content: extractedData.calendar && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-100">{extractedData.calendar.summary || "Calendar Event"}</h3>
                            <p className="text-sm text-slate-400">Method: <span className="text-blue-400 font-mono font-bold uppercase">{extractedData.calendar.method}</span></p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleDownloadAttachment({ body: extractedData.calendar!.raw, filename: extractedData.calendar!.filename, contentType: "text/calendar" })}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition-colors"
                    >
                        <Download size={16} />
                        Download .ics
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800/50">
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Start Time</span>
                        <span className="text-slate-200">{extractedData.calendar.start || "Not specified"}</span>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800/50">
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">End Time</span>
                        <span className="text-slate-200">{extractedData.calendar.end || "Not specified"}</span>
                    </div>
                    {extractedData.calendar.location && (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800/50 md:col-span-2">
                            <span className="text-xs font-bold text-slate-500 uppercase block mb-1 flex items-center gap-2">
                                Location
                                <CopyButton value={extractedData.calendar.location} />
                            </span>
                            <span className="text-slate-200 break-all">{extractedData.calendar.location}</span>
                        </div>
                    )}
                </div>

                <div className="mt-2">
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Raw Data</span>
                    <pre className="bg-slate-900 p-4 rounded-lg text-xs text-slate-400 overflow-x-auto border border-slate-800">
                        {extractedData.calendar.raw}
                    </pre>
                </div>
            </div>
        )
    },
    {
      id: "headers",
      label: "Headers",
      data: data.headers.reduce((acc: any, h) => {
        acc[h.name] = h.value;
        return acc;
      }, {}),
    },
    {
        id: "meta",
        label: "Metadata",
        data: data.meta as any,
    }
  ];

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <DetailPanel title="Mail Summary" items={metadataItems} />
      <TabbedDataViewer tabs={tabs} defaultActiveTab="preview" />
    </div>
  );
};

export default MailDetails;
