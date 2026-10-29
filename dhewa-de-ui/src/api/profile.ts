import { api, isApiError } from "@/lib/apiClient";

export type Profile = {
  id: string;
  name: string;
  username: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
};

type ProfileResponse = {
  success: true;
  data: Profile;
  requestId: string;
};

type VerificationResponse = {
  success: true;
  data: {
    sent: boolean;
    alreadyVerified: boolean;
    verificationUrl?: string;
  };
  requestId: string;
};

export function updateProfile(payload: { name: string; username: string }) {
  return api.patch<ProfileResponse>("/v1/users/me", payload);
}

export function sendEmailVerification() {
  return api.post<VerificationResponse>("/v1/users/me/email/verification");
}

export function profileErrorMessage(error: unknown) {
  if (isApiError(error)) {
    const data = error.originalError.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return data?.error?.message || data?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Try again.";
}
