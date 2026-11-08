import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "@/db";
import { listCategories, listPaymentMethods } from "./catalog-queries";

describe("catalog-queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listCategories retorna categorias não arquivadas da família", async () => {
    const mockCategories = [
      { id: "cat_1", name: "Alimentação", archived: false },
      { id: "cat_2", name: "Moradia", archived: false },
    ];

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(mockCategories),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const res = await listCategories("fam_1");
    expect(res).toEqual(mockCategories);
  });

  it("listPaymentMethods retorna formas de pagamento da família", async () => {
    const mockMethods = [
      { id: "pay_1", name: "Nubank", type: "cartao" },
      { id: "pay_2", name: "Pix", type: "pix" },
    ];

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(mockMethods),
        }),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const res = await listPaymentMethods("fam_1");
    expect(res).toEqual(mockMethods);
  });
});
