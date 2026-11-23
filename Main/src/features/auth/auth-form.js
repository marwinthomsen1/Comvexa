"use client";
import { useState } from "react";
import Link from "next/link";
import { AUTH_UNAVAILABLE, validateAuth } from "@/lib/auth/foundation";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Icon } from "@/components/ui/icon";

export function AuthForm({ mode, enabled=false }) {

  const [busy,setBusy]=useState(false);
  const register = mode === "register";
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();const form=event.currentTarget;setMessage("");setBusy(true);
    try {
      const values=Object.fromEntries(new FormData(form));validateAuth(mode,values);
      if(!enabled){setMessage(AUTH_UNAVAILABLE);return;}
      const response=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,...values})});const result=await response.json();
      if(!response.ok)throw Error(result.error||'Could not connect. Try again.');
      form.reset();
      if(result.confirmationRequired)setMessage('Check your email to confirm your account, then return here to log in.');
      else{window.location.assign(window.location.origin+'/dashboard');}
    } catch (error) {setMessage(error.message);}finally{setBusy(false);}
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
          <span className="pill">{enabled?"YOUR COMVEXA ACCOUNT":"ACCOUNT PREVIEW"}</span>
          <h1>
            {register ? "A space for your ideas." : "Welcome back, creator."}
          </h1>
          <p className="muted">
            {enabled?(register?"Create an account to save your work automatically.":"Log in to access your automatic account saving."):(register?"Preview registration while cloud setup is completed.":"Preview login while cloud setup is completed.")}
          </p>
          <div className="auth-notice">
            <Icon name="link" />
            <p>
              {enabled?<>Login is handled by Supabase. Your work saves automatically to your account after you sign in.</>:<><strong>Cloud accounts aren’t connected yet.</strong> This form validates locally only. Use test details only.</>}
            </p>
          </div>
          <form onSubmit={submit}>
            {register && (
              <label>
                Your name
                <input
                  name="displayName"
                  autoComplete="name"
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
                autoComplete="email"
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
              {enabled?"Use a unique password. Email confirmation may be required.":"Do not enter a real password in this preview."}
            </p>
            {message && (
              <p role="status" className="form-error">
                {message}
              </p>
            )}
            <button className="button auth-submit" disabled={busy}>
              {busy?"Connecting…":enabled?(register?"Create account":"Log in"):`Check ${register?"registration":"login"} form`}{" "}
              <Icon name="arrow" />
            </button>
          </form>
          <p className="auth-switch">
            {register ? "Already have an account?" : "New to Comvexa?"}{" "}
            <Link href={register ? "/login" : "/register"}>
              {enabled?(register?"Log in":"Create an account"):(register?"Log in preview":"Registration preview")}
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
