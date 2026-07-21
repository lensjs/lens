import { Trash2 } from "lucide-react";
import { useConfig } from "../../utils/context";
import { useRef, useState } from "react";
import Modal from "../Modal";
import { prepareApiUrl } from "../../utils/api";

export default function DeleteButton() {
  const config = useConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const confirmButton = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Modal visible={isOpen} onClose={() => setIsOpen(false)}>
        <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 rounded-2xl border border-border bg-elevated p-6 text-fg shadow-2xl sm:p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 ring-1 ring-inset ring-danger/20">
            <Trash2 size={24} className="text-danger" />
          </div>

          <div className="space-y-2 text-center">
            <h1 className="text-xl font-semibold text-fg">Delete all entries?</h1>
            <p className="text-sm leading-relaxed text-muted">
              This will permanently delete all entries from your database. This
              action cannot be undone.
            </p>
          </div>

          <div className="flex w-full items-center justify-center gap-3">
            <button
              className="flex-1 rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-elevated"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="flex-1 rounded-lg bg-danger px-4 py-2.5 text-sm font-medium text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
              ref={confirmButton}
              onClick={async () => {
                try {
                  setLoading(true);
                  await fetch(prepareApiUrl(config.api.truncate), {
                    method: "DELETE",
                  });
                  window.location.reload();
                } catch (error) {
                  // eslint-disable-next-line no-console
                  console.error("Failed to delete:", error);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Deleting...
                </div>
              ) : (
                "Delete All"
              )}
            </button>
          </div>
        </div>
      </Modal>
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => confirmButton.current?.focus(), 0);
        }}
        className="group rounded-lg border border-border bg-surface-2/60 p-2 shadow-sm transition-all hover:border-danger/40 hover:bg-danger/10"
        aria-label="Delete all entries"
        title="Delete all entries"
      >
        <Trash2
          size={17}
          className="text-muted transition-colors group-hover:text-danger"
        />
      </button>
    </>
  );
}
