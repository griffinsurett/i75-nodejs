import SelectionCheckbox from './SelectionCheckbox';

export default function SelectableItem({
  children,
  itemId,
  isSelected,
  onToggleSelect,
  selectionMode,
  checkboxPosition = "top-left",
  className = "",
  onClick
}) {
  const handleClick = (e) => {
    if (selectionMode) {
      e.preventDefault();
      onToggleSelect(itemId);
    } else if (onClick) {
      onClick();
    }
  };

  const positions = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
  };

  return (
    <div 
      className={`relative ${isSelected && selectionMode ? 'ring-2 ring-primary' : ''} ${className}`}
      onClick={handleClick}
    >
      {selectionMode && (
        <div className={`absolute z-20 ${positions[checkboxPosition]}`}>
          <SelectionCheckbox
            isSelected={isSelected}
            onToggle={() => onToggleSelect(itemId)}
          />
        </div>
      )}
      {children}
    </div>
  );
}