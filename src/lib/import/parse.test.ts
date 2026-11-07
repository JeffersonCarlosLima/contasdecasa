import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { decodeBuffer, parseCsv } from "./parse";
import type { MappingConfig } from "./types";

describe("parseCsv", () => {
  const fixturesDir = join(process.cwd(), "tests/fixtures/import");

  describe("decodificação e codificações suportadas", () => {
    it("decodifica UTF-8 com BOM removendo os 3 bytes iniciais", () => {
      const bomUtf8 = new Uint8Array([0xef, 0xbb, 0xbf, 0x4f, 0x6c, 0xc3, 0xa1]); // "Olá" com BOM
      expect(decodeBuffer(bomUtf8)).toBe("Olá");
    });

    it("decodifica UTF-8 padrão sem BOM", () => {
      const utf8 = new TextEncoder().encode("Extrato Bancário");
      expect(decodeBuffer(utf8)).toBe("Extrato Bancário");
    });

    it("faz fallback para ISO-8859-1 quando há bytes inválidos para UTF-8", () => {
      // Byte 0xE7 = 'ç' e 0xE3 = 'ã' em ISO-8859-1 (inválidos sozinhos em UTF-8 estrito)
      const isoBuffer = new Uint8Array([0x4c, 0x61, 0x6e, 0xe7, 0x61, 0x6d, 0x65, 0x6e, 0x74, 0x6f]); // "Lançamento"
      expect(decodeBuffer(isoBuffer)).toBe("Lançamento");
    });

    it("rejeita arquivo com mais de 5 MB retornando warning apropriado", () => {
      const largeBuffer = new Uint8Array(5 * 1024 * 1024 + 1);
      const res = parseCsv(largeBuffer);
      expect(res.layout).toBe("desconhecido");
      expect(res.warnings[0]?.code).toBe("FILE_TOO_LARGE");
    });
  });

  describe("layout Bradesco Conta Corrente", () => {
    it("faz parse do extrato do Bradesco com preâmbulo, parada na linha em branco e validação de saldo", () => {
      const buffer = readFileSync(join(fixturesDir, "bradesco-conta.csv"));
      const result = parseCsv(new Uint8Array(buffer));

      expect(result.layout).toBe("bradesco-conta");
      expect(result.rows).toHaveLength(4);

      // Linha 1: 02/11/26 -> 2026-11-02, Saldo inicial R$ 1000
      expect(result.rows[0]).toMatchObject({
        date: "2026-11-02",
        descriptionOriginal: "SALDO INICIAL",
        descriptionNormalized: "SALDO INICIAL",
        amountCents: 100000,
        externalId: "000000",
      });

      // Linha 2: TED C SAL (Crédito de R$ 5.000,00)
      expect(result.rows[1]).toMatchObject({
        date: "2026-11-03",
        descriptionOriginal: "TED C SAL EMPRESA XYZ",
        descriptionNormalized: "TED C SAL EMPRESA XYZ",
        amountCents: 500000,
        externalId: "112233",
      });

      // Linha 3: Débito de R$ 180,50 -> -18050 centavos
      expect(result.rows[2]).toMatchObject({
        date: "2026-11-05",
        descriptionOriginal: "PGTO ELETRON COELBA",
        descriptionNormalized: "PGTO ELETRON COELBA",
        amountCents: -18050,
        externalId: "445566",
      });

      // Linha 4: Débito de R$ 250,00 -> -25000 centavos
      expect(result.rows[3]).toMatchObject({
        date: "2026-11-07",
        descriptionOriginal: "MERCADO EXTRA PARC 01/03",
        descriptionNormalized: "MERCADO EXTRA",
        amountCents: -25000,
        externalId: "778899",
      });

      // Não leu rodapés após a 1ª linha em branco ("Total Geral", "Lançamentos periódicos")
      expect(result.rows.find((r) => r.descriptionOriginal.includes("Total Geral"))).toBeUndefined();
    });
  });

  describe("layout Inter Conta Corrente", () => {
    it("faz parse do extrato do Inter com 4 linhas de preâmbulo, extração de período e descrição concatenada", () => {
      const buffer = readFileSync(join(fixturesDir, "inter-conta.csv"));
      const result = parseCsv(new Uint8Array(buffer));

      expect(result.layout).toBe("inter-conta");
      expect(result.period).toEqual({
        from: "2026-11-01",
        to: "2026-11-30",
      });
      expect(result.rows).toHaveLength(3);

      // Linha 1: Crédito de 1.200,00
      expect(result.rows[0]).toMatchObject({
        date: "2026-11-02",
        descriptionOriginal: "PIX RECEBIDO - CLIENTE ACME",
        descriptionNormalized: "PIX RECEBIDO CLIENTE ACME",
        amountCents: 120000,
      });

      // Linha 2: Débito de -650,00
      expect(result.rows[1]).toMatchObject({
        date: "2026-11-05",
        descriptionOriginal: "PAGAMENTO DE TITULO - CONDOMINIO RESIDENCIAL",
        descriptionNormalized: "PAGAMENTO DE TITULO CONDOMINIO RESIDENCIAL",
        amountCents: -65000,
      });

      // Linha 3: Débito de -1.500,00
      expect(result.rows[2]).toMatchObject({
        date: "2026-11-10",
        descriptionOriginal: "PAGAMENTO DE FATURA - FATURA INTER MASTER",
        descriptionNormalized: "PAGAMENTO DE FATURA FATURA INTER MASTER",
        amountCents: -150000,
      });
    });
  });

  describe("layout Nubank Conta Corrente", () => {
    it("faz parse do extrato da conta Nubank", () => {
      const buffer = readFileSync(join(fixturesDir, "nubank-conta.csv"));
      const result = parseCsv(new Uint8Array(buffer));

      expect(result.layout).toBe("nubank-conta");
      expect(result.rows).toHaveLength(3);

      expect(result.rows[0]).toMatchObject({
        date: "2026-11-01",
        amountCents: 350000,
        externalId: "id-001",
      });
      expect(result.rows[1]).toMatchObject({
        date: "2026-11-03",
        amountCents: -8990,
        externalId: "id-002",
      });
    });
  });

  describe("layout Nubank Cartão de Crédito", () => {
    it("faz parse do cartão Nubank invertendo compras para valores negativos", () => {
      const buffer = readFileSync(join(fixturesDir, "nubank-cartao.csv"));
      const result = parseCsv(new Uint8Array(buffer));

      expect(result.layout).toBe("nubank-cartao");
      expect(result.rows).toHaveLength(3);

      // Compras de R$ 32,50 e R$ 65,00 devem virar despesas (-3250 e -6500 centavos)
      expect(result.rows[0]).toMatchObject({
        date: "2026-11-02",
        descriptionOriginal: "UBER TRIP",
        amountCents: -3250,
      });
      expect(result.rows[1]).toMatchObject({
        date: "2026-11-04",
        descriptionOriginal: "IFOOD REFEICAO",
        amountCents: -6500,
      });
      // Pagamento de fatura (-1200.00 invertido para +120000 centavos)
      expect(result.rows[2]).toMatchObject({
        date: "2026-11-10",
        amountCents: 120000,
      });
    });
  });

  describe("mapeamento customizado (layout mapeado)", () => {
    it("processa com configuração de mapeamento manual", () => {
      const customCsv = [
        "Transacao_Data;Identificacao;Saida;Entrada",
        "15/11/2026;MERCADO XYZ;150,00;",
        "16/11/2026;PIX ENTRADA;;300,00",
      ].join("\n");

      const mapping: MappingConfig = {
        separator: ";",
        headerSignature: ["Transacao_Data", "Identificacao"],
        dateColumn: "Transacao_Data",
        dateFormat: "dd/mm/yyyy",
        descriptionColumns: ["Identificacao"],
        creditColumn: "Entrada",
        debitColumn: "Saida",
        decimal: ",",
      };

      const result = parseCsv(new TextEncoder().encode(customCsv), mapping);
      expect(result.layout).toBe("mapeado");
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.amountCents).toBe(-15000);
      expect(result.rows[1]?.amountCents).toBe(30000);
    });
  });

  describe("layout desconhecido", () => {
    it("retorna layout desconhecido com cabeçalhos e amostra para o fluxo needsMapping", () => {
      const unknownCsv = [
        "Data Operacao,Nome do Estabelecimento,Total Gasto",
        "2026-11-01,Farmacia Popular,45.90",
        "2026-11-02,Restaurante Bom Sabor,80.00",
      ].join("\n");

      const result = parseCsv(new TextEncoder().encode(unknownCsv));
      expect(result.layout).toBe("desconhecido");
      expect(result.headers).toEqual(["Data Operacao", "Nome do Estabelecimento", "Total Gasto"]);
      expect(result.sample).toHaveLength(2);
      expect(result.sample?.[0]).toEqual(["2026-11-01", "Farmacia Popular", "45.90"]);
    });
  });

  describe("tratamento de linhas inválidas", () => {
    it("gera warning para linhas malformadas sem interromper o restante do arquivo", () => {
      const csvWithBadRow = [
        "Data,Valor,Identificador,Descrição",
        "01/11/2026,100.00,id-1,Linha boa",
        "DATA_CORROMPIDA,invalido,id-2,Linha com erro",
        "03/11/2026,200.00,id-3,Outra linha boa",
      ].join("\n");

      const result = parseCsv(new TextEncoder().encode(csvWithBadRow));
      expect(result.layout).toBe("nubank-conta");
      expect(result.rows).toHaveLength(2);
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      expect(result.warnings[0]?.code).toBe("DATA_INVALIDA");
    });
  });
});
