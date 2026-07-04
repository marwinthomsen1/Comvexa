import { LocalUltraCrudPage } from "../_components/local-ultra-crud-page";

export default function TimeAttendancePage() {
  return (
    <LocalUltraCrudPage
      moduleName="Time & Attendance"
      title="Time & Attendance"
      description="Record check-ins, absences, late arrivals, time-off requests, and shift coverage notes."
      storageKey="comvexa-ultra-time-attendance"
      actionLabel="Add attendance record"
      fields={[
        { name: "employee", label: "Employee", required: true },
        { name: "recordType", label: "Type", type: "select", options: ["check-in", "absence", "late", "time-off", "overtime"] },
        { name: "date", label: "Date", type: "date", required: true },
        { name: "hours", label: "Hours", type: "number" },
        { name: "manager", label: "Manager" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "employee", label: "Employee" },
        { key: "recordType", label: "Type" },
        { key: "date", label: "Date" },
        { key: "hours", label: "Hours" },
        { key: "manager", label: "Manager" },
      ]}
    />
  );
}
