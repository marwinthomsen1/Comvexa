import { PlanGate } from "../_components/plan-gate";
import { RecordCrudPage } from "../_components/record-crud-page";

export default function StaffSchedulesPage() {
  return (
    <PlanGate moduleName="Staff Schedules">
      <RecordCrudPage
        table="staff_schedules"
        title="Staff Schedules"
        description="Plan staff work dates, times, locations, and schedule notes."
        actionLabel="Add schedule"
        fields={[
          { name: "employee_name", label: "Employee name", required: true },
          { name: "work_date", label: "Work date", type: "date", required: true },
          { name: "start_time", label: "Start time" },
          { name: "end_time", label: "End time" },
          { name: "location", label: "Location" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
        columns={[
          { key: "employee_name", label: "Employee" },
          { key: "work_date", label: "Date", format: "date" },
          { key: "start_time", label: "Start" },
          { key: "end_time", label: "End" },
          { key: "location", label: "Location" },
        ]}
      />
    </PlanGate>
  );
}
