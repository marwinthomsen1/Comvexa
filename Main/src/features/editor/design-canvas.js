"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { flushSync } from "react-dom";
import {
  createFrameChannel,
  selectionFrame,
  transformAppearance,
  rotationPolicy,
  formatAngle,
  finalTransformPatches,
} from "@/lib/editor/transform-session";
import { loadRenderImage } from "@/lib/editor/images";
import {
  editableIds,
  expandSelection,
  marqueeSelection,
  createSnapSession,
} from "@/lib/editor/selection";
function drawRotationAnchor(ctx, shape) {
  const size = shape.width();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStrokeShape(shape);
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  const c = size / 2,
    r = size * 0.22;
  ctx.beginPath();
  ctx.arc(c, c, r, 0.15 * Math.PI, 1.7 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(c + r * 0.65, c - r * 1.05);
  ctx.lineTo(c + r * 1.25, c - r * 0.95);
  ctx.lineTo(c + r * 0.9, c - r * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function Element({
  element: e,
  asset,
  onSelect,
  onEdit,
  onPointerStart,
  onCursor,
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
  }, [asset?.src]);
  const props = {
    id: e.id,
    x: e.x,
    y: e.y,
    width: e.width,
    height: e.height,
    rotation: e.rotation,
    opacity: e.opacity,
    // Translation has a single pointer-session owner; never start Konva DD
    // alongside Transformer._proxyDrag's multi-node drag controller.
    draggable: false,
    onMouseDown: onPointerStart,
    onTouchStart: onPointerStart,
    onMouseEnter: () => onCursor(!preview && canDrag ? "grab" : "default"),
    onMouseLeave: () => onCursor("default"),
    onClick: onSelect,
    onTap: onSelect,
    onDblClick: () => e.type === "text" && !e.locked && onEdit(e.id),
    onDblTap: () => e.type === "text" && !e.locked && onEdit(e.id),
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
  onGestureChange,
}) {
  const stage = useRef(null),
    transformer = useRef(null),
    guideX = useRef(null),
    guideY = useRef(null),
    marqueeNode = useRef(null),
    hud = useRef(null),
    paper = useRef(null);
  const session = useRef(null),
    intent = useRef(null),
    frame = useRef(null),
    orientation = useRef(null),
    handlers = useRef(null),
    draw = useRef(null),
    skipClick = useRef(false);
  const [touch, setTouch] = useState(false),
    [text, setText] = useState("");
  const editing = doc.elements.find((e) => e.id === editId);
  const movable = editableIds(doc, selectedIds),
    signature = movable.join("|");
  const appearance = transformAppearance(touch);
  const gutter = 72;
  const singleType =
    movable.length === 1
      ? doc.elements.find((e) => e.id === movable[0])?.type
      : null;
  function cursor(value) {
    if (paper.current && !session.current) paper.current.style.cursor = value;
  }
  function point(event, pointerId) {
    const touches = event.touches?.length
      ? event.touches
      : event.changedTouches;
    const p = touches
      ? [...touches].find((t) => t.identifier === pointerId)
      : event;
    if (!p) return null;
    const box = stage.current.container().getBoundingClientRect();
    return {
      x: (p.clientX - box.left - gutter) / zoom,
      y: (p.clientY - box.top - gutter) / zoom,
    };
  }
  function nodesFor(ids) {
    return ids.map((id) => stage.current?.findOne("#" + id)).filter(Boolean);
  }
  function hideFeedback() {
    guideX.current?.hide();
    guideY.current?.hide();
    marqueeNode.current?.hide();
    if (hud.current) hud.current.hidden = true;
  }
  function showHud(value) {
    if (hud.current) {
      hud.current.textContent = value;
      hud.current.hidden = false;
    }
  }
  draw.current = (value) => {
    if (value.kind === "move") {
      const s = session.current;
      if (!s || s.kind !== "move") return;
      for (const item of s.items)
        s.nodes
          .get(item.id)
          ?.position({ x: item.x + value.dx, y: item.y + value.dy });
      for (const [axis, node] of [
        ["x", guideX.current],
        ["y", guideY.current],
      ]) {
        const g = value.guides.find((g) => g.axis === axis);
        node?.setAttrs({
          visible: !!g,
          points: g
            ? axis === "x"
              ? [g.position, 0, g.position, doc.canvas.height]
              : [0, g.position, doc.canvas.width, g.position]
            : [],
        });
      }
      showHud(`${Math.round(value.dx)} , ${Math.round(value.dy)} px`);
    } else if (value.kind === "marquee")
      marqueeNode.current?.setAttrs({ ...value.box, visible: true });
    else if (session.current) {
      const tr = transformer.current;
      showHud(
        value.kind === "rotate"
          ? `${formatAngle(tr.rotation())} · ${session.current.snapActive ? "15° snap" : "Free rotation"}`
          : `${Math.round(tr.width() / zoom)} × ${Math.round(tr.height() / zoom)} px`,
      );
    }
  };
  if (!frame.current)
    frame.current = createFrameChannel(
      (value) => draw.current(value),
      (cb) => requestAnimationFrame(cb),
      (id) => cancelAnimationFrame(id),
    );
  function begin(kind, items) {
    if (session.current) return null;
    const s = {
      selectionSignature: signature,
      kind,
      doc,
      items,
      nodes: new Map(nodesFor(items.map((e) => e.id)).map((n) => [n.id(), n])),
    };
    session.current = s;
    onGestureChange?.(true);
    if (paper.current)
      paper.current.style.cursor =
        kind === "move"
          ? "grabbing"
          : kind === "rotate"
            ? "grabbing"
            : "default";
    return s;
  }
  function restore(s) {
    for (const e of s.items)
      s.nodes.get(e.id)?.setAttrs({
        x: e.x,
        y: e.y,
        width: e.width,
        height: e.height,
        rotation: e.rotation,
        scaleX: 1,
        scaleY: 1,
      });
  }
  function finish(s, changes) {
    frame.current.cancel();
    session.current = null;
    intent.current = null;
    hideFeedback();
    // Restore and reconcile synchronously in one paint, never expose a reset frame.
    restore(s);
    try {
      let accepted = false;
      if (changes.length)
        flushSync(() => {
          accepted = patchMany(changes) !== false;
        });
      if (!accepted) {
        if (s.items.length > 1)
          transformer.current?.rotation(orientation.current?.rotation || 0);
        transformer.current?.forceUpdate();
      }
    } finally {
      onGestureChange?.(false);
      if (paper.current) paper.current.style.cursor = "grab";
    }
  }
  function cancel() {
    const s = session.current;
    session.current = null;
    intent.current = null;
    frame.current.cancel();
    if (s) {
      transformer.current?.stopTransform();
      restore(s);
      if (s.items.length > 1)
        transformer.current?.rotation(orientation.current?.rotation || 0);
      transformer.current?.forceUpdate();
      onGestureChange?.(false);
    }
    hideFeedback();
    if (paper.current) paper.current.style.cursor = "default";
  }
  function beginPointer(event, e) {
    if (
      preview ||
      editing ||
      event.evt.button > 0 ||
      multiSelect ||
      event.evt.shiftKey ||
      event.evt.touches?.length > 1
    )
      return;
    const ids = selectedIds.includes(e.id)
        ? selectedIds
        : expandSelection(doc, [e.id]),
      allowed = editableIds(doc, ids);
    if (!allowed.includes(e.id)) return;
    const pointerId = event.evt.touches?.[0]?.identifier,
      start = point(event.evt, pointerId);
    if (!start) return;
    if (!selectedIds.includes(e.id)) selectIds(ids);
    intent.current = {
      kind: "move",
      pointerId,
      start,
      doc,
      items: doc.elements.filter((n) => allowed.includes(n.id)),
      snap: createSnapSession(doc, allowed, zoom, true),
      touch: !!event.evt.touches,
    };
  }
  function startMarquee(event) {
    if (
      preview ||
      editing ||
      !(
        event.target === event.target.getStage() ||
        event.target.name() === "paper"
      ) ||
      event.evt.button > 0 ||
      event.evt.touches?.length > 1
    )
      return;
    const pointerId = event.evt.touches?.[0]?.identifier,
      start = point(event.evt, pointerId);
    if (!start) return;
    intent.current = {
      kind: "marquee",
      pointerId,
      start,
      doc,
      initial: event.evt.shiftKey || multiSelect ? selectedIds : [],
      touch: !!event.evt.touches,
    };
  }
  function pointerMove(event) {
    const i = intent.current;
    if (!i) return;
    if (event.touches?.length > 1) {
      cancel();
      return;
    }
    if (i.doc !== doc) {
      cancel();
      return;
    }
    const p = point(event, i.pointerId);
    if (!p) return;
    const dx = p.x - i.start.x,
      dy = p.y - i.start.y;
    if (!session.current && Math.hypot(dx, dy) * zoom < (i.touch ? 8 : 3))
      return;
    if (event.cancelable) event.preventDefault();
    if (i.kind === "move") {
      const s = session.current || begin("move", i.items);
      if (!s) return;
      i.delta =
        snapping !== !!event.shiftKey ? i.snap(dx, dy) : { dx, dy, guides: [] };
      frame.current.push({ kind: "move", ...i.delta });
    } else {
      if (!session.current) begin("marquee", []);
      i.box = {
        x: Math.min(i.start.x, p.x),
        y: Math.min(i.start.y, p.y),
        width: Math.abs(dx),
        height: Math.abs(dy),
      };
      frame.current.push({ kind: "marquee", box: i.box });
    }
  }
  function pointerEnd(event) {
    const i = intent.current;
    if (!i) return;
    if (
      event.changedTouches &&
      ![...event.changedTouches].some((t) => t.identifier === i.pointerId)
    )
      return;
    const s = session.current;
    if (s) {
      if (i.doc !== doc) {
        cancel();
        return;
      }
      pointerMove(event);
      if (!session.current) return;
      frame.current.flush();
      skipClick.current = true;
      setTimeout(() => {
        skipClick.current = false;
      }, 0);
      if (i.kind === "move")
        finish(
          s,
          i.delta && Math.hypot(i.delta.dx, i.delta.dy) > 1e-6
            ? i.items.map((e) => ({
                id: e.id,
                patch: { x: e.x + i.delta.dx, y: e.y + i.delta.dy },
              }))
            : [],
        );
      else {
        session.current = null;
        intent.current = null;
        hideFeedback();
        onGestureChange?.(false);
        selectIds(marqueeSelection(doc, i.box, i.initial));
      }
    } else {
      intent.current = null;
      if (i.kind === "marquee") selectIds(i.initial);
    }
  }
  function configureTransform(event) {
    const tr = transformer.current;
    if (!tr) return;
    const policy = rotationPolicy(snapping, !!event?.shiftKey);
    tr.rotationSnaps(policy.stops);
    tr.rotationSnapTolerance(policy.tolerance);
    const uniform = movable.length > 1 || singleType === "text";
    tr.keepRatio(
      uniform || (!event?.altKey && (aspectLocked || singleType === "image")),
    );
    if (session.current) session.current.snapActive = policy.stops.length > 0;
  }
  function beginTransform(event) {
    configureTransform(event.evt);
    begin(
      transformer.current.getActiveAnchor() === "rotater" ? "rotate" : "resize",
      doc.elements.filter((e) => movable.includes(e.id)),
    );
    configureTransform(event.evt);
  }
  function updateTransform() {
    if (session.current) frame.current.push({ kind: session.current.kind });
  }
  function finishTransform() {
    const s = session.current;
    if (!s || !["rotate", "resize"].includes(s.kind)) return;
    const samples = [...s.nodes.values()].map((n) => ({
      id: n.id(),
      x: n.x(),
      y: n.y(),
      rotation: n.rotation(),
      scaleX: n.scaleX(),
      scaleY: n.scaleY(),
    }));
    finish(s, finalTransformPatches(s.items, samples));
  }
  handlers.current = { pointerMove, pointerEnd, cancel, configureTransform };
  useEffect(() => {
    const move = (e) => handlers.current.pointerMove(e),
      end = (e) => handlers.current.pointerEnd(e),
      stop = () => handlers.current.cancel();
    const key = (e) => {
      if (e.key === "Escape" && (session.current || intent.current)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        stop();
      } else handlers.current.configureTransform(e);
    };
    const visibility = () => {
      if (document.hidden) stop();
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end, true);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end, true);
    window.addEventListener("touchcancel", stop);
    window.addEventListener("blur", stop);
    window.addEventListener("keydown", key, true);
    window.addEventListener("keyup", key, true);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      frame.current.cancel();
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end, true);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end, true);
      window.removeEventListener("touchcancel", stop);
      window.removeEventListener("blur", stop);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("keyup", key, true);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse), (max-width: 900px)");
    const update = () => setTouch(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useLayoutEffect(() => {
    if (
      session.current &&
      (session.current.doc !== doc ||
        session.current.selectionSignature !== signature)
    )
      cancel();
    const tr = transformer.current;
    if (!tr) return;
    const items = doc.elements.filter((e) => movable.includes(e.id));
    const next = selectionFrame(orientation.current, items, signature);
    const nodes = preview ? [] : nodesFor(movable);
    if (
      tr
        .nodes()
        .map((n) => n.id())
        .join("|") !== nodes.map((n) => n.id()).join("|")
    )
      tr.nodes(nodes);
    if (items.length > 1) tr.rotation(next.rotation);
    orientation.current = next;
    tr.forceUpdate();
  }, [doc, signature, preview, zoom]);
  useEffect(() => {
    if (preview || editId) cancel();
  }, [preview, editId]);
  function startEdit(id) {
    const e = doc.elements.find((e) => e.id === id);
    if (session.current || e.locked) return;
    setText(e.text);
    setEditId(id);
  }
  useEffect(() => {
    if (editId) {
      const e = doc.elements.find((e) => e.id === editId);
      if (e) setText(e.text);
    }
  }, [editId]);
  function styleAnchor(anchor) {
    const rotating = anchor.hasName("rotater"),
      size = rotating ? appearance.rotation : appearance.anchor;
    anchor.setAttrs({
      width: size,
      height: size,
      offsetX: size / 2,
      offsetY: size / 2,
      cornerRadius: rotating ? size / 2 : 2.5,
      fill: rotating ? "#7546e8" : "#ffffff",
      stroke: rotating ? "#ffffff" : "#7546e8",
      strokeWidth: rotating ? 2 : 1.4,
      hitStrokeWidth: appearance.hit,
      shadowColor: "#251350",
      shadowOpacity: 0.17,
      shadowBlur: rotating ? 8 : 3,
      shadowOffsetY: 1,
    });
    if (rotating) anchor.sceneFunc(drawRotationAnchor);
  }
  const cornersOnly = movable.length > 1 || singleType === "text";
  return (
    <div
      ref={paper}
      className="canvas-paper"
      style={{
        width: doc.canvas.width * zoom,
        height: doc.canvas.height * zoom,
      }}
    >
      <Stage
        ref={stage}
        width={doc.canvas.width * zoom + gutter * 2}
        height={doc.canvas.height * zoom + gutter * 2}
        style={{ position: "absolute", left: -gutter, top: -gutter }}
        scaleX={zoom}
        scaleY={zoom}
        onMouseDown={startMarquee}
        onTouchStart={startMarquee}
      >
        <Layer x={gutter / zoom} y={gutter / zoom}>
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
                  onPointerStart={(event) => beginPointer(event, e)}
                  onCursor={cursor}
                  onSelect={(event) => {
                    if (skipClick.current) {
                      skipClick.current = false;
                      return;
                    }
                    if (!preview)
                      select(e.id, !!event.evt.shiftKey || multiSelect);
                  }}
                  onEdit={startEdit}
                  preview={preview}
                />
              ))}
          </Group>
        </Layer>
        <Layer>
          <Transformer
            ref={transformer}
            visible={!preview && !editing}
            flipEnabled={false}
            shiftBehavior="none"
            ignoreStroke
            padding={appearance.padding}
            borderStroke="#8054e8"
            borderStrokeWidth={appearance.border}
            anchorStyleFunc={styleAnchor}
            anchorSize={appearance.anchor}
            rotateAnchorOffset={appearance.offset}
            rotateAnchorCursor="grab"
            rotateLineVisible
            rotationSnapTolerance={3}
            enabledAnchors={
              cornersOnly
                ? ["top-left", "top-right", "bottom-left", "bottom-right"]
                : undefined
            }
            anchorDragBoundFunc={(old, next, event) => {
              configureTransform(event);
              return next;
            }}
            onTransformStart={beginTransform}
            onTransform={updateTransform}
            onTransformEnd={finishTransform}
            boundBoxFunc={(old, next) =>
              next.width < 12 || next.height < 12 ? old : next
            }
          />
        </Layer>
        <Layer listening={false} x={gutter / zoom} y={gutter / zoom}>
          <Line
            ref={guideX}
            visible={false}
            stroke="#d44fc2"
            strokeWidth={1 / zoom}
          />
          <Line
            ref={guideY}
            visible={false}
            stroke="#d44fc2"
            strokeWidth={1 / zoom}
          />
          <Rect
            ref={marqueeNode}
            visible={false}
            fill="#8254ea12"
            stroke="#8254ea"
            strokeWidth={1 / zoom}
            cornerRadius={3 / zoom}
          />
        </Layer>
      </Stage>
      <div ref={hud} className="transform-hud" hidden aria-hidden="true" />
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
