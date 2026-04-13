import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

/**
 * Skeleton mirroring `account/reset-password/page.tsx` (reset form state):
 * Card → Header (title text-2xl `leading-none` = 24px + description text-sm = 20px)
 * → Content (space-y-4: new password field, confirm password field, submit h-13)
 * → Footer (centered "back to sign in" link text-sm).
 */
export function ResetPasswordFormSkeleton() {
  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card>
        <CardHeader className="text-center items-center">
          <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* New password: label + Input h-11 */}
            <div className="flex flex-col gap-2">
              <div className="h-5 bg-gray-200 rounded w-28 animate-pulse" />
              <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            {/* Confirm password: label + Input h-11 */}
            <div className="flex flex-col gap-2">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            {/* Submit Button size="lg" h-13 rounded-lg */}
            <div className="h-13 bg-gray-200 rounded-lg w-full animate-pulse" />
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
        </CardFooter>
      </Card>
    </div>
  );
}
