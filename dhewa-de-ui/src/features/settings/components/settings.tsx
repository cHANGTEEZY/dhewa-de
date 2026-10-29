"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ConfirmMorph } from "@/components/arc/confirm-morph/confirm-morph";
import { HoldToConfirm } from "@/components/arc/hold-to-confirm/hold-to-confirm";
import AppearanceSwitch from "@/components/_common/appearance-switch";
import Avatar from "@/components/_ui/avatar";
import Button from "@/components/_ui/button";
import { Checkbox } from "@/components/_ui/checkbox";
import Field from "@/components/_ui/field";
import { Input } from "@/components/_ui/input";
import { Label } from "@/components/_ui/label";
import {
  profileErrorMessage,
  sendEmailVerification,
  updateProfile,
} from "@/api/profile";
import { useUiStore } from "@/features/app/stores/ui-store";
import { authClient } from "@/lib/auth-client";
import { CURRENT_USER } from "@/features/home/data/companies";
import SettingsHeader from "./header";

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export default function Settings() {
  const navigate = useNavigate();
  const showToast = useUiStore((state) => state.showToast);
  const { data: session, isPending, refetch } = authClient.useSession();
  const user = session?.user;
  const sessionName = user?.name ?? "";
  const sessionUsername = user?.username ?? "";
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [nameError, setNameError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [formError, setFormError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [digest, setDigest] = useState(true);
  const [dealAlerts, setDealAlerts] = useState(true);

  useEffect(() => {
    if (!user) return;
    setName(sessionName);
    setUsername(sessionUsername);
  }, [user, sessionName, sessionUsername]);

  async function logout() {
    await authClient.signOut();
    void navigate({ to: "/login" });
  }

  async function saveProfile() {
    const nextName = name.trim();
    const nextUsername = username.trim().toLowerCase();
    const nextNameError = nextName ? "" : "Enter your name";
    const nextUsernameError = USERNAME_PATTERN.test(nextUsername)
      ? ""
      : "Use 3–30 letters, numbers, or underscores";

    setNameError(nextNameError);
    setUsernameError(nextUsernameError);
    setFormError("");

    if (nextNameError || nextUsernameError) {
      throw new Error(nextNameError || nextUsernameError);
    }

    try {
      await updateProfile({ name: nextName, username: nextUsername });
      await refetch();
      showToast({
        title: "Profile saved",
        description: "Your name and username are up to date.",
      });
    } catch (error) {
      const message = profileErrorMessage(error);
      setFormError(message);
      throw error;
    }
  }

  async function verifyEmail() {
    setVerifying(true);
    setVerifyError("");
    setVerificationUrl("");
    try {
      const result = await sendEmailVerification();
      await refetch();
      if (result.data.alreadyVerified) {
        showToast({
          title: "Email verified",
          description: "This address is already verified.",
        });
        return;
      }
      if (result.data.verificationUrl) {
        setVerificationUrl(result.data.verificationUrl);
      }
      showToast({
        title: "Verification link ready",
        description: result.data.verificationUrl
          ? "Open the link to verify this email."
          : "Check your inbox for the verification link.",
      });
    } catch (error) {
      setVerifyError(profileErrorMessage(error));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <section id="settings" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SettingsHeader />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[36em] flex-col gap-10 px-6 py-8">
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h2>Profile</h2>
              <p className="text-subtle">
                How you appear across the workspace.
              </p>
            </div>
            {isPending || !user ? (
              <p className="text-subtle">Loading your profile.</p>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user.image || CURRENT_USER.avatar}
                    alt=""
                    className="size-12 outline-line-strong"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="caption-style text-subtle mt-1.5 truncate">
                      {user.username ? `@${user.username}` : user.email}
                    </p>
                  </div>
                </div>
                <form
                  className="flex flex-col gap-5"
                  onSubmit={(event) => event.preventDefault()}
                >
                  <Field
                    label="Name"
                    htmlFor="settings-name"
                    error={nameError}
                  >
                    <Input
                      id="settings-name"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        if (nameError) setNameError("");
                      }}
                      autoComplete="name"
                    />
                  </Field>
                  <Field
                    label="Username"
                    htmlFor="settings-username"
                    error={usernameError}
                    hint="Letters, numbers, and underscores."
                  >
                    <Input
                      id="settings-username"
                      value={username}
                      onChange={(event) => {
                        setUsername(event.target.value);
                        if (usernameError) setUsernameError("");
                      }}
                      autoComplete="username"
                      spellCheck={false}
                    />
                  </Field>
                  <Field
                    label="Email"
                    htmlFor="settings-email"
                    hint={user.emailVerified ? "Verified" : "Unverified"}
                  >
                    <Input
                      id="settings-email"
                      type="email"
                      value={user.email}
                      readOnly
                      autoComplete="email"
                      className="text-subtle"
                    />
                  </Field>
                  {user.emailVerified ? null : (
                    <div className="flex flex-col items-start gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        disabled={verifying}
                        onClick={() => void verifyEmail()}
                      >
                        {verifying ? "Sending link" : "Verify email"}
                      </Button>
                      {verificationUrl ? (
                        <a
                          href={verificationUrl}
                          className="text-foreground text-[14px] underline decoration-from-font underline-offset-2 hover:text-soft"
                        >
                          Open verification link
                        </a>
                      ) : null}
                      {verifyError ? (
                        <p role="alert" className="caption-style text-danger">
                          {verifyError}
                        </p>
                      ) : null}
                    </div>
                  )}
                  {formError ? (
                    <p role="alert" className="caption-style text-danger">
                      {formError}
                    </p>
                  ) : null}
                  <div>
                    <ConfirmMorph
                      label="Save changes"
                      prompt="Save profile updates?"
                      confirmLabel="Save"
                      cancelLabel="Cancel"
                      pendingLabel="Saving"
                      doneLabel="Saved"
                      tone="neutral"
                      onConfirm={saveProfile}
                    />
                  </div>
                </form>
              </>
            )}
          </section>

          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h2>Appearance</h2>
              <p className="text-subtle">
                Switch between dark and light for this browser.
              </p>
            </div>
            <div>
              <AppearanceSwitch variant="reveal" />
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h2>Notifications</h2>
              <p className="text-subtle">
                Choose which updates reach you by email.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Label
                htmlFor="settings-digest"
                className="flex cursor-pointer items-center gap-2.5 text-[14px] text-foreground"
              >
                <Checkbox
                  id="settings-digest"
                  checked={digest}
                  onCheckedChange={(value) => setDigest(value === true)}
                />
                Weekly pipeline digest
              </Label>
              <Label
                htmlFor="settings-deals"
                className="flex cursor-pointer items-center gap-2.5 text-[14px] text-foreground"
              >
                <Checkbox
                  id="settings-deals"
                  checked={dealAlerts}
                  onCheckedChange={(value) => setDealAlerts(value === true)}
                />
                Deal stage alerts
              </Label>
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h2>Session</h2>
              <p className="text-subtle">
                Sign out of this browser. You can sign back in at any time.
              </p>
            </div>
            <div>
              <HoldToConfirm
                label="Hold to log out"
                confirmedLabel="Signed out"
                tone="danger"
                onConfirm={logout}
              />
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
