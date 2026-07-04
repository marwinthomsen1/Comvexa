import { CardWorkspacePage } from "../_components/card-workspace-page";
import { PlanGate } from "../_components/plan-gate";

export default function EmployeesPage() {
  return (
    <PlanGate moduleName="Employees">
      <CardWorkspacePage
        table="employees"
        title="Employees"
        eyebrow="Team roster"
        description="View staff as profile cards with roles, departments, status, and salary context."
        actionLabel="Add employee"
        titleKey="name"
        metaKeys={["employee_code", "department", "position", "email", "phone"]}
        moneyKey="salary"
        statusKey="status"
        fields={[
          { name: "name", label: "Name", required: true },
          { name: "employee_code", label: "Employee ID" },
          { name: "email", label: "Email", type: "email" },
          { name: "phone", label: "Phone", type: "tel" },
          { name: "department", label: "Department" },
          { name: "position", label: "Position" },
          { name: "salary", label: "Salary", type: "number" },
          { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
        ]}
      />
    </PlanGate>
  );
}
