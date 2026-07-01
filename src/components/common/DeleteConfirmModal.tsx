import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";

type DeleteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting?: boolean;
  entityLabel: string;
  displayName?: string;
};

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  deleting = false,
  entityLabel,
  displayName,
}: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[480px] m-4">
      <div className="rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Delete {entityLabel}
        </h4>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete this {entityLabel}
          {displayName ? (
            <>
              {" "}
              <span className="font-medium text-gray-800 dark:text-white/90">
                ({displayName})
              </span>
            </>
          ) : null}
          ? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" disabled={deleting} onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={deleting}
            className="!bg-error-500 !text-white hover:!bg-error-600 disabled:!bg-error-300 !ring-0"
            onClick={onConfirm}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
