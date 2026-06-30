import { SupabaseCrudPage } from "../_components/supabase-crud-page";
import { PlanGate } from "../_components/plan-gate";

export default function EmployeesPage() {
  return (
    <PlanGate moduleName="Employees">
    <SupabaseCrudPage
      table="employees"
      title="Employee Management"
      description="Create and manage employee records, roles, status, salary, and start dates."
      actionLabel="Add employee"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "position", label: "Position" },
        { name: "salary", label: "Salary", type: "number" },
        { name: "start_date", label: "Start date", type: "date" },
        { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "name", label: "Employee" },
        { key: "email", label: "Email" },
        { key: "position", label: "Position" },
        { key: "salary", label: "Salary", format: "currency" },
        { key: "status", label: "Status" },
      ]}
    />
    </PlanGate>
  );
}
