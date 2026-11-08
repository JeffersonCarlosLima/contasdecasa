import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { redirect } from "next/navigation";
import { db } from "@/db";
import { familyMembers } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  hasRequiredRole,
  InsufficientRoleError,
  type MemberRole,
  requireMember,
  requireRole,
  requireSession,
  ROLE_HIERARCHY,
} from "./session";

type SessionData = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
type MemberRecord = typeof familyMembers.$inferSelect;

describe("Hierarquia de papéis (função pura)", () => {
  it("respeita a ordem membro < admin < dono", () => {
    expect(ROLE_HIERARCHY.membro).toBeLessThan(ROLE_HIERARCHY.admin);
    expect(ROLE_HIERARCHY.admin).toBeLessThan(ROLE_HIERARCHY.dono);
  });

  it("membro só tem acesso ao papel membro", () => {
    expect(hasRequiredRole("membro", "membro")).toBe(true);
    expect(hasRequiredRole("membro", "admin")).toBe(false);
    expect(hasRequiredRole("membro", "dono")).toBe(false);
  });

  it("admin tem acesso aos papéis membro e admin, mas não dono", () => {
    expect(hasRequiredRole("admin", "membro")).toBe(true);
    expect(hasRequiredRole("admin", "admin")).toBe(true);
    expect(hasRequiredRole("admin", "dono")).toBe(false);
  });

  it("dono tem acesso a todos os papéis", () => {
    expect(hasRequiredRole("dono", "membro")).toBe(true);
    expect(hasRequiredRole("dono", "admin")).toBe(true);
    expect(hasRequiredRole("dono", "dono")).toBe(true);
  });

  it("nega acesso para papéis inválidos", () => {
    expect(hasRequiredRole("outro" as unknown as MemberRole, "membro")).toBe(false);
  });
});

describe("Contrato de sessão e permissões", () => {
  const mockUser: SessionData["user"] = {
    id: "usr_teste_123",
    name: "Jefferson",
    email: "jefferson@exemplo.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession: SessionData = {
    user: mockUser,
    session: {
      id: "sess_123",
      userId: mockUser.id,
      expiresAt: new Date(Date.now() + 86400000),
      token: "tok_123",
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    },
  };

  const mockMember: MemberRecord = {
    id: "mem_123",
    familyId: "fam_abc_456",
    userId: mockUser.id,
    displayName: "Jefferson",
    role: "membro",
    kinship: "titular",
    color: "person-a",
    participatesInSplit: true,
    customPercent: null,
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function mockDbSelectMember(member: MemberRecord | null) {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(member ? [member] : []),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireSession()", () => {
    it("redireciona para /entrar quando não há sessão", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      await expect(requireSession()).rejects.toThrow("NEXT_REDIRECT:/entrar");
      expect(redirect).toHaveBeenCalledWith("/entrar");
    });

    it("retorna a sessão quando o usuário está autenticado", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      const result = await requireSession();
      expect(result).toEqual(mockSession);
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("requireMember()", () => {
    it("redireciona para /entrar se não houver sessão ativa", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      await expect(requireMember()).rejects.toThrow("NEXT_REDIRECT:/entrar");
      expect(redirect).toHaveBeenCalledWith("/entrar");
    });

    it("redireciona para /criar-familia quando o usuário logado não tem membro ativo", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      mockDbSelectMember(null);

      await expect(requireMember()).rejects.toThrow("NEXT_REDIRECT:/criar-familia");
      expect(redirect).toHaveBeenCalledWith("/criar-familia");
    });

    it("retorna { user, member, familyId, role } resolvidos da sessão e do banco", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      mockDbSelectMember(mockMember);

      const result = await requireMember();
      expect(result).toEqual({
        user: mockUser,
        member: mockMember,
        familyId: "fam_abc_456",
        role: "membro",
      });
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("requireRole()", () => {
    it("permite acesso quando o papel do membro é suficiente", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      mockDbSelectMember({ ...mockMember, role: "admin" });

      const result = await requireRole("admin");
      expect(result.role).toBe("admin");

      const resultMembro = await requireRole("membro");
      expect(resultMembro.role).toBe("admin");
    });

    it("nega acesso com erro quando o papel é insuficiente (membro tentando ação de admin)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      mockDbSelectMember({ ...mockMember, role: "membro" });

      await expect(requireRole("admin")).rejects.toThrow(InsufficientRoleError);
      await expect(requireRole("admin")).rejects.toThrow(
        /Acesso negado: papel "membro" insuficiente para o mínimo "admin"/,
      );
    });

    it("nega acesso com erro quando admin tenta ação exclusiva de dono", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      mockDbSelectMember({ ...mockMember, role: "admin" });

      await expect(requireRole("dono")).rejects.toThrow(InsufficientRoleError);
    });

    it("permite dono acessar qualquer nível de permissão", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      mockDbSelectMember({ ...mockMember, role: "dono" });

      await expect(requireRole("membro")).resolves.toMatchObject({ role: "dono" });
      await expect(requireRole("admin")).resolves.toMatchObject({ role: "dono" });
      await expect(requireRole("dono")).resolves.toMatchObject({ role: "dono" });
    });
  });
});
