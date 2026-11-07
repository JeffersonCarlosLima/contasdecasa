import { describe, expect, it } from "vitest";
import {
  getMobileHeaderTitle,
  isEditExpenseRoute,
  isExpenseFormRoute,
  isRouteActive,
} from "./nav-utils";

describe("nav-utils", () => {
  describe("isRouteActive", () => {
    it("deve marcar Dashboard como ativo apenas na raiz '/'", () => {
      expect(isRouteActive("/", "/")).toBe(true);
      expect(isRouteActive("/despesas", "/")).toBe(false);
      expect(isRouteActive("/mes", "/")).toBe(false);
      expect(isRouteActive("/familia", "/")).toBe(false);
    });

    it("deve ignorar query params e hashes na raiz", () => {
      expect(isRouteActive("/?mes=2026-11", "/")).toBe(true);
      expect(isRouteActive("/#topo", "/")).toBe(true);
    });

    it("deve marcar Despesas em /despesas e sub-rotas", () => {
      expect(isRouteActive("/despesas", "/despesas")).toBe(true);
      expect(isRouteActive("/despesas/nova", "/despesas")).toBe(true);
      expect(isRouteActive("/despesas/123", "/despesas")).toBe(true);
      expect(isRouteActive("/despesas?mes=2026-11", "/despesas")).toBe(true);
      expect(isRouteActive("/mes", "/despesas")).toBe(false);
    });

    it("deve marcar Fechamento em /mes e sub-rotas", () => {
      expect(isRouteActive("/mes", "/mes")).toBe(true);
      expect(isRouteActive("/mes?mes=2026-11", "/mes")).toBe(true);
      expect(isRouteActive("/despesas", "/mes")).toBe(false);
    });

    it("deve marcar Tipos de despesa em /tipos", () => {
      expect(isRouteActive("/tipos", "/tipos")).toBe(true);
      expect(isRouteActive("/tipos/nova", "/tipos")).toBe(true);
      expect(isRouteActive("/familia", "/tipos")).toBe(false);
    });

    it("deve marcar Família em /familia e sub-rotas", () => {
      expect(isRouteActive("/familia", "/familia")).toBe(true);
      expect(isRouteActive("/familia/convites", "/familia")).toBe(true);
      expect(isRouteActive("/mes", "/familia")).toBe(false);
    });
  });

  describe("isExpenseFormRoute", () => {
    it("deve identificar /despesas/nova como tela de formulário de despesa", () => {
      expect(isExpenseFormRoute("/despesas/nova")).toBe(true);
      expect(isExpenseFormRoute("/despesas/nova?origem=dashboard")).toBe(true);
    });

    it("deve identificar /despesas/[id] como tela de edição", () => {
      expect(isExpenseFormRoute("/despesas/abc-123")).toBe(true);
      expect(isExpenseFormRoute("/despesas/42")).toBe(true);
    });

    it("não deve considerar a listagem /despesas ou outras páginas como formulário", () => {
      expect(isExpenseFormRoute("/despesas")).toBe(false);
      expect(isExpenseFormRoute("/")).toBe(false);
      expect(isExpenseFormRoute("/mes")).toBe(false);
      expect(isExpenseFormRoute("/familia")).toBe(false);
    });
  });

  describe("isEditExpenseRoute", () => {
    it("não deve considerar /despesas/nova como edição", () => {
      expect(isEditExpenseRoute("/despesas/nova")).toBe(false);
    });

    it("deve considerar /despesas/[id] como edição", () => {
      expect(isEditExpenseRoute("/despesas/abc-123")).toBe(true);
      expect(isEditExpenseRoute("/despesas/nova-despesa-slug")).toBe(true);
    });
  });

  describe("getMobileHeaderTitle", () => {
    it("deve retornar os títulos fiéis aos protótipos para cada rota", () => {
      expect(getMobileHeaderTitle("/")).toBe("Contas da Casa");
      expect(getMobileHeaderTitle("/despesas")).toBe("Despesas");
      expect(getMobileHeaderTitle("/despesas/nova")).toBe("Lançar despesa");
      expect(getMobileHeaderTitle("/despesas/xyz-789")).toBe("Editar despesa");
      expect(getMobileHeaderTitle("/mes")).toBe("Fechamento");
      expect(getMobileHeaderTitle("/tipos")).toBe("Tipos de despesa");
      expect(getMobileHeaderTitle("/familia")).toBe("Família");
      expect(getMobileHeaderTitle("/conta")).toBe("Minha conta");
      expect(getMobileHeaderTitle("/desconhecido")).toBe("Contas da Casa");
    });
  });
});
