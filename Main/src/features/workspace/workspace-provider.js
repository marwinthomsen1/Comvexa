"use client";
import {accountStorage} from "@/lib/cloud/account-scope";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  addDraft,
  readWorkspace,
  writeWorkspace,
} from "@/lib/workspace/local-store";
import { validateProfile } from "@/lib/workspace/validation";
const WorkspaceContext = createContext(null);
export function WorkspaceProvider({ children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    function load() {
      try {
        setData(readWorkspace(accountStorage()));
        setError("");
      } catch {
        setData(null);
        setError(
          "Browser storage is unavailable or contains an unreadable preview. Existing data has been preserved. Allow local storage or use a separate browser profile to try the workspace.",
        );
      }
    }
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);
  const create = useCallback((kind, input) => {
    // Read latest storage before each write to avoid replacing another tab's changes.
    const current = readWorkspace(accountStorage());
    const next = addDraft(
      current,
      kind,
      input,
      crypto.randomUUID(),
      new Date().toISOString(),
    );
    writeWorkspace(accountStorage(), next);
    setData(next);
    return next[kind === "campaign" ? "campaigns" : "projects"][0];
  }, []);
  const saveProfile = useCallback((input) => {
    const current = readWorkspace(accountStorage());
    const next = { ...current, profile: validateProfile(input) };
    writeWorkspace(accountStorage(), next);
    setData(next);
  }, []);
  return (
    <WorkspaceContext.Provider value={{ data, error, create, saveProfile }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
export function useWorkspace() {
  return useContext(WorkspaceContext);
}
