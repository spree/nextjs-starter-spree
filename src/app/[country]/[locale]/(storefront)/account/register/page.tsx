"use client";

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { extractBasePath } from "@/lib/utils/path";

export default function RegisterPage() {
  const t = useTranslations("register");
  const ta = useTranslations("account");
  const router = useRouter();
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const { register, isAuthenticated, loading: authLoading } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  // useEffect is needed here to prevent rendering issues.
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push(`${basePath}/account`);
    }
  }, [authLoading, isAuthenticated, router, basePath]);
  if (authLoading || isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError(t("passwordsDontMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    setSubmitting(true);

    try {
      const result = await register({
        email,
        password,
        password_confirmation: passwordConfirmation,
        ...(firstName && { first_name: firstName }),
        ...(lastName && { last_name: lastName }),
      });
      if (result.success) {
        router.push(`${basePath}/account`);
      } else {
        setError(result.error || t("registrationFailed"));
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("createAccount")}
        </h1>
        <p className="mt-2 text-gray-500">{t("signUpDescription")}</p>
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="firstName">First name</FieldLabel>
              <Input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="John"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="lastName">Last name</FieldLabel>
              <Input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Doe"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="email">{ta("email")}</FieldLabel>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">{ta("password")}</FieldLabel>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="pr-10"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? ta("hidePassword") : ta("showPassword")
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="passwordConfirmation">
              {t("confirmPassword")}
            </FieldLabel>
            <div className="relative">
              <Input
                type={showPasswordConfirmation ? "text" : "password"}
                id="passwordConfirmation"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="pr-10"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    setShowPasswordConfirmation(!showPasswordConfirmation)
                  }
                  aria-label={
                    showPasswordConfirmation
                      ? ta("hidePassword")
                      : ta("showPassword")
                  }
                >
                  {showPasswordConfirmation ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </Field>

          <div className="w-full">
            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="w-full"
            >
              {submitting ? t("creatingAccount") : t("createAccount")}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">{t("alreadyHaveAccount")} </span>
          <Link
            href={`${basePath}/account`}
            className="text-primary hover:text-primary/70 font-medium"
          >
            {t("signIn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
