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
    transaction: vi.fn(),
  },
}));

vi.mock("@/lib/mail", () => ({
  sendInviteEmail: vi.fn().mockResolvedValue({ sent: false }),
}));

import { db } from "@/db";
import { type MemberRole, requireRole } from "@/lib/session";
import {
  addDependent,
  cancelInvite,
  canRemoveMemberRule,
  canTransferOwnershipRule,
  canUpdateMemberRole,
  checkInviteRateLimit,
  deleteFamily,
  inviteMember,
  removeMember,
  renameFamily,
  resendInvite,
  transferOwnership,
  updateMember,
} from "./actions";

type SessionContext = Awaited<ReturnType<typeof requireRole>>;

describe("Regras de permissão puras (família)", () => {
  describe("checkInviteRateLimit", () => {
    it("permite envio se a contagem recente for menor que o limite", async () => {
      const res = await checkInviteRateLimit(5, 10);
      expect(res.allowed).toBe(true);
    });

    it("bloqueia envio quando atingir o limite por hora", async () => {
      const res = await checkInviteRateLimit(10, 10);
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/Limite de convites atingido/);
    });
  });

  describe("canUpdateMemberRole", () => {
    it("impede alteração do papel do dono por esta via", async () => {
      const res = await canUpdateMemberRole("dono", "dono", "admin");
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/papel do dono não pode ser alterado/);
    });

    it("impede promoção a dono por esta via", async () => {
      const res = await canUpdateMemberRole("dono", "membro", "dono");
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/transferir posse/);
    });

    it("impede que admin altere o papel de outro admin", async () => {
      const res = await canUpdateMemberRole("admin", "admin", "membro");
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/Apenas o dono pode alterar o papel de outro administrador/);
    });

    it("permite que dono altere papel de admin ou membro", async () => {
      const res = await canUpdateMemberRole("dono", "membro", "admin");
      expect(res.allowed).toBe(true);
    });
  });

  describe("canRemoveMemberRule", () => {
    it("impede remoção do dono", async () => {
      const res = await canRemoveMemberRule("dono", "mem_1", { id: "mem_1", role: "dono" });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/dono da família não pode ser removido/);
    });

    it("impede que o membro remova a si mesmo", async () => {
      const res = await canRemoveMemberRule("admin", "mem_2", { id: "mem_2", role: "admin" });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/remover a si mesmo/);
    });

    it("impede que admin remova outro admin", async () => {
      const res = await canRemoveMemberRule("admin", "mem_2", { id: "mem_3", role: "admin" });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/Apenas o dono pode remover outro administrador/);
    });

    it("permite que admin remova membro comum", async () => {
      const res = await canRemoveMemberRule("admin", "mem_2", { id: "mem_4", role: "membro" });
      expect(res.allowed).toBe(true);
    });

    it("permite que dono remova admin ou membro", async () => {
      const res = await canRemoveMemberRule("dono", "mem_1", { id: "mem_2", role: "admin" });
      expect(res.allowed).toBe(true);
    });
  });

  describe("canTransferOwnershipRule", () => {
    it("impede transferência se o usuário atual não for dono", async () => {
      const res = await canTransferOwnershipRule("admin", "mem_2", {
        id: "mem_3",
        userId: "usr_3",
        status: "ativo",
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/Apenas o dono atual pode transferir a posse/);
    });

    it("impede transferência para si mesmo", async () => {
      const res = await canTransferOwnershipRule("dono", "mem_1", {
        id: "mem_1",
        userId: "usr_1",
        status: "ativo",
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/Você já é o dono/);
    });

    it("impede transferência para dependente sem login", async () => {
      const res = await canTransferOwnershipRule("dono", "mem_1", {
        id: "mem_dep",
        userId: null,
        status: "ativo",
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/dependente sem login/);
    });

    it("impede transferência para membro inativo ou removido", async () => {
      const res = await canTransferOwnershipRule("dono", "mem_1", {
        id: "mem_inativo",
        userId: "usr_inativo",
        status: "removido",
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/membro inativo ou removido/);
    });

    it("permite transferência para membro ativo com login", async () => {
      const res = await canTransferOwnershipRule("dono", "mem_1", {
        id: "mem_2",
        userId: "usr_2",
        status: "ativo",
      });
      expect(res.allowed).toBe(true);
    });
  });
});

describe("Server Actions da Família", () => {
  const mockAdminContext: SessionContext = {
    user: {
      id: "usr_admin",
      name: "Admin User",
      email: "admin@exemplo.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    member: {
      id: "mem_admin",
      familyId: "fam_123",
      userId: "usr_admin",
      displayName: "Admin",
      role: "admin",
      kinship: "titular",
      color: "person-a",
      participatesInSplit: true,
      customPercent: null,
      status: "ativo",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    familyId: "fam_123",
    role: "admin",
  };

  const mockDonoContext: SessionContext = {
    ...mockAdminContext,
    role: "dono",
    member: {
      ...mockAdminContext.member,
      id: "mem_dono",
      role: "dono",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inviteMember falha com validação Zod para email inválido", async () => {
    vi.mocked(requireRole).mockResolvedValue(mockAdminContext);

    const res = await inviteMember({
      email: "invalido",
      role: "membro",
      kinship: "outro",
      participatesInSplit: true,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/Email inválido/);
    }
  });

  it("inviteMember bloqueia se o rate limit for atingido", async () => {
    vi.mocked(requireRole).mockResolvedValue(mockAdminContext);

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ total: 12 }]),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const res = await inviteMember({
      email: "novo@exemplo.com",
      role: "membro",
      kinship: "outro",
      participatesInSplit: true,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/Limite de convites atingido/);
    }
  });

  it("inviteMember cria convite e retorna link quando válido", async () => {
    vi.mocked(requireRole).mockResolvedValue(mockAdminContext);

    vi.mocked(db.select)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: 2 }]),
        }),
      } as unknown as ReturnType<typeof db.select>)
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
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ name: "Família Silva" }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof db.insert>);

    const res = await inviteMember({
      email: "novo@exemplo.com",
      role: "membro",
      kinship: "conjuge",
      participatesInSplit: true,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.link).toMatch(/\/convite\//);
    }
  });

  it("resendInvite atualiza token e retorna novo link", async () => {
    vi.mocked(requireRole).mockResolvedValue(mockAdminContext);

    vi.mocked(db.select)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: "c2c5ecb2-bf7c-473d-9d7a-129b8c9d2f34",
                familyId: "fam_123",
                email: "parente@exemplo.com",
                acceptedAt: null,
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ name: "Família Silva" }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    } as unknown as ReturnType<typeof db.update>);

    const res = await resendInvite("c2c5ecb2-bf7c-473d-9d7a-129b8c9d2f34");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.link).toMatch(/\/convite\//);
    }
  });

  it("cancelInvite remove o convite", async () => {
    vi.mocked(requireRole).mockResolvedValue(mockAdminContext);
    vi.mocked(db.delete).mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "c2c5ecb2-bf7c-473d-9d7a-129b8c9d2f34" }]),
      }),
    } as unknown as ReturnType<typeof db.delete>);

    const res = await cancelInvite("c2c5ecb2-bf7c-473d-9d7a-129b8c9d2f34");
    expect(res.ok).toBe(true);
  });

  it("addDependent insere membro sem login (userId: null)", async () => {
    vi.mocked(requireRole).mockResolvedValue(mockAdminContext);
    const mockCreatedId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

    const insertValuesSpy = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: mockCreatedId }]),
    });
    vi.mocked(db.insert).mockReturnValue({
      values: insertValuesSpy,
    } as unknown as ReturnType<typeof db.insert>);

    const res = await addDependent({
      displayName: "Pedrinho",
      kinship: "filho",
      participatesInSplit: false,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.memberId).toBe(mockCreatedId);
    }
    expect(insertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "Pedrinho",
        userId: null,
      }),
    );
  });

  it("updateMember atualiza dados do membro", async () => {
    vi.mocked(requireRole).mockResolvedValue(mockAdminContext);

    const targetMember = {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      familyId: "fam_123",
      role: "membro" as MemberRole,
      status: "ativo",
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([targetMember]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const updateSetSpy = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    vi.mocked(db.update).mockReturnValue({
      set: updateSetSpy,
    } as unknown as ReturnType<typeof db.update>);

    const res = await updateMember("f47ac10b-58cc-4372-a567-0e02b2c3d479", {
      displayName: "Jefferson F.",
      role: "admin",
      color: "person-b",
    });

    expect(res.ok).toBe(true);
    expect(updateSetSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "Jefferson F.",
        role: "admin",
        color: "person-b",
      }),
    );
  });

  it("updateMember falha se displayName for string vazia", async () => {
    vi.mocked(requireRole).mockResolvedValue(mockAdminContext);

    const res = await updateMember("f47ac10b-58cc-4372-a567-0e02b2c3d479", {
      displayName: "",
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/Nome de exibição não pode ser vazio/);
    }
  });

  it("renameFamily renomeia família com sucesso para admin/dono", async () => {
    vi.mocked(requireRole).mockResolvedValue(mockAdminContext);

    const updateSetSpy = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    vi.mocked(db.update).mockReturnValue({
      set: updateSetSpy,
    } as unknown as ReturnType<typeof db.update>);

    const res = await renameFamily({ name: "Família Fenyx" });
    expect(res.ok).toBe(true);
    expect(updateSetSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Família Fenyx",
      }),
    );
  });

  it("renameFamily valida tamanho mínimo do nome", async () => {
    vi.mocked(requireRole).mockResolvedValue(mockAdminContext);

    const res = await renameFamily({ name: "A" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/pelo menos 2 caracteres/);
    }
  });

  it("removeMember marca status como removido", async () => {
    vi.mocked(requireRole).mockResolvedValue(mockAdminContext);

    const targetMember = {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      familyId: "fam_123",
      role: "membro" as MemberRole,
      status: "ativo",
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([targetMember]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const updateSetSpy = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    vi.mocked(db.update).mockReturnValue({
      set: updateSetSpy,
    } as unknown as ReturnType<typeof db.update>);

    const res = await removeMember("f47ac10b-58cc-4372-a567-0e02b2c3d479");
    expect(res.ok).toBe(true);
    expect(updateSetSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "removido",
      }),
    );
  });

  it("transferOwnership exige dono e executa transação", async () => {
    vi.mocked(requireRole).mockResolvedValue(mockDonoContext);

    const targetMember = {
      id: "mem_alvo_123",
      familyId: "fam_123",
      userId: "usr_alvo_123",
      status: "ativo",
      role: "admin" as MemberRole,
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([targetMember]),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const mockTx = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };

    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      return callback(mockTx as unknown as Parameters<typeof callback>[0]);
    });

    const res = await transferOwnership("f47ac10b-58cc-4372-a567-0e02b2c3d479");
    expect(res.ok).toBe(true);
    expect(db.transaction).toHaveBeenCalled();
  });

  it("deleteFamily é restrito a dono", async () => {
    vi.mocked(requireRole).mockRejectedValue(new Error("Permissão insuficiente"));

    const res = await deleteFamily();
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/Permissão insuficiente/);
    }
  });
});
