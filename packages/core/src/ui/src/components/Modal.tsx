import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ visible, onClose, children }: ModalProps) => {
  useEffect(() => {
    const controller = new AbortController();

    addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      },
      { signal: controller.signal },
    );

    return () => {
      controller.abort();
    };
  }, []);

  if (!visible) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[99] flex items-center justify-center">
      <div
        className="absolute inset-0 z-[99] bg-black/40 backdrop-blur-[3px]"
        aria-hidden={!open}
        onClick={onClose}
        role="button"
        tabIndex={-1}
      ></div>
      <div className="z-[100]">{children}</div>
    </div>,
    document.body,
  );
};

export default Modal;
