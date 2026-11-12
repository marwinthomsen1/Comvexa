"use client";
import { ToolButton } from "@/components/ui/studio-icon";
export function SelectionControls({
  count,
  editableCount,
  unitCount,
  hasGroup,
  multiSelect,
  setMultiSelect,
  snapping,
  setSnapping,
  act,
  compact = false,
}) {
  if (compact)
    return (
      <div
        className="professional-bar"
        role="toolbar"
        aria-label="Professional editing tools"
      >
        <ToolButton
          icon="select"
          aria-pressed={multiSelect}
          onClick={() => setMultiSelect(!multiSelect)}
          title="Select multiple objects without a keyboard"
        >
          Multi-select
        </ToolButton>
        <ToolButton icon="all" onClick={() => act("all")}>
          Select all
        </ToolButton>
        <ToolButton icon="clear" disabled={!count} onClick={() => act("clear")}>
          Clear
        </ToolButton>
        <ToolButton
          icon="group"
          disabled={editableCount < 2}
          onClick={() => act("group")}
          title="Group · ⌘/Ctrl G"
        >
          Group
        </ToolButton>
        <ToolButton
          icon="ungroup"
          disabled={!hasGroup || !editableCount}
          onClick={() => act("ungroup")}
          title="Ungroup · ⌘/Ctrl Shift G"
        >
          Ungroup
        </ToolButton>
        <ToolButton
          icon="copy"
          disabled={!count}
          onClick={() => act("copy")}
          title="Copy · ⌘/Ctrl C"
        >
          Copy
        </ToolButton>
        <ToolButton
          icon="paste"
          onClick={() => act("paste")}
          title="Paste Comvexa selection · ⌘/Ctrl V"
        >
          Paste
        </ToolButton>
        <ToolButton
          icon="snap"
          aria-pressed={snapping}
          onClick={() => setSnapping(!snapping)}
          title="Snap movement and 15° rotations. Hold Shift to temporarily invert snapping."
        >
          Snap {snapping ? "on" : "off"}
        </ToolButton>
      </div>
    );
  return (
    <>
      <div className="panel-eyebrow">WORK WITH YOUR SELECTION</div>
      <h2>{count} elements selected</h2>
      <p className="editor-small">
        {editableCount} editable. Locked or hidden groups stay protected. Resize
        proportionally with the corner handles; rotate with the circular handle.
        Hold Shift to temporarily toggle snapping.
      </p>
      <div className="selection-action-grid">
        {[
          ["copy", "copy", "Copy"],
          ["cut", "cut", "Cut"],
          ["paste", "paste", "Paste"],
          ["duplicate", "copy", "Duplicate"],
          ["delete", "trash", "Delete"],
          ["group", "group", "Group"],
          ["ungroup", "ungroup", "Ungroup"],
        ].map(([action, icon, label]) => (
          <ToolButton
            key={action}
            icon={icon}
            disabled={
              action === "paste"
                ? false
                : action === "group"
                  ? editableCount < 2
                  : action === "ungroup"
                    ? !hasGroup || !editableCount
                    : !count
            }
            onClick={() => act(action)}
          >
            {label}
          </ToolButton>
        ))}
      </div>
      <details className="studio-details" open>
        <summary>Align & distribute</summary>
        <p className="editor-small">
          Align separate objects or groups to the selection bounds. A single
          group aligns to the canvas.
        </p>
        <div className="selection-action-grid">
          {[
            ["left", "alignLeft", "Left"],
            ["center", "alignCenter", "Center"],
            ["right", "alignRight", "Right"],
            ["top", "alignTop", "Top"],
            ["middle", "alignMiddle", "Middle"],
            ["bottom", "alignBottom", "Bottom"],
          ].map(([value, icon, label]) => (
            <ToolButton
              key={value}
              icon={icon}
              disabled={!editableCount}
              title={`Align ${label.toLowerCase()}`}
              onClick={() => act("align", value)}
            >
              {label}
            </ToolButton>
          ))}
          <ToolButton
            icon="horizontal"
            disabled={unitCount < 3}
            onClick={() => act("distribute", "x")}
          >
            Even horizontal gaps
          </ToolButton>
          <ToolButton
            icon="vertical"
            disabled={unitCount < 3}
            onClick={() => act("distribute", "y")}
          >
            Even vertical gaps
          </ToolButton>
          <ToolButton
            icon="alignCenter"
            disabled={!editableCount}
            onClick={() => act("align", "canvas-center")}
          >
            Canvas horizontal center
          </ToolButton>
          <ToolButton
            icon="alignMiddle"
            disabled={!editableCount}
            onClick={() => act("align", "canvas-middle")}
          >
            Canvas vertical center
          </ToolButton>
        </div>
      </details>
      <details className="studio-details">
        <summary>Exact group transform</summary>
        <p className="editor-small">
          Proportional scale and rotation around the selection center; one undo
          step.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            act("transform", {
              scale: Number(f.get("scale")) / 100,
              rotation: Number(f.get("rotation")),
            });
          }}
        >
          <label className="editor-field">
            Scale %
            <input
              type="number"
              name="scale"
              min="1"
              max="1000"
              defaultValue="100"
              required
            />
          </label>
          <label className="editor-field">
            Rotate degrees
            <input
              type="number"
              name="rotation"
              min="-360"
              max="360"
              defaultValue="0"
              required
            />
          </label>
          <button disabled={!editableCount}>Apply selection transform</button>
        </form>
      </details>
      <details className="studio-details" open>
        <summary>Layers & arrangement</summary>
        <div className="selection-action-grid">
          <ToolButton
            icon="down"
            disabled={!count}
            onClick={() => act("backward")}
          >
            Send backward
          </ToolButton>
          <ToolButton
            icon="up"
            disabled={!count}
            onClick={() => act("forward")}
          >
            Bring forward
          </ToolButton>
          <ToolButton icon="lock" disabled={!count} onClick={() => act("lock")}>
            Lock selection
          </ToolButton>
          <ToolButton
            icon="unlock"
            disabled={!count}
            onClick={() => act("unlock")}
          >
            Unlock selection
          </ToolButton>
          <ToolButton icon="hide" disabled={!count} onClick={() => act("hide")}>
            Hide selection
          </ToolButton>
          <ToolButton icon="eye" disabled={!count} onClick={() => act("show")}>
            Show selection
          </ToolButton>
        </div>
      </details>
    </>
  );
}
