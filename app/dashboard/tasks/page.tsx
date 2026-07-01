import { RecordCrudPage } from "../_components/record-crud-page";
import { PlanGate } from "../_components/plan-gate";

export default function TasksPage() {
  return (
    <PlanGate moduleName="Tasks">
    <RecordCrudPage
      table="tasks"
      title="Tasks"
      description="Create and track operational tasks for the current company workspace."
      actionLabel="Add task"
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "priority", label: "Priority", type: "select", options: ["Normal", "High", "Low"] },
        { name: "status", label: "Status", type: "select", options: ["Pending", "In progress", "Completed"] },
        { name: "due_date", label: "Due date", type: "date" },
        { name: "description", label: "Description", type: "textarea" },
      ]}
      columns={[
        { key: "title", label: "Task" },
        { key: "priority", label: "Priority" },
        { key: "status", label: "Status" },
        { key: "due_date", label: "Due date", format: "date" },
        { key: "created_at", label: "Created", format: "date" },
      ]}
    />
    </PlanGate>
  );
}
