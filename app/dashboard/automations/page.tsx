import { LocalUltraCrudPage } from "../_components/local-ultra-crud-page";

export default function AutomationsPage() {
  return (
    <LocalUltraCrudPage
      moduleName="Automations"
      title="Automations"
      description="Create automation rules for invoice reminders, recurring tasks, low-stock alerts, booking follow-ups, and operational triggers."
      storageKey="comvexa-ultra-automations"
      actionLabel="Add automation"
      fields={[
        { name: "name", label: "Automation name", required: true },
        { name: "trigger", label: "Trigger", type: "select", options: ["invoice overdue", "task due", "stock low", "booking created", "document expiring"] },
        { name: "action", label: "Action", required: true },
        { name: "owner", label: "Owner" },
        { name: "nextRun", label: "Next run", type: "date" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "name", label: "Automation" },
        { key: "trigger", label: "Trigger" },
        { key: "action", label: "Action" },
        { key: "owner", label: "Owner" },
        { key: "nextRun", label: "Next run" },
      ]}
    />
  );
}
