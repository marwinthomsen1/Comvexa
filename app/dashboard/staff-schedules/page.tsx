import { CardWorkspacePage } from "../_components/card-workspace-page";
import { PlanGate } from "../_components/plan-gate";

export default function StaffSchedulesPage() {
  return (
    <PlanGate moduleName="Staff Schedules">
      <CardWorkspacePage
        table="staff_schedules"
        title="Staff Schedules"
        eyebrow="Shift planner"
        description="Plan weekly coverage, compare shifts by day, and spot staffing gaps quickly."
        actionLabel="New shift"
        titleKey="employee_name"
        metaKeys={["start_time", "end_time", "location"]}
        dateKey="work_date"
        variant="schedule"
        fields={[
          { name: "employee_name", label: "Employee name", required: true },
          { name: "work_date", label: "Work date", type: "date", required: true },
          { name: "start_time", label: "Start time", type: "time" },
          { name: "end_time", label: "End time", type: "time" },
          { name: "location", label: "Location" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </PlanGate>
  );
}
