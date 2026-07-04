import { CardWorkspacePage } from "../_components/card-workspace-page";
import { PlanGate } from "../_components/plan-gate";

export default function StaffSchedulesPage() {
  return (
    <PlanGate moduleName="Staff Schedules">
      <CardWorkspacePage
        table="staff_schedules"
        title="Staff Schedules"
        eyebrow="Shift planner"
        description="Plan staff coverage as schedule cards by date, location, and shift time."
        actionLabel="Add schedule"
        titleKey="employee_name"
        metaKeys={["start_time", "end_time", "location"]}
        dateKey="work_date"
        fields={[
          { name: "employee_name", label: "Employee name", required: true },
          { name: "work_date", label: "Work date", type: "date", required: true },
          { name: "start_time", label: "Start time" },
          { name: "end_time", label: "End time" },
          { name: "location", label: "Location" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </PlanGate>
  );
}
