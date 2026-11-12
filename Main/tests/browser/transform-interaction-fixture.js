"use client";
import { useRef, useState, useEffect, Profiler } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  newDesign,
  makeElement,
  validateDocument,
  history,
  commit,
  undo,
  redo,
} from "@/lib/editor/document";
import { groupSelection, selectElement } from "@/lib/editor/selection";
import { designStore } from "@/lib/editor/store";
const Canvas = dynamic(() => import("@/features/editor/design-canvas"), {
  ssr: false,
});
import "@/features/editor/editor.css";
function initial() {
  return groupSelection(
    validateDocument({
      ...newDesign("QA — Transform interaction", 600, 400),
      elements: [
        {
          ...makeElement("rect", "box"),
          x: 120,
          y: 100,
          width: 100,
          height: 100,
          fill: "#7546e8",
          cornerRadius: 8,
        },
        {
          ...makeElement("text", "text"),
          x: 250,
          y: 100,
          width: 220,
          height: 100,
          fontSize: 38,
          text: "Turn ideas\ninto designs.",
        },
      ],
    }),
    ["box", "text"],
    "qa-group",
  );
}
export default function QA() {
  const [state, setState] = useState(() => history(initial())),
    [selected, setSelected] = useState(["box", "text"]),
    [snap, setSnap] = useState(true),
    [id, setId] = useState(""),
    [message, setMessage] = useState("Ready");
  const stats = useRef({ renders: 0, commits: 0, start: 0, base: 0 }),
    status = useRef(null);
  const doc = state.present;
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const resize = () => setZoom(Math.min(1, (window.innerWidth - 80) / 600));
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  function apply(changes) {
    stats.current.commits++;
    setState((s) =>
      commit(
        s,
        validateDocument({
          ...s.present,
          elements: s.present.elements.map((e) => ({
            ...e,
            ...changes.find((p) => p.id === e.id)?.patch,
          })),
        }),
      ),
    );
  }
  function gesture(active) {
    const s = stats.current;
    if (active) {
      s.start = s.renders;
      s.base = s.commits;
      if (status.current)
        status.current.textContent = "Gesture active — document unchanged";
    } else if (status.current)
      status.current.textContent = `Gesture complete: React renders ${s.renders - s.start}; document commits ${s.commits - s.base}`;
  }
  async function save() {
    const key = crypto.randomUUID();
    await designStore.save(key, doc, 0);
    const record = await designStore.load(key);
    setMessage(
      JSON.stringify(record.document) === JSON.stringify(doc)
        ? "PASS: exact save/reopen"
        : "FAIL: reopen mismatch",
    );
    setId(key);
  }
  return (
    <main
      style={{
        padding: 32,
        fontFamily: "Arial",
        background: "#f2f1f7",
        color: "#201830",
        minHeight: "100vh",
      }}
    >
      <h1>Transform interaction verification</h1>
      <p>
        Drag purple square to move the group. Drag the circular handle to
        rotate. Hold Shift for free rotation.
      </p>
      <p ref={status} role="status">
        Ready for gesture
      </p>
      <p>
        History: {state.past.length} · Angle:{" "}
        {doc.elements[0].rotation.toFixed(2)}° · Position:{" "}
        {doc.elements[0].x.toFixed(2)}, {doc.elements[0].y.toFixed(2)} · Size:{" "}
        {doc.elements[0].width.toFixed(2)}
      </p>
      <button onClick={() => setSnap((v) => !v)}>
        Snap {snap ? "on" : "off"}
      </button>{" "}
      <button onClick={() => setState(undo(state))}>Undo</button>{" "}
      <button onClick={() => setState(redo(state))}>Redo</button>{" "}
      <button onClick={save}>Save and verify reopen</button>
      <p>
        {message}{" "}
        {id && <Link href={`/editor/${id}`}>Open saved QA design</Link>}
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "80px 0",
          marginTop: 20,
        }}
      >
        <Profiler
          id="canvas"
          onRender={() => {
            stats.current.renders++;
          }}
        >
          <Canvas
            doc={doc}
            selectedIds={selected}
            select={(id, add) =>
              setSelected((s) => selectElement(doc, s, id, add))
            }
            selectIds={setSelected}
            patch={(id, patch) => apply([{ id, patch }])}
            patchMany={apply}
            zoom={zoom}
            preview={false}
            editId={null}
            setEditId={() => {}}
            multiSelect={false}
            snapping={snap}
            aspectLocked
            onGestureChange={gesture}
          />
        </Profiler>
      </div>
    </main>
  );
}
