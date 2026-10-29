import { Link } from "@tanstack/react-router";
import AuthHeading from "./components/auth-heading";

type ResetPasswordPageProps = {
  email: string;
  step: "email" | "password";
};

export default function ResetPasswordPage({ email }: ResetPasswordPageProps) {
  const who = email ? ` for ${email}` : "";

  return (
    <div className="flex flex-col gap-8">
      <AuthHeading
        title="Password reset isn't available"
        description={`Dhewa doesn't send reset email${who} yet. Sign in with your email and password, or with Google or Twitch.`}
      />
      <Link
        to="/login"
        className="text-foreground text-center underline decoration-from-font underline-offset-2 hover:text-soft"
      >
        Back to sign in
      </Link>
    </div>
  );
}
