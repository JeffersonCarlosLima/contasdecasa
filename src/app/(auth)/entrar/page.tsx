import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = {
  title: "Entrar — Contas da Casa",
};

interface EntrarPageProps {
  searchParams?: Promise<{ convite?: string }>;
}

export default async function EntrarPage({ searchParams }: EntrarPageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const convite = typeof sp?.convite === "string" ? sp.convite : undefined;

  return <AuthForm mode="entrar" inviteToken={convite} />;
}
