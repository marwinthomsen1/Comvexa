"use client";
import dynamic from "next/dynamic";
const PackageBuilder = dynamic(
  () => import("@/features/templates/package-builder"),
  {
    ssr: false,
    loading: () => <p role="status">Opening the package studio…</p>,
  },
);
export default function Packages() {
  return <PackageBuilder />;
}
