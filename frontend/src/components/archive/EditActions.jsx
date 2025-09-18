import { Edit, RotateCcw, Archive as ArchiveIcon, Trash2 } from "lucide-react";
import ActionsMenu from "../ActionsMenu";
import ConfirmModal from "../ConfirmModal";
import useArchive from "../../hooks/useArchive";

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
 * - entityName: string for display (e.g., "course", "instructor", "image") - defaults to "item"
 * - menu props passthrough: buttonClassName, menuClassName, align, ariaLabel
 */
export default function EditActions({
  id,
  isArchived,
  editTo,
  api,
  onChanged,
  entityName = "item",
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

  // Capitalize first letter for display
  const displayName = entityName.charAt(0).toUpperCase() + entityName.slice(1);

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
        title={isArchived ? `Unarchive ${entityName}?` : `Archive ${entityName}?`}
        description={
          isArchived
            ? `This will make the ${entityName} active again and visible to users.`
            : `Archiving hides the ${entityName} from active views but keeps all data. You can restore it anytime.`
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
        title={`Delete ${entityName}?`}
        description={`This action permanently deletes the ${entityName}. Consider archiving if you might need it later.`}
        confirmLabel="Delete"
        confirmClass="bg-red-600"
        onConfirm={() => hardDelete(id)}
        busy={state.busy}
        error={state.error}
      />
    </>
  );
}