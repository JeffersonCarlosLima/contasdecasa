import type { DbTransaction } from "@/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { joinFamilyFromInvite, pickNextMemberColor } from "./family-join";

describe("pickNextMemberColor (função pura)", () => {
  it("escolhe person-a quando não há membros na família", () => {
    expect(pickNextMemberColor([])).toBe("person-a");
  });

  it("escolhe person-b quando person-a já está em uso", () => {
    expect(pickNextMemberColor(["person-a"])).toBe("person-b");
  });

  it("escolhe person-c quando person-a e person-b estão em uso", () => {
    expect(pickNextMemberColor(["person-a", "person-b"])).toBe("person-c");
  });

  it("escolhe person-d quando person-a, person-b e person-c estão em uso", () => {
    expect(pickNextMemberColor(["person-a", "person-b", "person-c"])).toBe("person-d");
  });

  it("reutiliza person-a se todas as cores já foram usadas", () => {
    expect(
      pickNextMemberColor(["person-a", "person-b", "person-c", "person-d"])
    ).toBe("person-a");
  });

  it("preenche lacunas na ordem person-a..person-d", () => {
    expect(pickNextMemberColor(["person-b", "person-c"])).toBe("person-a");
    expect(pickNextMemberColor(["person-a", "person-c"])).toBe("person-b");
    expect(pickNextMemberColor(["person-a", "person-b", "person-d"])).toBe("person-c");
  });
});

describe("joinFamilyFromInvite", () => {
  const mockUser = {
    id: "usr_100",
    name: "Carlos",
    email: "carlos@exemplo.com",
  };

  const mockInvite = {
    id: "inv_200",
    familyId: "fam_300",
    role: "membro" as const,
    kinship: "conjuge" as const,
    participatesInSplit: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("insere novo membro com próxima cor disponível e marca convite como aceito", async () => {
    const mockTx = {
      select: vi.fn()
        // 1. membros existentes para cor
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ color: "person-a" }]),
          }),
        })
        // 2. checagem se usuário já é membro
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue([]),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    };

    await joinFamilyFromInvite(mockTx as unknown as DbTransaction, mockUser, mockInvite);

    // Deve inserir com person-b (já que person-a existe)
    expect(mockTx.insert).toHaveBeenCalled();
    const insertedValues = vi.mocked(mockTx.insert).mock.results[0]?.value.values.mock.calls[0]?.[0];
    expect(insertedValues).toMatchObject({
      familyId: "fam_300",
      userId: "usr_100",
      displayName: "Carlos",
      role: "membro",
      kinship: "conjuge",
      color: "person-b",
      participatesInSplit: true,
      status: "ativo",
    });

    // Deve marcar convite como aceito
    expect(mockTx.update).toHaveBeenCalled();
  });

  it("atualiza membro existente se já houver registro e marca convite aceito", async () => {
    const mockTx = {
      select: vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: "mem_existente" }]),
            }),
          }),
        }),
      insert: vi.fn(),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    };

    await joinFamilyFromInvite(mockTx as unknown as DbTransaction, mockUser, mockInvite);

    expect(mockTx.insert).not.toHaveBeenCalled();
    expect(mockTx.update).toHaveBeenCalledTimes(2); // 1 para membro, 1 para convite
  });
});
