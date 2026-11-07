import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = {
  title: "Criar conta — Contas da Casa",
};

interface CadastroPageProps {
  searchParams?: Promise<{ convite?: string }>;
}

export default async function CadastroPage({ searchParams }: CadastroPageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const convite = typeof sp?.convite === "string" ? sp.convite : undefined;

  return <AuthForm mode="cadastro" inviteToken={convite} />;
}
