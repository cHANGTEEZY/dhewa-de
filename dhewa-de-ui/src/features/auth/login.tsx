"use client";

import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import Button from "@/components/_ui/button";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import AuthDivider from "./components/auth-divider";
import AuthField from "./components/auth-field";
import AuthFooterLink from "./components/auth-footer-link";
import AuthHeading from "./components/auth-heading";
import PasswordField from "./components/password-field";
import SocialAuth from "./components/social-auth";
import { isValidEmail, isValidPassword } from "./lib/session";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSocial(provider: "google" | "twitch") {
    if (pending) return;
    setPending(true);
    setFormError("");
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: "/",
    });
    if (error) {
      setFormError(authErrorMessage(error));
      setPending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextEmailError = isValidEmail(email)
      ? ""
      : "Enter a valid email address";
    const nextPasswordError = isValidPassword(password)
      ? ""
      : "Use at least 8 characters";

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError("");

    if (nextEmailError || nextPasswordError) {
      const firstInvalid = nextEmailError ? "login-email" : "login-password";
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setPending(true);
    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password,
      callbackURL: "/",
    });
    if (error) {
      setFormError(authErrorMessage(error));
      setPending(false);
      return;
    }
    await navigate({ to: "/" });
  }

  return (
    <div className="flex flex-col gap-8">
      <AuthHeading
        title="Welcome back"
        description="Sign in to Dhewa."
      />

      <SocialAuth
        pending={pending}
        onGoogle={() => void handleSocial("google")}
        onTwitch={() => void handleSocial("twitch")}
      />

      <AuthDivider />

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <AuthField
          id="login-email"
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          error={emailError}
          disabled={pending}
          onChange={(event) => {
            setEmail(event.target.value);
            if (emailError) setEmailError("");
          }}
        />
        <PasswordField
          id="login-password"
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          error={passwordError}
          disabled={pending}
          onChange={(event) => {
            setPassword(event.target.value);
            if (passwordError) setPasswordError("");
          }}
        />

        {formError ? (
          <p role="alert" className="caption-style text-danger">
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="none"
          className="h-11 w-full text-[14px]"
          disabled={pending}
          aria-busy={pending}
        >
          Continue
        </Button>
      </form>

      <AuthFooterLink
        prompt="Don't have an account?"
        to="/register"
        label="Create one"
      />
    </div>
  );
}
