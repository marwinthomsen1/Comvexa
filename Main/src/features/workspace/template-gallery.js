"use client";
import dynamic from "next/dynamic";
const TemplateLibrary = dynamic(
  () => import("@/features/templates/template-library"),
  {
    ssr: false,
    loading: () => <p role="status">Opening the template library…</p>,
  },
);
export function TemplateGallery() {
  return <TemplateLibrary />;
}
