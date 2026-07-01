import { RecordCrudPage } from "../_components/record-crud-page";
import { PlanGate } from "../_components/plan-gate";

export default function EmployeesPage() {
  return (
    <PlanGate moduleName="Employees">
    <RecordCrudPage
      table="employees"
      title="Employee Management"
      description="Create and manage employee records, identity details, contact information, roles, salary, and emergency contacts."
      actionLabel="Add employee"
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "employee_code", label: "Employee ID" },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "department", label: "Department" },
        { name: "position", label: "Position" },
        { name: "salary", label: "Salary", type: "number" },
        { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
        { name: "address", label: "Address", advanced: true },
        { name: "id_card_number", label: "ID card number", advanced: true },
        { name: "id_card_expiry", label: "ID card expiry", type: "date", advanced: true },
        { name: "nationality", label: "Nationality", advanced: true },
        { name: "start_date", label: "Start date", type: "date", advanced: true },
        { name: "emergency_contact_name", label: "Emergency contact name", advanced: true },
        { name: "emergency_contact_phone", label: "Emergency contact phone", type: "tel", advanced: true },
        { name: "notes", label: "Notes", type: "textarea", advanced: true },
      ]}
      columns={[
        { key: "employee_code", label: "Employee ID" },
        { key: "name", label: "Employee" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "department", label: "Department" },
        { key: "position", label: "Position" },
        { key: "id_card_number", label: "ID card" },
        { key: "id_card_expiry", label: "ID expiry", format: "date" },
        { key: "salary", label: "Salary", format: "currency" },
        { key: "status", label: "Status" },
      ]}
    />
    </PlanGate>
  );
}
