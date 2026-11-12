// Route changes must not race the editor's debounced save.
export async function leaveStudio({ document, savedDocument, save, navigate }) {
  if (JSON.stringify(document) !== savedDocument) {
    const persisted = await save(document);
    if (!persisted) return false;
  }
  navigate();
  return true;
}
