"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import { extractBasePath } from "@/lib/utils/path";

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const { register, isAuthenticated } = useAuth();
  const t = useTranslations("register");
  const ta = useTranslations("account");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  // useEffect is needed here to prevent rendering issues.
  useEffect(() => {
    if (isAuthenticated) {
      router.push(`${basePath}/account`);
    }
  }, [isAuthenticated, router, basePath]);
  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError(t("passwordsDontMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    setLoading(true);

    const result = await register(email, password, passwordConfirmation);
    if (result.success) {
      router.push(`${basePath}/account`);
    } else {
      setError(result.error || t("registrationFailed"));
    }
    setLoading(false);
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              {ta("email")}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:outline-primary-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              {ta("password")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:border-primary-500 focus:outline-primary-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="passwordConfirmation"
              className="block text-sm font-medium text-gray-700"
            >
              {t("confirmPassword")}
            </label>
            <div className="relative">
              <input
                type={showPasswordConfirmation ? "text" : "password"}
                id="passwordConfirmation"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:border-primary-500 focus:outline-primary-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswordConfirmation(!showPasswordConfirmation)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={
                  showPasswordConfirmation ? "Hide password" : "Show password"
                }
              >
                {showPasswordConfirmation ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-2 px-4 rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("creatingAccount") : t("createAccount")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">{t("alreadyHaveAccount")} </span>
          <Link
            href={`${basePath}/account`}
            className="text-primary-500 hover:text-primary-700 font-medium"
          >
            {t("signIn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
