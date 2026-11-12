"use client";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
const Editor = dynamic(() => import("./editor"), {
  ssr: false,
  loading: () => (
    <p className="editor-loading" role="status">
      Opening your creative workspace…
    </p>
  ),
});
export default function EditorLoader() {
  const { id } = useParams();
  return <Editor key={id} />;
}
