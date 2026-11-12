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
import { loadImage } from "@/lib/editor/images";
import { snapPosition } from "@/lib/editor/document";
function Element({
  element: e,
  asset,
  onSelect,
  onChange,
  onEdit,
  onGuides,
  document: doc,
  preview,
}) {
  const [image, setImage] = useState(null);
  useEffect(() => {
    let active = true;
    if (asset)
      loadImage(asset.src)
        .then((i) => {
          if (active) setImage(i);
        })
        .catch(() => {});
    return () => {
      active = false;
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
    draggable: !preview && !e.locked,
    onClick: onSelect,
    onTap: onSelect,
    onDblClick: () => e.type === "text" && !e.locked && onEdit(e.id),
    onDblTap: () => e.type === "text" && !e.locked && onEdit(e.id),
    onDragMove: (event) => {
      const n = event.target;
      const snapped = snapPosition({ ...e, x: n.x(), y: n.y() }, doc, 8);
      n.position({ x: snapped.x, y: snapped.y });
      onGuides(snapped.guides);
    },
    onDragEnd: (event) => {
      onGuides([]);
      onChange({ x: event.target.x(), y: event.target.y() });
    },
    onTransformEnd: (event) => {
      const n = event.target;
      const width = Math.max(1, Math.min(8192, n.width() * n.scaleX())),
        height = Math.max(1, Math.min(8192, n.height() * n.scaleY()));
      n.scale({ x: 1, y: 1 });
      onChange({
        x: n.x(),
        y: n.y(),
        width,
        height,
        rotation: ((n.rotation() % 360) + 360) % 360,
      });
    },
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
  selected,
  select,
  patch,
  zoom,
  preview,
  editId,
  setEditId,
  aspectLocked,
}) {
  const stage = useRef(null),
    transformer = useRef(null);
  const [guides, setGuides] = useState([]);
  const [text, setText] = useState("");
  const editing = doc.elements.find((e) => e.id === editId);
  useEffect(() => {
    const tr = transformer.current;
    const node = stage.current?.findOne("#" + selected);
    if (tr)
      tr.nodes(
        node && !preview && !doc.elements.find((e) => e.id === selected)?.locked
          ? [node]
          : [],
      );
  }, [selected, doc.elements, preview]);
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
        onMouseDown={(e) => {
          if (e.target === e.target.getStage() || e.target.name() === "paper")
            select(null);
        }}
        onTouchStart={(e) => {
          if (e.target === e.target.getStage() || e.target.name() === "paper")
            select(null);
        }}
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
            {doc.elements.map((e) => (
              <Element
                key={e.id}
                element={e}
                asset={doc.assets[e.assetId]}
                document={doc}
                selected={e.id === selected}
                onSelect={() => !preview && select(e.id)}
                onEdit={startEdit}
                onChange={(p) => patch(e.id, p)}
                onGuides={setGuides}
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
          <Transformer
            ref={transformer}
            visible={!preview && !editing}
            flipEnabled={false}
            keepRatio={aspectLocked}
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
