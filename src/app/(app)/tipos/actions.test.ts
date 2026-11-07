import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/session", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from "@/db";
import { requireRole } from "@/lib/session";
import {
  archiveCategory,
  deletePaymentMethod,
  saveCategory,
  savePaymentMethod,
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
    it("impede vincular dono que não é da mesma família", async () => {
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
        error: "O membro selecionado como proprietário não pertence a esta família.",
      });
    });

    it("cria nova forma de pagamento com sucesso", async () => {
      vi.mocked(db.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: validUuid }]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const res = await savePaymentMethod({
        name: "Pix Banco X",
        type: "pix",
      });
      expect(res).toEqual({ ok: true, paymentMethodId: validUuid });
    });
  });

  describe("deletePaymentMethod", () => {
    it("bloqueia exclusão se houver despesas vinculadas", async () => {
      vi.mocked(db.select)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: validUuid }]),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 2 }]),
          }),
        } as unknown as ReturnType<typeof db.select>);

      const res = await deletePaymentMethod(validUuid);
      expect(res).toEqual({
        ok: false,
        error: "Não é possível excluir: esta forma de pagamento está vinculada a despesas.",
      });
      expect(db.delete).not.toHaveBeenCalled();
    });

    it("bloqueia exclusão se houver despesas recorrentes vinculadas", async () => {
      vi.mocked(db.select)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: validUuid }]),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 0 }]),
          }),
        } as unknown as ReturnType<typeof db.select>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 1 }]),
          }),
        } as unknown as ReturnType<typeof db.select>);

      const res = await deletePaymentMethod(validUuid);
      expect(res).toEqual({
        ok: false,
        error: "Não é possível excluir: esta forma de pagamento está vinculada a despesas recorrentes.",
      });
      expect(db.delete).not.toHaveBeenCalled();
    });

    it("exclui com sucesso quando não há despesas vinculadas", async () => {
      vi.mocked(db.select)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: validUuid }]),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 0 }]),
          }),
        } as unknown as ReturnType<typeof db.select>)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 0 }]),
          }),
        } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.delete).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof db.delete>);

      const res = await deletePaymentMethod(validUuid);
      expect(res).toEqual({ ok: true });
      expect(db.delete).toHaveBeenCalled();
    });
  });
});
