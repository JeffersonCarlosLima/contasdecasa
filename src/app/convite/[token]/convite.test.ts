import { describe, expect, it } from "vitest";
import {
  EXPIRED_INVITE_MESSAGE,
  getCadastroLink,
  getEntrarLink,
  getInviteHeading,
  getInviteSupportText,
  isEmailMatch,
} from "./_components/helpers";

describe("Tela de Convite (/convite/[token])", () => {
  describe("Helpers de texto e links", () => {
    it("gera o título do convite com o nome da família", () => {
      const heading = getInviteHeading("Família Lima");
      expect(heading).toBe("Você foi convidado para a Família Lima");
    });

    it("gera o texto de apoio com quem convidou e o email de destino quando informado", () => {
      const support = getInviteSupportText("Jefferson", "parente@email.com");
      expect(support).toBe("Jefferson convidou parente@email.com.");
    });

    it("gera o texto de apoio simplificado quando não há email no convite", () => {
      const support = getInviteSupportText("Jefferson", null);
      expect(support).toBe("Jefferson convidou você.");
      expect(getInviteSupportText("Jefferson")).toBe("Jefferson convidou você.");
    });

    it("possui mensagem exata de token expirado ou inválido", () => {
      expect(EXPIRED_INVITE_MESSAGE).toBe(
        "Este convite expirou ou já foi usado. Peça um novo link para quem convidou você.",
      );
    });

    it("gera link de cadastro com query param de convite", () => {
      const link = getCadastroLink("token123");
      expect(link).toBe("/cadastro?convite=token123");
    });

    it("gera link de entrar com query param de convite", () => {
      const link = getEntrarLink("token123");
      expect(link).toBe("/entrar?convite=token123");
    });
  });

  describe("Validação de coincidência de email de sessão", () => {
    it("retorna true quando os emails coincidem (case-insensitive e com trim)", () => {
      expect(isEmailMatch("PARENTE@email.com", "parente@email.com")).toBe(true);
      expect(isEmailMatch("  parente@email.com  ", "parente@email.com")).toBe(true);
    });

    it("retorna false quando os emails são diferentes", () => {
      expect(isEmailMatch("outro@email.com", "parente@email.com")).toBe(false);
    });

    it("retorna false quando não há sessão ativa (null ou undefined)", () => {
      expect(isEmailMatch(null, "parente@email.com")).toBe(false);
      expect(isEmailMatch(undefined, "parente@email.com")).toBe(false);
    });
  });
});
