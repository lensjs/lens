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
        <div className="flex flex-col items-center justify-center gap-6 sm:p-8 p-6 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-md mx-auto">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full">
            <Trash2 size={24} className="text-red-500 dark:text-red-400" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Delete all entries?
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              This will permanently delete all entries from your database. This
              action cannot be undone.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 w-full">
            <button
              className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors duration-200"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-500 hover:bg-red-600 disabled:bg-red-300 dark:disabled:bg-red-800 text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
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
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
        className="group relative p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-red-300 dark:hover:border-red-700 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 shadow-sm hover:shadow-md"
        aria-label="Delete all entries"
        title="Delete all entries"
      >
        <Trash2
          size={18}
          className="text-neutral-500 dark:text-neutral-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors duration-200"
        />
      </button>
    </>
  );
}
