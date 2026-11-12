"use client";
import { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Ellipse,
  Text,
  Image as KImage,
  Transformer,
  Group,
  Line,
} from "react-konva";
import { loadRenderImage } from "@/lib/editor/images";
import {
  editableIds,
  expandSelection,
  marqueeSelection,
  snapSelection,
} from "@/lib/editor/selection";
function Element({
  element: e,
  asset,
  onSelect,
  onEdit,
  onDragStart,
  onDragMove,
  onDragEnd,
  canDrag,

  preview,
}) {
  const [image, setImage] = useState(null);
  useEffect(() => {
    let active = true,
      rendered;
    if (asset)
      loadRenderImage(asset.src)
        .then((i) => {
          if (active) {
            rendered = i;
            setImage(i);
          } else {
            i.width = 0;
            i.height = 0;
          }
        })
        .catch(() => {});
    return () => {
      active = false;
      if (rendered) {
        rendered.width = 0;
        rendered.height = 0;
      }
    };
  }, [asset]);
  const props = {
    id: e.id,
    x: e.x,
    y: e.y,
    width: e.width,
    height: e.height,
    rotation: e.rotation,
    opacity: e.opacity,
    draggable: !preview && canDrag,
    onClick: onSelect,
    onTap: onSelect,
    onDblClick: () => e.type === "text" && !e.locked && onEdit(e.id),
    onDblTap: () => e.type === "text" && !e.locked && onEdit(e.id),
    onDragStart,
    onDragMove,
    onDragEnd,
  };
  if (e.type === "text")
    return (
      <Text
        {...props}
        text={e.text}
        fontFamily={e.fontFamily}
        fontSize={e.fontSize}
        fontStyle={e.fontWeight}
        lineHeight={e.lineHeight}
        align={e.align}
        fill={e.fill}
      />
    );
  if (e.type === "image")
    return (
      <KImage
        {...props}
        image={image}
        crop={{
          x: e.crop.x * asset.width,
          y: e.crop.y * asset.height,
          width: e.crop.width * asset.width,
          height: e.crop.height * asset.height,
        }}
      />
    );
  if (e.type === "ellipse")
    return (
      <Ellipse
        {...props}
        radiusX={e.width / 2}
        radiusY={e.height / 2}
        offsetX={-e.width / 2}
        offsetY={-e.height / 2}
        fill={e.fill}
        stroke={e.stroke}
        strokeWidth={e.strokeWidth}
      />
    );
  return (
    <Rect
      {...props}
      fill={e.fill}
      stroke={e.stroke}
      strokeWidth={e.strokeWidth}
      cornerRadius={e.cornerRadius}
    />
  );
}
export default function DesignCanvas({
  doc,
  selectedIds,
  select,
  patch,
  patchMany,
  selectIds,
  multiSelect,
  snapping,
  zoom,
  preview,
  editId,
  setEditId,
  aspectLocked,
}) {
  const stage = useRef(null),
    transformer = useRef(null);
  const [guides, setGuides] = useState([]);
  const [marquee, setMarquee] = useState(null);
  const marqueeStart = useRef(null),
    drag = useRef(null);
  const movable = editableIds(doc, selectedIds);
  function nodesFor(ids) {
    return ids.map((id) => stage.current?.findOne("#" + id)).filter(Boolean);
  }
  function beginDrag(event, e) {
    const ids = selectedIds.includes(e.id)
      ? selectedIds
      : expandSelection(doc, [e.id]);
    selectIds(ids);
    drag.current = {
      items: doc.elements.filter((n) => editableIds(doc, ids).includes(n.id)),
      anchor: e,
    };
    if (!drag.current.items.some((n) => n.id === e.id)) event.target.stopDrag();
  }
  function dragMove(event) {
    const session = drag.current;
    if (!session) return;
    const delta = snapSelection(
      doc,
      session.items.map((n) => n.id),
      event.target.x() - session.anchor.x,
      event.target.y() - session.anchor.y,
      zoom,
      snapping,
    );
    session.delta = delta;
    setGuides(delta.guides);
    for (const item of session.items) {
      const node = stage.current.findOne("#" + item.id);
      node?.position({ x: item.x + delta.dx, y: item.y + delta.dy });
    }
  }
  function finishDrag() {
    const session = drag.current;
    if (!session) return;
    for (const item of session.items)
      stage.current.findOne("#" + item.id)?.position({ x: item.x, y: item.y });
    if (session.delta)
      patchMany(
        session.items.map((e) => ({
          id: e.id,
          patch: { x: e.x + session.delta.dx, y: e.y + session.delta.dy },
        })),
      );
    drag.current = null;
    setGuides([]);
  }
  function finishTransform() {
    const ids = editableIds(doc, selectedIds),
      items = doc.elements.filter((e) => ids.includes(e.id));
    const changes = items.map((e) => {
      const n = stage.current.findOne("#" + e.id),
        sx = n.scaleX(),
        sy = n.scaleY();
      const patch = {
        x: n.x(),
        y: n.y(),
        width: e.width * sx,
        height: e.height * sy,
        rotation: ((n.rotation() % 360) + 360) % 360,
      };
      if (items.length > 1) {
        if (e.type === "text") patch.fontSize = e.fontSize * sx;
        if (e.type === "rect" || e.type === "ellipse") {
          patch.strokeWidth = e.strokeWidth * sx;
          patch.cornerRadius = e.cornerRadius * sx;
        }
      }
      n.setAttrs({
        x: e.x,
        y: e.y,
        width: e.width,
        height: e.height,
        rotation: e.rotation,
        scaleX: 1,
        scaleY: 1,
      });
      return { id: e.id, patch };
    });
    patchMany(changes);
  }
  function startMarquee(event) {
    if (
      preview ||
      !(
        event.target === event.target.getStage() ||
        event.target.name() === "paper"
      )
    )
      return;
    const pos = stage.current.getPointerPosition();
    if (!pos) return;
    marqueeStart.current = {
      x: pos.x / zoom,
      y: pos.y / zoom,
      initial: event.evt.shiftKey || multiSelect ? selectedIds : [],
    };
  }
  function moveMarquee() {
    if (!marqueeStart.current) return;
    const p = stage.current.getPointerPosition(),
      a = marqueeStart.current;
    if (!p) return;
    setMarquee({
      x: Math.min(a.x, p.x / zoom),
      y: Math.min(a.y, p.y / zoom),
      width: Math.abs(a.x - p.x / zoom),
      height: Math.abs(a.y - p.y / zoom),
    });
  }
  function finishMarquee() {
    if (!marqueeStart.current) return;
    const initial = marqueeStart.current.initial;
    if (marquee && marquee.width * zoom > 4 && marquee.height * zoom > 4) {
      selectIds(marqueeSelection(doc, marquee, initial));
    } else selectIds(initial);
    marqueeStart.current = null;
    setMarquee(null);
  }

  const [text, setText] = useState("");
  const editing = doc.elements.find((e) => e.id === editId);
  useEffect(() => {
    const tr = transformer.current;
    if (tr) tr.nodes(!preview ? nodesFor(editableIds(doc, selectedIds)) : []);
  }, [selectedIds, doc.elements, preview]);

  function startEdit(id) {
    const e = doc.elements.find((e) => e.id === id);
    setText(e.text);
    setEditId(id);
  }
  // The toolbar can start editing without double-clicking (including on touch).
  useEffect(() => {
    if (editId) {
      const e = doc.elements.find((e) => e.id === editId);
      if (e) setText(e.text);
    }
  }, [editId]);
  return (
    <div
      className="canvas-paper"
      style={{
        width: doc.canvas.width * zoom,
        height: doc.canvas.height * zoom,
      }}
    >
      <Stage
        ref={stage}
        width={doc.canvas.width * zoom}
        height={doc.canvas.height * zoom}
        scaleX={zoom}
        scaleY={zoom}
        onMouseDown={startMarquee}
        onTouchStart={startMarquee}
        onMouseMove={moveMarquee}
        onTouchMove={moveMarquee}
        onMouseUp={finishMarquee}
        onTouchEnd={finishMarquee}
        onMouseLeave={finishMarquee}
      >
        <Layer>
          <Group
            clipX={0}
            clipY={0}
            clipWidth={doc.canvas.width}
            clipHeight={doc.canvas.height}
          >
            <Rect
              name="paper"
              width={doc.canvas.width}
              height={doc.canvas.height}
              fill={doc.canvas.background}
            />
            {doc.elements
              .filter((e) => !e.hidden)
              .map((e) => (
                <Element
                  key={e.id}
                  element={e}
                  asset={doc.assets[e.assetId]}
                  canDrag={
                    editableIds(doc, [e.id]).includes(e.id) && !multiSelect
                  }
                  onSelect={(event) => {
                    if (!preview)
                      select(e.id, !!event.evt.shiftKey || multiSelect);
                  }}
                  onDragStart={(event) => beginDrag(event, e)}
                  onDragMove={dragMove}
                  onDragEnd={finishDrag}
                  onEdit={startEdit}
                  preview={preview}
                />
              ))}
          </Group>
          {!preview &&
            guides.map((g, i) => (
              <Line
                key={i}
                points={
                  g.axis === "x"
                    ? [g.position, 0, g.position, doc.canvas.height]
                    : [0, g.position, doc.canvas.width, g.position]
                }
                stroke="#fc3fa8"
                strokeWidth={1 / zoom}
                dash={[5 / zoom, 5 / zoom]}
                listening={false}
              />
            ))}
          {!preview &&
            doc.elements
              .filter(
                (e) => e.binding && !e.hidden && selectedIds.includes(e.id),
              )
              .map((e) => (
                <Group
                  key={`binding-${e.id}`}
                  x={e.x}
                  y={e.y - 18 / zoom}
                  listening={false}
                >
                  <Rect
                    width={70 / zoom}
                    height={16 / zoom}
                    fill={e.localOverride ? "#9b5d13" : "#126361"}
                    cornerRadius={3 / zoom}
                  />
                  <Text
                    text={e.localOverride ? "◇ Override" : "↗ Linked"}
                    fill="#ffffff"
                    fontSize={10 / zoom}
                    x={4 / zoom}
                    y={3 / zoom}
                  />
                </Group>
              ))}
          {!preview &&
            selectedIds.length > 1 &&
            doc.elements
              .filter((e) => selectedIds.includes(e.id) && !e.hidden)
              .map((e) => (
                <Rect
                  key={`selection-${e.id}`}
                  x={e.x}
                  y={e.y}
                  width={e.width}
                  height={e.height}
                  rotation={e.rotation}
                  stroke="#8254ea"
                  strokeWidth={1 / zoom}
                  dash={[3 / zoom, 3 / zoom]}
                  listening={false}
                />
              ))}
          {marquee && (
            <Rect
              {...marquee}
              fill="#8254ea22"
              stroke="#8254ea"
              strokeWidth={1 / zoom}
              listening={false}
            />
          )}
          <Transformer
            ref={transformer}
            visible={!preview && !editing}
            flipEnabled={false}
            keepRatio={aspectLocked || movable.length > 1}
            enabledAnchors={
              movable.length > 1
                ? ["top-left", "top-right", "bottom-left", "bottom-right"]
                : undefined
            }
            onTransformEnd={finishTransform}
            anchorSize={12}
            rotateAnchorOffset={30}
            borderStroke="#8254ea"
            anchorStroke="#8254ea"
            boundBoxFunc={(old, next) =>
              next.width < 5 || next.height < 5 ? old : next
            }
          />
        </Layer>
      </Stage>
      {editing && (
        <textarea
          autoFocus
          className="canvas-text-input"
          aria-label="Edit text on canvas"
          value={text}
          maxLength={5000}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            patch(editing.id, { text });
            setEditId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setEditId(null);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          style={{
            left: editing.x * zoom,
            top: editing.y * zoom,
            width: editing.width * zoom,
            height: Math.max(70, editing.height * zoom),
            fontFamily: editing.fontFamily,
            fontSize: editing.fontSize * zoom,
            fontWeight: editing.fontWeight,
            lineHeight: editing.lineHeight,
            textAlign: editing.align,
            color: editing.fill,
            transform: `rotate(${editing.rotation}deg)`,
            transformOrigin: "top left",
          }}
        />
      )}
    </div>
  );
}
