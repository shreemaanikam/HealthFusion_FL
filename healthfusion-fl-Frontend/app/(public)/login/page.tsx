"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";
import { roleLabels } from "@/lib/role-context";
import { DEMO_MODE } from "@/lib/demo-mode";
import { login, googleLogin, ApiError } from "@/services/api/auth";
import type { UserRole } from "@/types/user";
import { Button } from "@/components/ui/Button";

const ROLE_KEY = "healthfusion.simulated-role";

function DemoLoginForm({ next }: { next: string | null }) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("doctor");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.localStorage.setItem(ROLE_KEY, role);
    router.push(next ? `/select-organization?next=${encodeURIComponent(next)}` : "/select-organization");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
          Work email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@hospital.org"
          className="hf-focus w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-mist"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          placeholder="••••••••"
          className="hf-focus w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-mist"
        />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Simulated role</legend>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(roleLabels) as UserRole[]).map((r) => (
            <label
              key={r}
              className={`hf-focus flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm ${
                role === r ? "border-navy bg-paper" : "border-line"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r}
                checked={role === r}
                onChange={() => setRole(r)}
                className="accent-navy"
              />
              {roleLabels[r]}
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit" className="w-full">Continue</Button>
      <p className="text-center text-sm text-mist">
        Don't have an account? <Link href="/register" className="text-navy hover:underline">Create account</Link>
      </p>
    </form>
  );
}

function LiveLoginForm({ next }: { next: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);
    try {
      await login({ email, password });
      router.push(next ? `/select-organization?next=${encodeURIComponent(next)}` : "/select-organization");
    } catch (err) {
      setStatus("error");
      if (err instanceof ApiError && err.status === 401) {
        setErrorMessage("Incorrect email or password.");
      } else {
        setErrorMessage("Couldn't reach HealthFusion_FL. Check your connection and try again.");
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setStatus("submitting");
    setErrorMessage(null);
    try {
      if (!credentialResponse.credential) throw new Error("No credential");
      await googleLogin(credentialResponse.credential);
      router.push(next ? `/select-organization?next=${encodeURIComponent(next)}` : "/select-organization");
    } catch (err) {
      setStatus("error");
      setErrorMessage("Google Sign-In failed or was rejected by the server.");
    }
  };

  return (
    <div className="mt-8 space-y-5">
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setStatus("error");
              setErrorMessage("Google Sign-In was cancelled or failed.");
            }}
            useOneTap
          />
        </div>
      )}
      
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-line" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-mist">Or continue with email</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
            Work email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@hospital.org"
            className="hf-focus w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-mist"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="hf-focus w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-mist"
          />
        </div>
        {status === "error" && errorMessage && (
          <p role="alert" className="rounded border border-red bg-red-soft px-3 py-2 text-sm text-red">
            {errorMessage}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={status === "submitting"}>
          {status === "submitting" ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-mist pt-4 border-t border-line">
        Don't have an account? <Link href="/register" className="text-navy hover:underline">Create account</Link>
      </p>
    </div>
  );
}

function LoginForms() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  return (
    <>
      {next && <p className="mt-1 text-xs text-mist">You'll be returned to {next} after signing in.</p>}
      {DEMO_MODE ? <DemoLoginForm next={next} /> : <LiveLoginForm next={next} />}
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-teal">Welcome back</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Sign in to HealthFusion_FL</h1>
      <p className="mt-2 text-sm text-mist">
        {DEMO_MODE
          ? "Prototype authentication — this is not a production login. Choose a role to simulate."
          : "Securely sign in to the platform."}
      </p>
      <Suspense fallback={null}>
        <LoginForms />
      </Suspense>
    </div>
  );
}
