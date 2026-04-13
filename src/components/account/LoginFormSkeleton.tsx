import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

/**
 * Skeleton mirroring the login form in `account/login/page.tsx`:
 * Card (py-6 gap-6) → Header (title text-2xl + description text-sm) →
 * Content (space-y-4: email field, password field, forgot link, submit h-13) →
 * Footer (centered text-sm).
 */
export function LoginFormSkeleton() {
  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card>
        <CardHeader className="text-center items-center">
          <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
              <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="flex justify-end">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
            <div className="h-13 bg-gray-200 rounded-lg w-full animate-pulse" />
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <div className="h-5 bg-gray-200 rounded w-56 animate-pulse" />
        </CardFooter>
      </Card>
    </div>
  );
}
