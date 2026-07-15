import { LocalUltraCrudPage } from "../_components/local-ultra-crud-page";

export default function DataImportPage() {
  return (
    <LocalUltraCrudPage
      moduleName="Data Import"
      title="Data Import"
      description="Plan imports for customers, employees, inventory, invoices, payments, expenses, and older spreadsheet data."
      storageKey="comvexa-ultra-data-import"
      actionLabel="Add import job"
      variant="data-import"
      fields={[
        { name: "source", label: "Source", required: true },
        { name: "recordType", label: "Record type", type: "select", options: ["customers", "employees", "inventory", "invoices", "payments", "expenses"] },
        { name: "rows", label: "Rows", type: "number" },
        { name: "owner", label: "Owner" },
        { name: "targetDate", label: "Target date", type: "date" },
        { name: "notes", label: "Mapping notes", type: "textarea" },
      ]}
      columns={[
        { key: "source", label: "Source" },
        { key: "recordType", label: "Type" },
        { key: "rows", label: "Rows" },
        { key: "owner", label: "Owner" },
        { key: "targetDate", label: "Target" },
      ]}
    />
  );
}
