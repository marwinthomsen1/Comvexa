import { PlanGate } from "../_components/plan-gate";
import { PdfDocumentsPage } from "./pdf-documents-page";

export default function DocumentsPage() {
  return (
    <PlanGate moduleName="Documents">
      <PdfDocumentsPage />
    </PlanGate>
  );
}
