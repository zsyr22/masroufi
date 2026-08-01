import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Enter the email connected to Masroufi and we will send you a recovery
          link.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
