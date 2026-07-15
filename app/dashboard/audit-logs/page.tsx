import { LocalUltraCrudPage } from "../_components/local-ultra-crud-page";

export default function AuditLogsPage() {
  return (
    <LocalUltraCrudPage
      moduleName="Audit Logs"
      title="Audit Logs"
      description="Record important workspace events so owners can review changes, exports, permission updates, and sensitive actions."
      storageKey="comvexa-ultra-audit-logs"
      actionLabel="Add audit event"
      variant="audit"
      fields={[
        { name: "event", label: "Event", required: true },
        { name: "area", label: "Area", type: "select", options: ["finance", "records", "settings", "permissions", "exports", "login"] },
        { name: "user", label: "User" },
        { name: "date", label: "Date", type: "date" },
        { name: "risk", label: "Risk", type: "select", options: ["low", "medium", "high"] },
        { name: "details", label: "Details", type: "textarea" },
      ]}
      columns={[
        { key: "event", label: "Event" },
        { key: "area", label: "Area" },
        { key: "user", label: "User" },
        { key: "date", label: "Date" },
        { key: "risk", label: "Risk" },
      ]}
    />
  );
}
