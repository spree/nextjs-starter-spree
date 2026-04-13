import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

/**
 * Skeleton mirroring `account/forgot-password/page.tsx` (request form state):
 * Card (py-6 gap-6) → Header (title text-2xl `leading-none` = 24px + description
 * text-sm = 20px) → Content (space-y-4: email field + submit h-13) → Footer
 * (centered text-sm "back to sign in" link).
 */
export function ForgotPasswordFormSkeleton() {
  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card>
        <CardHeader className="text-center items-center">
          <div className="h-6.5 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Email field: label text-sm (h-5) + Input h-11 */}
            <div className="flex flex-col gap-2">
              <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
              <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            {/* Submit Button size="lg" h-13 rounded-lg */}
            <div className="h-13 bg-gray-200 rounded-lg w-full animate-pulse" />
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          {/* "Back to sign in" link text-sm */}
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
        </CardFooter>
      </Card>
    </div>
  );
}
