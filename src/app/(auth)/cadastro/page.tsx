import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = {
  title: "Criar conta — Contas da Casa",
};

export default function CadastroPage() {
  return <AuthForm mode="cadastro" />;
}
