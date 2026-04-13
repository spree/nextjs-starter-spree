import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

/**
 * Skeleton mirroring the register form in `account/register/page.tsx`:
 * Card → Header → Content (space-y-4: first/last name grid, email, password,
 * password confirmation, policy consent, submit) → Footer.
 */
export function RegisterFormSkeleton() {
  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card>
        <CardHeader className="text-center items-center">
          <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
          <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
                <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
                <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
              <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-11 bg-gray-200 rounded-sm animate-pulse" />
            </div>
            {/* Policy consent: checkbox (size-4.5) + wrapped text (text-sm 2 lines = 40px) */}
            <div className="flex items-start gap-2.5">
              <div className="size-4.5 bg-gray-200 rounded-xs mt-0.5 shrink-0 animate-pulse" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
              </div>
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
