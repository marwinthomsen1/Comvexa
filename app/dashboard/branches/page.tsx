import { PlanGate } from "../_components/plan-gate";
import { SupabaseCrudPage } from "../_components/supabase-crud-page";

export default function BranchesPage() {
  return (
    <PlanGate moduleName="Branches">
      <SupabaseCrudPage
        table="branches"
        title="Branches"
        description="Manage multiple branch locations, addresses, and contact details."
        actionLabel="Add branch"
        fields={[
          { name: "name", label: "Branch name", required: true },
          { name: "address", label: "Address" },
          { name: "phone", label: "Phone", type: "tel" },
        ]}
        columns={[
          { key: "name", label: "Branch" },
          { key: "address", label: "Address" },
          { key: "phone", label: "Phone" },
          { key: "created_at", label: "Created", format: "date" },
        ]}
      />
    </PlanGate>
  );
}
