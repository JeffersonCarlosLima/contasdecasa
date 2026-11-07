import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = {
  title: "Entrar — Contas da Casa",
};

export default function EntrarPage() {
  return <AuthForm mode="entrar" />;
}
