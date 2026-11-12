"use client";
import { useState } from "react";
import Link from "next/link";
import { useWorkspace } from "./workspace-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
export function Settings() {
  const { data, error, saveProfile } = useWorkspace();
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  if (error)
    return (
      <p role="alert" className="form-error">
        {error}
      </p>
    );
  if (!data) return <p role="status">Loading preferences…</p>;
  function submit(event) {
    event.preventDefault();
    try {
      saveProfile(Object.fromEntries(new FormData(event.currentTarget)));
      setMessage("Profile saved on this browser.");
      setFailed(false);
    } catch (reason) {
      setMessage(reason.message);
      setFailed(true);
    }
  }
  return (
    <>
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>Profile & settings.</h1>
          <p>A few details to make this creative space feel like yours.</p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="detail-panel">
          <h2>Local profile</h2>
          <p className="muted">
            These preferences stay in your browser. They are not an account.
          </p>
          <form onSubmit={submit}>
            <label>
              Display name
              <input
                name="displayName"
                defaultValue={data.profile.displayName}
                maxLength={60}
                required
              />
            </label>
            <label>
              About you <span className="optional">optional</span>
              <textarea
                name="bio"
                defaultValue={data.profile.bio}
                maxLength={240}
                rows={3}
              />
            </label>
            {message && (
              <p
                className={failed ? "form-error" : "form-success"}
                role="status"
              >
                {message}
              </p>
            )}
            <button className="button">Save local profile</button>
          </form>
        </section>
        <div>
          <section className="detail-panel">
            <h2>Appearance</h2>
            <p className="muted">
              Light or dark. Your choice is remembered on this browser.
            </p>
            <ThemeToggle />
          </section>
          <section className="detail-panel">
            <h2>Cloud account</h2>
            <p className="muted">
              Secure cloud accounts will be available after a separate
              development service is configured.
            </p>
            <Link className="text-link" href="/register">
              View account setup preview ↗
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
