import { CardWorkspacePage } from "../_components/card-workspace-page";
import { PlanGate } from "../_components/plan-gate";

export default function BranchesPage() {
  return (
    <PlanGate moduleName="Branches">
      <CardWorkspacePage
        table="branches"
        title="Branches"
        eyebrow="Location network"
        description="Manage branch locations as location cards with address and contact details."
        actionLabel="Add branch"
        titleKey="name"
        metaKeys={["address", "phone"]}
        variant="network"
        fields={[
          { name: "name", label: "Branch name", required: true },
          { name: "address", label: "Address" },
          { name: "phone", label: "Phone", type: "tel" },
        ]}
      />
    </PlanGate>
  );
}
