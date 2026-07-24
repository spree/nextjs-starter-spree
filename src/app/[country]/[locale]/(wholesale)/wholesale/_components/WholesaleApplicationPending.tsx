"use client";

import { ArrowLeft, Clock, LogOut, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

interface WholesaleApplicationPendingProps {
  basePath: string;
  customerName: string;
  email: string;
}

/**
 * Shown to a signed-in customer who is not (yet) in the Wholesale group. The
 * demo "approval" is an admin adding them to the group; until then they see
 * what's on file and what happens next.
 */
export function WholesaleApplicationPending({
  basePath,
  customerName,
  email,
}: WholesaleApplicationPendingProps) {
  const t = useTranslations("wholesale");
  const { logout } = useAuth();

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Clock className="h-6 w-6 text-slate-700" />
          </div>
          <CardTitle>{t("pending.title")}</CardTitle>
          <CardDescription>{t("pending.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">{t("pending.nameLabel")}</dt>
              <dd className="font-medium text-slate-900">{customerName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">{t("pending.emailLabel")}</dt>
              <dd className="font-medium text-slate-900">{email}</dd>
            </div>
          </dl>

          <div className="space-y-2 text-sm text-slate-600">
            <p>{t("pending.whatNext")}</p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              {t("pending.support")}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="flex-1">
              <Link href={basePath}>
                <ArrowLeft className="h-4 w-4" />
                {t("nav.backToStore")}
              </Link>
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => logout()}>
              <LogOut className="h-4 w-4" />
              {t("nav.signOut")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
