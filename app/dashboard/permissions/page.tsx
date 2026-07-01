import { PlanGate } from "../_components/plan-gate";
import { RecordCrudPage } from "../_components/record-crud-page";

export default function PermissionsPage() {
  return (
    <PlanGate moduleName="Permissions">
      <RecordCrudPage
        table="user_permissions"
        title="User Permissions"
        description="Prepare module-level access rules for staff and managers."
        actionLabel="Add permission"
        fields={[
          { name: "user_email", label: "User email", type: "email", required: true },
          { name: "role", label: "Role", type: "select", options: ["Staff", "Manager", "Admin"] },
          { name: "module", label: "Module", required: true },
          { name: "access_level", label: "Access level", type: "select", options: ["View", "Create", "Edit", "Full"] },
        ]}
        columns={[
          { key: "user_email", label: "User" },
          { key: "role", label: "Role" },
          { key: "module", label: "Module" },
          { key: "access_level", label: "Access" },
          { key: "created_at", label: "Created", format: "date" },
        ]}
      />
    </PlanGate>
  );
}
