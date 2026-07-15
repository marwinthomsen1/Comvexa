import { CardWorkspacePage } from "../_components/card-workspace-page";
import { PlanGate } from "../_components/plan-gate";

export default function PermissionsPage() {
  return (
    <PlanGate moduleName="Permissions">
      <CardWorkspacePage
        table="user_permissions"
        title="User Permissions"
        eyebrow="Access matrix"
        description="Create staff access rules as permission cards by user, role, module, and access level."
        actionLabel="Add permission"
        titleKey="user_email"
        metaKeys={["role", "module"]}
        statusKey="access_level"
        variant="permissions"
        fields={[
          { name: "user_email", label: "User email", type: "email", required: true },
          { name: "role", label: "Role", type: "select", options: ["Staff", "Manager", "Admin"] },
          { name: "module", label: "Module", required: true },
          { name: "access_level", label: "Access level", type: "select", options: ["View", "Create", "Edit", "Full"] },
        ]}
      />
    </PlanGate>
  );
}
