"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";
import { DEMO_MODE } from "@/lib/demo-mode";
import { register, login, googleLogin, ApiError } from "@/services/api/auth";
import { Button } from "@/components/ui/Button";

function LiveRegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMessage("Passwords do not match.");
      return;
    }
    
    setStatus("submitting");
    setErrorMessage(null);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        role: "DOCTOR"
      });
      // Auto-login after registration
      await login({ email, password });
      setStatus("success");
      router.push("/select-organization");
    } catch (err) {
      setStatus("error");
      if (err instanceof ApiError && err.status === 400) {
        setErrorMessage("This email address is already registered.");
      } else {
        setErrorMessage("An error occurred during registration. Please try again.");
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setStatus("submitting");
    setErrorMessage(null);
    try {
      if (!credentialResponse.credential) throw new Error("No credential");
      await googleLogin(credentialResponse.credential);
      router.push("/select-organization");
    } catch (err) {
      setStatus("error");
      setErrorMessage("Google Sign-Up failed or was rejected by the server.");
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
              setErrorMessage("Google Sign-Up was cancelled or failed.");
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
            <span className="bg-surface px-2 text-mist">Or create with email</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-ink">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Dr. Jane Doe"
            className="hf-focus w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-mist"
          />
        </div>
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
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-ink">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {status === "submitting" ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="text-center text-sm text-mist pt-4 border-t border-line">
        Already have an account? <Link href="/login" className="text-navy hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  if (DEMO_MODE) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
        <p className="text-sm font-medium text-teal">Create account</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Registration is disabled in Demo Mode</h1>
        <p className="mt-4 text-sm text-mist">
          Please use the <Link href="/login" className="text-navy hover:underline">Sign In page</Link> to simulate a session.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-teal">Welcome</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Create your HealthFusion account</h1>
      <p className="mt-2 text-sm text-mist">
        Register to access clinical intelligence models. 
      </p>
      <Suspense fallback={null}>
        <LiveRegisterForm />
      </Suspense>
    </div>
  );
}
