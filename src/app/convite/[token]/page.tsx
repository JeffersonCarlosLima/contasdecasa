import type { Metadata } from "next";
import { headers } from "next/headers";
import AuthLayout from "@/app/(auth)/layout";
import { auth } from "@/lib/auth";
import { findInviteByToken } from "@/lib/family-queries";
import { InviteContent } from "./_components/InviteContent";

interface ConvitePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: ConvitePageProps): Promise<Metadata> {
  const { token } = await params;
  const inviteData = await findInviteByToken(token);

  if (!inviteData) {
    return {
      title: "Convite indisponível — Contas da Casa",
    };
  }

  return {
    title: `Convite para ${inviteData.familyName} — Contas da Casa`,
  };
}

export default async function ConvitePage({ params }: ConvitePageProps) {
  const { token } = await params;

  const [rawInvite, session] = await Promise.all([
    findInviteByToken(token),
    auth.api.getSession({
      headers: await headers(),
    }),
  ]);

  const inviteData = rawInvite
    ? {
        familyName: rawInvite.familyName,
        invitedByName: rawInvite.invitedByName,
        email: rawInvite.invite.email,
      }
    : null;

  return (
    <AuthLayout>
      <InviteContent
        token={token}
        inviteData={inviteData}
        sessionEmail={session?.user?.email ?? null}
      />
    </AuthLayout>
  );
}
