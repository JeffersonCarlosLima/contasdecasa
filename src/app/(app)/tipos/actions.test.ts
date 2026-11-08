import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/session", () => {
  class MockInsufficientRoleError extends Error {
    constructor(currentRole: string, minRole: string) {
      super(`Acesso negado: papel "${currentRole}" insuficiente para o mínimo "${minRole}".`);
      this.name = "InsufficientRoleError";
    }
  }

  return {
    requireRole: vi.fn(),
    InsufficientRoleError: MockInsufficientRoleError,
  };
});

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from "@/db";
import { InsufficientRoleError, requireRole } from "@/lib/session";
import {
  archiveCategory,
  saveCategory,
  savePaymentMethod,
  setPaymentMethodArchived,
} from "./actions";

describe("tipos actions", () => {
  const mockAdminMember = {
    user: { id: "usr_admin", email: "admin@exemplo.com" },
    member: { id: "mem_admin", role: "admin" },
    familyId: "fam_123",
    role: "admin",
  };

  const validUuid = "a0000000-0000-4000-8000-000000000001";
  const validMemberUuid = "a0000000-0000-4000-8000-000000000002";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireRole).mockResolvedValue(mockAdminMember as unknown as Awaited<ReturnType<typeof requireRole>>);
  });

  describe("saveCategory", () => {
    it("rejeita dados inválidos", async () => {
      const res = await saveCategory({
        name: "",
        color: "chart-1",
        nature: "fixa",
      });
      expect(res.ok).toBe(false);
      expect(res).toHaveProperty("error");
    });

    it("impede duplicação de nome na mesma família", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: "cat_existente" }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const res = await saveCategory({
        name: "Moradia",
        color: "chart-1",
        nature: "fixa",
      });
      expect(res).toEqual({
        ok: false,
        error: "Já existe uma categoria com este nome na sua família.",
      });
    });

    it("cria nova categoria com sucesso", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: validUuid }]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const res = await saveCategory({
        name: "Lazer",
        color: "chart-3",
        nature: "variavel",
      });
      expect(res).toEqual({ ok: true, categoryId: validUuid });
    });

    it("atualiza categoria existente", async () => {
      vi.mocked(db.select)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: validUuid }]),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const res = await saveCategory({
        id: validUuid,
        name: "Moradia Editada",
        color: "chart-1",
        nature: "fixa",
      });
      expect(res).toEqual({ ok: true, categoryId: validUuid });
    });
  });

  describe("archiveCategory", () => {
    it("arquiva categoria da própria família", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: validUuid }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const res = await archiveCategory(validUuid);
      expect(res).toEqual({ ok: true });
    });

    it("rejeita arquivar se não for da família", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const res = await archiveCategory(validUuid);
      expect(res.ok).toBe(false);
      expect(res).toHaveProperty("error");
    });
  });

  describe("savePaymentMethod", () => {
    it("rejeita nome vazio", async () => {
      const res = await savePaymentMethod({
        name: "   ",
        type: "cartao",
      });
      expect(res.ok).toBe(false);
      expect(res).toHaveProperty("error");
    });

    it("rejeita tipo inválido", async () => {
      const res = await savePaymentMethod({
        name: "Cartão",
        // @ts-expect-error teste de tipo inválido em tempo de execução
        type: "cheque",
      });
      expect(res.ok).toBe(false);
      expect(res).toHaveProperty("error");
    });

    it("rejeita dia fora de 1-31", async () => {
      const res = await savePaymentMethod({
        name: "Cartão",
        type: "cartao",
        closingDay: 32,
        dueDay: 10,
      });
      expect(res.ok).toBe(false);
      expect(res).toHaveProperty("error");
    });

    it("rejeita quando só um dos dias é informado", async () => {
      const res = await savePaymentMethod({
        name: "Cartão",
        type: "cartao",
        closingDay: 5,
      });
      expect(res.ok).toBe(false);
      expect(res).toHaveProperty("error");
    });

    it("rejeita final do cartão inválido", async () => {
      const res = await savePaymentMethod({
        name: "Cartão",
        type: "cartao",
        cardLast4: "123a",
      });
      expect(res.ok).toBe(false);
      expect(res).toHaveProperty("error");
    });

    it("membro comum não escreve (impede ação sem papel admin/dono)", async () => {
      vi.mocked(requireRole).mockRejectedValueOnce(
        new InsufficientRoleError("membro", "admin")
      );

      const res = await savePaymentMethod({
        name: "Cartão Jefferson",
        type: "cartao",
      });

      expect(res.ok).toBe(false);
      expect(res).toHaveProperty("error");
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("impede duplicação de nome case-insensitive entre formas ativas", async () => {
      // Simula que já existe "nubank" ativo
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: "pm_existente", name: "nubank" }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const res = await savePaymentMethod({
        name: "NUBANK",
        type: "cartao",
      });

      expect(res).toEqual({
        ok: false,
        error: "Já existe uma forma de pagamento ativa com este nome na sua família.",
      });
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("permite reúso de nome se a forma com mesmo nome estiver arquivada", async () => {
      // Query busca ativas (archived: false), logo retorna vazio se só existe arquivada
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: validUuid }]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const res = await savePaymentMethod({
        name: "Nubank",
        type: "cartao",
      });

      expect(res).toEqual({ ok: true, paymentMethodId: validUuid });
      expect(db.insert).toHaveBeenCalled();
    });

    it("impede vincular dono que não é da mesma família ou não está ativo", async () => {
      // 1. Check duplicate -> ok
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      // 2. Check owner -> não encontrado ativo na família
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const res = await savePaymentMethod({
        name: "Cartão",
        type: "cartao",
        ownerMemberId: validMemberUuid,
      });

      expect(res).toEqual({
        ok: false,
        error: "O membro selecionado como proprietário não pertence a esta família ou não está ativo.",
      });
    });

    it("respeita isolamento por family_id ao salvar forma de pagamento", async () => {
      // 1. Check duplicate
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      // 2. Insert values
      const insertValuesSpy = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: validUuid }]),
      });
      vi.mocked(db.insert).mockReturnValueOnce({
        values: insertValuesSpy,
      } as unknown as ReturnType<typeof db.insert>);

      const res = await savePaymentMethod({
        name: "Nubank",
        type: "cartao",
        cardLast4: "1234",
        closingDay: 5,
        dueDay: 15,
      });

      expect(res).toEqual({ ok: true, paymentMethodId: validUuid });
      expect(insertValuesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          familyId: "fam_123",
          name: "Nubank",
          type: "cartao",
          archived: false,
          cardLast4: "1234",
          closingDay: 5,
          dueDay: 15,
        })
      );
    });

    it("zera campos de cartão quando tipo não é cartão ao persistir", async () => {
      // 1. Check duplicate
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      // 2. Insert values
      const insertValuesSpy = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: validUuid }]),
      });
      vi.mocked(db.insert).mockReturnValueOnce({
        values: insertValuesSpy,
      } as unknown as ReturnType<typeof db.insert>);

      const res = await savePaymentMethod({
        name: "Conta Corrente",
        type: "conta",
        cardLast4: "1234",
        closingDay: 5,
        dueDay: 15,
      });

      expect(res).toEqual({ ok: true, paymentMethodId: validUuid });
      expect(insertValuesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          familyId: "fam_123",
          name: "Conta Corrente",
          type: "conta",
          cardLast4: null,
          closingDay: null,
          dueDay: null,
        })
      );
    });

    it("atualiza forma de pagamento existente da família", async () => {
      // 1. Check duplicate
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      // 2. Check existing
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: validUuid }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      // 3. Update
      const setSpy = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });
      vi.mocked(db.update).mockReturnValueOnce({
        set: setSpy,
      } as unknown as ReturnType<typeof db.update>);

      const res = await savePaymentMethod({
        id: validUuid,
        name: "Nubank Atualizado",
        type: "cartao",
        cardLast4: "4321",
        closingDay: 10,
        dueDay: 20,
      });

      expect(res).toEqual({ ok: true, paymentMethodId: validUuid });
      expect(setSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Nubank Atualizado",
          type: "cartao",
          cardLast4: "4321",
          closingDay: 10,
          dueDay: 20,
        })
      );
    });
  });

  describe("setPaymentMethodArchived", () => {
    it("arquiva forma de pagamento da própria família", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: validUuid, name: "Nubank" }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const setSpy = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });
      vi.mocked(db.update).mockReturnValueOnce({
        set: setSpy,
      } as unknown as ReturnType<typeof db.update>);

      const res = await setPaymentMethodArchived({
        id: validUuid,
        archived: true,
      });

      expect(res).toEqual({ ok: true });
      expect(setSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          archived: true,
        })
      );
    });

    it("impede reativar forma cujo nome já está em uso por outra ativa", async () => {
      // 1. Busca forma existente (arquivada)
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: validUuid, name: "Nubank" }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      // 2. Busca duplicata ativa com o mesmo nome -> encontra outra ativa
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: "outra_forma", name: "nubank" }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const res = await setPaymentMethodArchived({
        id: validUuid,
        archived: false,
      });

      expect(res).toEqual({
        ok: false,
        error: "Já existe uma forma de pagamento ativa com este nome na sua família.",
      });
      expect(db.update).not.toHaveBeenCalled();
    });

    it("permite reativar forma quando nome está livre", async () => {
      // 1. Busca forma existente
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: validUuid, name: "Nubank" }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      // 2. Busca duplicata ativa -> não encontra
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const setSpy = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });
      vi.mocked(db.update).mockReturnValueOnce({
        set: setSpy,
      } as unknown as ReturnType<typeof db.update>);

      const res = await setPaymentMethodArchived({
        id: validUuid,
        archived: false,
      });

      expect(res).toEqual({ ok: true });
      expect(setSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          archived: false,
        })
      );
    });

    it("rejeita arquivar se não pertencer à família", async () => {
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const res = await setPaymentMethodArchived({
        id: validUuid,
        archived: true,
      });

      expect(res).toEqual({
        ok: false,
        error: "Forma de pagamento não encontrada ou você não tem permissão para alterá-la.",
      });
      expect(db.update).not.toHaveBeenCalled();
    });

    it("impede que membro comum arquive forma de pagamento", async () => {
      vi.mocked(requireRole).mockRejectedValueOnce(
        new InsufficientRoleError("membro", "admin")
      );

      const res = await setPaymentMethodArchived({
        id: validUuid,
        archived: true,
      });

      expect(res.ok).toBe(false);
      expect(res).toHaveProperty("error");
      expect(db.update).not.toHaveBeenCalled();
    });
  });
});
