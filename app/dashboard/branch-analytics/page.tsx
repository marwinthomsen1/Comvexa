import { LocalUltraCrudPage } from "../_components/local-ultra-crud-page";

export default function BranchAnalyticsPage() {
  return (
    <LocalUltraCrudPage
      moduleName="Branch Analytics"
      title="Branch Analytics"
      description="Track branch performance snapshots for revenue, expenses, bookings, customers, inventory pressure, and staffing load."
      storageKey="comvexa-ultra-branch-analytics"
      actionLabel="Add branch snapshot"
      variant="analytics"
      fields={[
        { name: "branch", label: "Branch", required: true },
        { name: "period", label: "Period", required: true },
        { name: "revenue", label: "Revenue", type: "number" },
        { name: "expenses", label: "Expenses", type: "number" },
        { name: "bookings", label: "Bookings", type: "number" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "branch", label: "Branch" },
        { key: "period", label: "Period" },
        { key: "revenue", label: "Revenue" },
        { key: "expenses", label: "Expenses" },
        { key: "bookings", label: "Bookings" },
      ]}
    />
  );
}
