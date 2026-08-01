import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Choose a new password
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Create a secure password for your Masroufi account.
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
