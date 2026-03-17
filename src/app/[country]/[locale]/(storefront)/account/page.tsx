"use client";

import {
  CircleAlert,
  CreditCard,
  Eye,
  EyeOff,
  MapPin,
  ShoppingBag,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { extractBasePath } from "@/lib/utils/path";

export default function AccountPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = extractBasePath(pathname);
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  // Get redirect URL from query params (e.g., from checkout)
  const redirectUrl = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      // Redirect to the specified URL or stay on account page
      if (redirectUrl) {
        router.push(redirectUrl);
      }
    } else {
      setError(result.error || "Invalid email or password");
    }
    setLoading(false);
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>My Account</CardTitle>
            <CardDescription>
              Sign in to access your account and order history.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="current-password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
                        showPassword ? "Hide password" : "Show password"
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

              <div className="flex justify-end">
                <Link
                  href={`${basePath}/account/forgot-password`}
                  className="text-sm text-primary hover:text-primary/70 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="w-full">
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href={`${basePath}/account/register`}
                className="text-primary hover:text-primary/70 font-medium"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show account dashboard if authenticated
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Account Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href={`${basePath}/account/orders`}>
          <Card className="hover:border-gray-300 transition-colors h-full">
            <CardContent className="flex items-center gap-4 py-0">
              <div className="p-3 bg-gray-100 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Order History
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  View your past orders and track deliveries
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`${basePath}/account/addresses`}>
          <Card className="hover:border-gray-300 transition-colors h-full">
            <CardContent className="flex items-center gap-4 py-0">
              <div className="p-3 bg-gray-100 rounded-xl">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Addresses</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your shipping and billing addresses
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`${basePath}/account/credit-cards`}>
          <Card className="hover:border-gray-300 transition-colors h-full">
            <CardContent className="flex items-center gap-4 py-0">
              <div className="p-3 bg-gray-100 rounded-xl">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Payment Methods
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your saved credit cards
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`${basePath}/account/profile`}>
          <Card className="hover:border-gray-300 transition-colors h-full">
            <CardContent className="flex items-center gap-4 py-0">
              <div className="p-3 bg-gray-100 rounded-xl">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Profile</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update your personal information
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
