import { PasswordResetEmail } from "../src/lib/emails/password-reset";

export default function Preview() {
  return (
    <PasswordResetEmail resetUrl="http://localhost:3001/us/en/account/reset-password?token=abc123def456" />
  );
}
