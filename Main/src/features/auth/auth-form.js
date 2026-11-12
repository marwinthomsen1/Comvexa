"use client";
import { useState } from "react";
import Link from "next/link";
import { AUTH_UNAVAILABLE, validateAuth } from "@/lib/auth/foundation";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Icon } from "@/components/ui/icon";
export function AuthForm({ mode }) {
  const register = mode === "register";
  const [message, setMessage] = useState("");
  function submit(event) {
    event.preventDefault();
    try {
      validateAuth(mode, Object.fromEntries(new FormData(event.currentTarget)));
      event.currentTarget.reset();
      setMessage(AUTH_UNAVAILABLE);
    } catch (error) {
      setMessage(error.message);
    }
  }
  return (
    <div className="auth-page">
      <header className="auth-header">
        <Brand />
        <ThemeToggle />
      </header>
      <main id="main-content" className="auth-main">
        <div className="auth-story">
          <span className="eyebrow">YOUR IDEAS HAVE PLACES TO GO</span>
          <p className="auth-headline">
            A little idea.
            <br />
            <em>
              A world of
              <br />
              possibilities.
            </em>
          </p>
          <div className="auth-art" aria-hidden="true">
            ✳
            <span>
              MAKE SOMETHING
              <br />
              THAT FEELS LIKE YOU.
            </span>
          </div>
        </div>
        <div className="auth-panel">
          <span className="pill">ACCOUNT PREVIEW</span>
          <h1>
            {register ? "A space for your ideas." : "Welcome back, creator."}
          </h1>
          <p className="muted">
            {register
              ? "Preview the registration form for your future creative space."
              : "Preview the login form for your future cloud account."}
          </p>
          <div className="auth-notice">
            <Icon name="link" />
            <p>
              <strong>Cloud accounts aren’t connected yet.</strong> This form
              validates locally only. Details are never submitted or stored. Use
              test details only.
            </p>
          </div>
          <form onSubmit={submit}>
            {register && (
              <label>
                Your name
                <input
                  name="displayName"
                  autoComplete="off"
                  placeholder="How should we call you?"
                  maxLength={60}
                  required
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                name="email"
                autoComplete="off"
                maxLength={254}
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete={register ? "new-password" : "current-password"}
                minLength={12}
                maxLength={128}
                placeholder="At least 12 characters"
                required
              />
            </label>
            <p className="fine-print">
              Do not enter a real password in this preview.
            </p>
            {message && (
              <p role="status" className="form-error">
                {message}
              </p>
            )}
            <button className="button auth-submit">
              Check {register ? "registration" : "login"} form{" "}
              <Icon name="arrow" />
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Already have an account?" : "New to Comvexa?"}{" "}
            <Link href={register ? "/login" : "/register"}>
              {register ? "Log in preview" : "Registration preview"}
            </Link>
          </p>
          <Link className="button button-ghost auth-submit" href="/dashboard">
            Explore without an account ↗
          </Link>
          <Link className="text-link auth-back" href="/">
            ← Back to Comvexa
          </Link>
        </div>
      </main>
    </div>
  );
}
