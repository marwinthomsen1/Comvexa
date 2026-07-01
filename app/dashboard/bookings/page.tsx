import { RecordCrudPage } from "../_components/record-crud-page";
import { PlanGate } from "../_components/plan-gate";

export default function BookingsPage() {
  return (
    <PlanGate moduleName="Bookings">
    <RecordCrudPage
      table="bookings"
      title="Bookings"
      description="Create and track bookings or appointments for the current company."
      actionLabel="Add booking"
      fields={[
        { name: "booking_date", label: "Booking date", type: "date", required: true },
        { name: "start_time", label: "Start time" },
        { name: "end_time", label: "End time" },
        { name: "status", label: "Status", type: "select", options: ["Pending", "Confirmed", "Completed", "Cancelled"] },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "booking_date", label: "Date", format: "date" },
        { key: "start_time", label: "Start" },
        { key: "end_time", label: "End" },
        { key: "status", label: "Status" },
        { key: "notes", label: "Notes" },
      ]}
    />
    </PlanGate>
  );
}
