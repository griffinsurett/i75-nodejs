import { Edit, RotateCcw, Archive as ArchiveIcon, Trash2 } from "lucide-react";
import ActionsMenu from "./ActionsMenu";
import ConfirmModal from "./ConfirmModal";
import useArchive from "../hooks/useArchive";

/**
 * EditActions
 * Reusable overflow menu for edit / archive / unarchive / delete.
 *
 * Props:
 * - id (number|string)
 * - isArchived (bool)
 * - editTo (string) optional Link route for Edit
 * - api: { archive: (id)=>Promise, restore: (id)=>Promise, delete: (id)=>Promise }
 * - onChanged: callback to refetch parent list/entity
 * - menu props passthrough: buttonClassName, menuClassName, align, ariaLabel
 */
export default function EditActions({
  id,
  isArchived,
  editTo,
  api,
  onChanged,
  buttonClassName = "w-8 h-8 bg-bg/80 backdrop-blur",
  menuClassName = "w-44",
  align = "right",
  ariaLabel = "Actions",
}) {
  const { state, openArchive, openDelete, close, toggleArchive, hardDelete } =
    useArchive({
      archiveFn: api.archive,
      restoreFn: api.restore,
      deleteFn: api.delete,
      onSuccess: onChanged,
    });

  return (
    <>
      <ActionsMenu
        ariaLabel={ariaLabel}
        align={align}
        buttonClassName={buttonClassName}
        menuClassName={menuClassName}
        items={[
          editTo ? { label: "Edit", icon: Edit, to: editTo } : null,
          {
            label: isArchived ? "Unarchive" : "Archive",
            icon: isArchived ? RotateCcw : ArchiveIcon,
            onClick: openArchive,
          },
          {
            label: "Delete",
            icon: Trash2,
            danger: true,
            onClick: openDelete,
          },
        ].filter(Boolean)}
      />

      {/* Archive / Unarchive */}
      <ConfirmModal
        isOpen={state.open && state.type === "archive"}
        onClose={close}
        title={isArchived ? "Unarchive course?" : "Archive course?"}
        description={
          isArchived
            ? "This will make the course active again and visible to users."
            : "Archiving hides the course from active views but keeps all data. You can restore it anytime."
        }
        confirmLabel={isArchived ? "Unarchive" : "Archive"}
        onConfirm={() => toggleArchive(id, isArchived)}
        busy={state.busy}
        error={state.error}
      />

      {/* Delete (hard—actually scheduled in backend) */}
      <ConfirmModal
        isOpen={state.open && state.type === "delete"}
        onClose={close}
        title="Delete course?"
        description="This action permanently deletes the course. Consider archiving if you might need it later."
        confirmLabel="Delete"
        confirmClass="bg-red-600"
        onConfirm={() => hardDelete(id)}
        busy={state.busy}
        error={state.error}
      />
    </>
  );
}
