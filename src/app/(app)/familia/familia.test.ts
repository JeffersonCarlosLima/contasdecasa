import { describe, expect, it } from "vitest";
import {
  buildWhatsAppInviteUrl,
  formatInviteMeta,
  formatMemberMeta,
  getMemberRoleLabel,
  getPluralizedSupportText,
} from "./_components/helpers";
import { KINSHIP_LABELS, ROLE_LABELS, COLOR_OPTIONS } from "./_components/types";

describe("Helpers e formatação da tela de Família", () => {
  describe("getPluralizedSupportText", () => {
    it("pluraliza corretamente no singular (1 membro e 1 convite)", () => {
      const text = getPluralizedSupportText(1, 1);
      expect(text).toBe(
        "1 membro e 1 convite pendente. Todos veem os lançamentos de todos; cada um lança as próprias despesas.",
      );
    });

    it("pluraliza corretamente no plural (3 membros e 2 convites)", () => {
      const text = getPluralizedSupportText(3, 2);
      expect(text).toBe(
        "3 membros e 2 convites pendentes. Todos veem os lançamentos de todos; cada um lança as próprias despesas.",
      );
    });
  });

  describe("getMemberRoleLabel", () => {
    it("retorna 'Dono' e badge cc-role--owner quando o papel é dono", () => {
      const res = getMemberRoleLabel("dono", false);
      expect(res.label).toBe("Dono");
      expect(res.badgeClass).toBe("cc-role cc-role--owner");
    });

    it("retorna 'Dependente' e badge cc-role quando isDependent é true", () => {
      const res = getMemberRoleLabel("membro", true);
      expect(res.label).toBe("Dependente");
      expect(res.badgeClass).toBe("cc-role");
    });

    it("retorna 'Admin' quando o papel é admin", () => {
      const res = getMemberRoleLabel("admin", false);
      expect(res.label).toBe("Admin");
      expect(res.badgeClass).toBe("cc-role");
    });

    it("retorna 'Membro' para membro comum", () => {
      const res = getMemberRoleLabel("membro", false);
      expect(res.label).toBe("Membro");
      expect(res.badgeClass).toBe("cc-role");
    });
  });

  describe("formatMemberMeta", () => {
    it("formata metadado de titular com email e divisão ativa", () => {
      const meta = formatMemberMeta({
        isDependent: false,
        kinship: "titular",
        email: "jefferson@email.com",
        participatesInSplit: true,
      });
      expect(meta).toBe("Titular · jefferson@email.com · participa da divisão");
    });

    it("formata dependente sem login", () => {
      const meta = formatMemberMeta({
        isDependent: true,
        kinship: "filho",
        participatesInSplit: false,
      });
      expect(meta).toBe("Sem login · despesas lançadas pelos pais · fora da divisão");
    });

    it("formata cônjuge sem email", () => {
      const meta = formatMemberMeta({
        isDependent: false,
        kinship: "conjuge",
        participatesInSplit: true,
      });
      expect(meta).toBe("Cônjuge · participa da divisão");
    });
  });

  describe("formatInviteMeta", () => {
    it("formata metadado de convite pendente com data de expiração", () => {
      const meta = formatInviteMeta({
        kinship: "outro",
        role: "membro",
        expiresAt: new Date("2026-11-13T12:00:00Z"),
      });
      expect(meta).toBe("Outro parente · membro · expira em 13/11");
    });

    it("formata convite de admin", () => {
      const meta = formatInviteMeta({
        kinship: "conjuge",
        role: "admin",
        expiresAt: new Date("2026-11-20T12:00:00Z"),
      });
      expect(meta).toBe("Cônjuge · admin · expira em 20/11");
    });
  });

  describe("buildWhatsAppInviteUrl", () => {
    it("monta o link de convite do WhatsApp com mensagem e link codificados", () => {
      const familyName = "Família Lima";
      const link = "https://app.contasdecasa.com/convite/token123";
      const url = buildWhatsAppInviteUrl(familyName, link);

      const expectedMessage = `Você foi convidado para a Família Lima no Contas da Casa. Crie sua conta com este email e entre na família: ${link}`;
      expect(url).toBe(`https://wa.me/?text=${encodeURIComponent(expectedMessage)}`);
    });
  });

  describe("Tipos e constantes", () => {
    it("possui todos os parentescos mapeados", () => {
      expect(KINSHIP_LABELS.titular).toBe("Titular");
      expect(KINSHIP_LABELS.conjuge).toBe("Cônjuge");
      expect(KINSHIP_LABELS.filho).toBe("Filho(a)");
      expect(KINSHIP_LABELS.outro).toBe("Outro parente");
    });

    it("possui todos os papéis mapeados", () => {
      expect(ROLE_LABELS.dono).toBe("Dono");
      expect(ROLE_LABELS.admin).toBe("Admin");
      expect(ROLE_LABELS.membro).toBe("Membro");
    });

    it("possui 4 opções de cores de pessoa (person-a..d)", () => {
      expect(COLOR_OPTIONS).toHaveLength(4);
      expect(COLOR_OPTIONS.map((c) => c.value)).toEqual([
        "person-a",
        "person-b",
        "person-c",
        "person-d",
      ]);
    });
  });
});
