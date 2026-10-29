import { Link } from "@tanstack/react-router";
import AuthHeading from "./components/auth-heading";

type OtpPageProps = {
  email: string;
  intent: "verify" | "reset";
};

export default function OtpPage({ email }: OtpPageProps) {
  const who = email ? ` to ${email}` : "";

  return (
    <div className="flex flex-col gap-8">
      <AuthHeading
        title="Email codes aren't available"
        description={`Dhewa doesn't send a code${who} yet. Sign in with your email and password, or with Google or Twitch.`}
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
