"use client";
import dynamic from "next/dynamic";
const Workspace = dynamic(
  () => import("@/features/connected/campaign-workspace"),
  {
    ssr: false,
    loading: () => <p role="status">Opening connected campaign…</p>,
  },
);
export default function ConnectedCampaign() {
  return <Workspace />;
}
