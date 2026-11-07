import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import * as schema from "@/db/schema";
import { futureInstallments } from "@/lib/calc/installments";
import { currentMonth } from "@/lib/dates";

export interface SeedUserData {
  name: string;
  email: string;
  password: string;
}

export interface SeedMemberData {
  userEmail?: string;
  displayName: string;
  role: "dono" | "admin" | "membro";
  kinship: "titular" | "conjuge" | "filho" | "outro";
  color: "person-a" | "person-b" | "person-c" | "person-d";
  participatesInSplit: boolean;
  salaryCents: number;
  extraCents: number;
}

export interface SeedExpenseDefinition {
  description: string;
  amountCents: number;
  categoryName: string;
  ownerName: string | null; // null = Família
  createdByName: string;
  dueDay: number;
  status: "pendente" | "pago";
  paidByName?: string;
  recurring?: boolean;
  notes?: string | null;
  installment?: {
    current: number;
    total: number;
  };
}

export const SEED_USERS: SeedUserData[] = [
  {
    name: "Jefferson",
    email: "jefferson@exemplo.com",
    password: "senha-dev-contas",
  },
  {
    name: "Lorrane",
    email: "lorrane@exemplo.com",
    password: "senha-dev-contas",
  },
];

export const SEED_FAMILY_NAME = "Família Lima";

export const SEED_MEMBERS: SeedMemberData[] = [
  {
    userEmail: "jefferson@exemplo.com",
    displayName: "Jefferson",
    role: "dono",
    kinship: "titular",
    color: "person-a",
    participatesInSplit: true,
    salaryCents: 500000,
    extraCents: 50000,
  },
  {
    userEmail: "lorrane@exemplo.com",
    displayName: "Lorrane",
    role: "admin",
    kinship: "conjuge",
    color: "person-b",
    participatesInSplit: true,
    salaryCents: 350000,
    extraCents: 0,
  },
  {
    displayName: "Filho(a)",
    role: "membro",
    kinship: "filho",
    color: "person-c",
    participatesInSplit: false,
    salaryCents: 0,
    extraCents: 0,
  },
];

export const SEED_CATEGORIES = [
  { name: "Moradia", color: "chart-1" as const, nature: "fixa" as const },
  { name: "Alimentação", color: "chart-2" as const, nature: "variavel" as const },
  { name: "Transporte", color: "chart-3" as const, nature: "variavel" as const },
  { name: "Cartões", color: "chart-4" as const, nature: "variavel" as const },
  { name: "Contas da casa", color: "chart-5" as const, nature: "fixa" as const },
  { name: "Saúde e academia", color: "chart-6" as const, nature: "fixa" as const },
];

export interface SeedPaymentMethodData {
  name: string;
  type: "cartao" | "conta" | "pix" | "dinheiro";
  ownerName: string | null;
  cardLast4?: string | null;
  closingDay?: number | null;
  dueDay?: number | null;
}

export const SEED_PAYMENT_METHODS: SeedPaymentMethodData[] = [
  {
    name: "Cartão Nubank",
    type: "cartao",
    ownerName: "Jefferson",
    cardLast4: "1234",
    closingDay: 5,
    dueDay: 15,
  },
  {
    name: "Conta Bradesco",
    type: "conta",
    ownerName: "Lorrane",
  },
  { name: "Cartão Bradesco", type: "cartao", ownerName: "Jefferson" },
  { name: "Cartão Inter", type: "cartao", ownerName: "Jefferson" },
  { name: "Conta Corrente", type: "conta", ownerName: null },
  { name: "Pix", type: "pix", ownerName: null },
];

export const SEED_EXPENSES: SeedExpenseDefinition[] = [
  {
    description: "Inter",
    amountCents: 50000,
    categoryName: "Cartões",
    ownerName: "Jefferson",
    createdByName: "Jefferson",
    dueDay: 10,
    status: "pendente",
  },
  {
    description: "Fatura Bradesco",
    amountCents: 249717,
    categoryName: "Cartões",
    ownerName: "Jefferson",
    createdByName: "Jefferson",
    dueDay: 12,
    status: "pendente",
    notes: "Inclui seguro do carro",
  },
  {
    description: "Manutenção do carro",
    amountCents: 25000,
    categoryName: "Transporte",
    ownerName: "Jefferson",
    createdByName: "Lorrane",
    dueDay: 20,
    status: "pendente",
  },
  {
    description: "Gasolina",
    amountCents: 60000,
    categoryName: "Transporte",
    ownerName: "Jefferson",
    createdByName: "Jefferson",
    dueDay: 30,
    status: "pendente",
    recurring: true,
  },
  {
    description: "Parcela do carro",
    amountCents: 108800,
    categoryName: "Transporte",
    ownerName: "Lorrane",
    createdByName: "Lorrane",
    dueDay: 3,
    status: "pendente",
    installment: { current: 7, total: 8 },
  },
  {
    description: "Aluguel",
    amountCents: 75000,
    categoryName: "Moradia",
    ownerName: null,
    createdByName: "Jefferson",
    dueDay: 5,
    recurring: true,
    status: "pago",
    paidByName: "Jefferson",
  },
  {
    description: "Internet",
    amountCents: 15000,
    categoryName: "Contas da casa",
    ownerName: null,
    createdByName: "Lorrane",
    dueDay: 8,
    recurring: true,
    status: "pago",
    paidByName: "Lorrane",
  },
  {
    description: "Água",
    amountCents: 15000,
    categoryName: "Contas da casa",
    ownerName: null,
    createdByName: "Lorrane",
    dueDay: 14,
    recurring: true,
    status: "pendente",
  },
  {
    description: "Energia",
    amountCents: 15000,
    categoryName: "Contas da casa",
    ownerName: null,
    createdByName: "Lorrane",
    dueDay: 15,
    recurring: true,
    status: "pendente",
  },
];

export interface BuiltSeedExpense {
  referenceMonth: string;
  description: string;
  amountCents: number;
  categoryName: string;
  ownerName: string | null;
  createdByName: string;
  dueDate: string;
  status: "pendente" | "pago";
  paidByName?: string;
  recurring?: boolean;
  notes?: string | null;
  installmentGroupId?: string;
  installmentNumber?: number;
  installmentTotal?: number;
}

/** Função pura para montar as despesas do mês e as parcelas futuras */
export function buildSeedExpenses(month: string): BuiltSeedExpense[] {
  const referenceMonth = `${month}-01`;
  const results: BuiltSeedExpense[] = [];

  for (const def of SEED_EXPENSES) {
    const padDay = String(def.dueDay).padStart(2, "0");
    const dueDate = `${month}-${padDay}`;

    if (def.installment) {
      const groupId = randomUUID();
      // Parcela do mês atual (ex: 7 de 8)
      results.push({
        referenceMonth,
        description: def.description,
        amountCents: def.amountCents,
        categoryName: def.categoryName,
        ownerName: def.ownerName,
        createdByName: def.createdByName,
        dueDate,
        status: def.status,
        installmentGroupId: groupId,
        installmentNumber: def.installment.current,
        installmentTotal: def.installment.total,
        notes: def.notes,
      });

      // Gera parcelas futuras (ex: 8 de 8)
      const futures = futureInstallments({
        dueDate,
        current: def.installment.current,
        total: def.installment.total,
      });

      for (const fut of futures) {
        results.push({
          referenceMonth: fut.referenceMonth,
          description: def.description,
          amountCents: def.amountCents,
          categoryName: def.categoryName,
          ownerName: def.ownerName,
          createdByName: def.createdByName,
          dueDate: fut.dueDate,
          status: "pendente",
          installmentGroupId: groupId,
          installmentNumber: fut.number,
          installmentTotal: fut.total,
          notes: def.notes,
        });
      }
    } else {
      results.push({
        referenceMonth,
        description: def.description,
        amountCents: def.amountCents,
        categoryName: def.categoryName,
        ownerName: def.ownerName,
        createdByName: def.createdByName,
        dueDate,
        status: def.status,
        paidByName: def.paidByName,
        recurring: def.recurring,
        notes: def.notes,
      });
    }
  }

  return results;
}

/** Execução principal do seed */
export async function runSeed(customDbUrl?: string) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed recusado: NODE_ENV está definido como production.");
  }

  const url = customDbUrl || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não definida. Veja .env.example.");
  }

  if (url.includes("rootflow.pro")) {
    throw new Error("Seed recusado: não execute seed contra o banco de produção.");
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  try {
    // Better Auth local com a conexão própria
    const auth = betterAuth({
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
          user: schema.user,
          session: schema.session,
          account: schema.account,
          verification: schema.verification,
        },
      }),
      secret: process.env.BETTER_AUTH_SECRET || "dev-seed-secret-must-be-at-least-32-chars",
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
      emailAndPassword: {
        enabled: true,
      },
    });

    console.log("1. Criando/verificando usuários via Better Auth...");
    const userMap = new Map<string, string>(); // email -> userId

    for (const u of SEED_USERS) {
      const [existing] = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.email, u.email))
        .limit(1);

      if (existing) {
        userMap.set(u.email, existing.id);
        console.log(`   Usuário já existe: ${u.email} (${existing.id})`);
      } else {
        const res = await auth.api.signUpEmail({
          body: {
            name: u.name,
            email: u.email,
            password: u.password,
          },
        });
        userMap.set(u.email, res.user.id);
        console.log(`   Usuário criado: ${u.email} (${res.user.id})`);
      }
    }

    const jeffersonUserId = userMap.get("jefferson@exemplo.com");
    if (!jeffersonUserId) throw new Error("Usuário Jefferson não encontrado.");

    console.log("2. Criando/verificando Família...");
    let familyId: string;
    const [existingFamily] = await db
      .select()
      .from(schema.families)
      .where(eq(schema.families.name, SEED_FAMILY_NAME))
      .limit(1);

    if (existingFamily) {
      familyId = existingFamily.id;
      console.log(`   Família já existe: ${SEED_FAMILY_NAME} (${familyId})`);
    } else {
      const [created] = await db
        .insert(schema.families)
        .values({
          name: SEED_FAMILY_NAME,
          defaultSplitRule: "proporcional",
          createdBy: jeffersonUserId,
        })
        .returning();
      if (!created) throw new Error("Falha ao criar família.");
      familyId = created.id;
      console.log(`   Família criada: ${SEED_FAMILY_NAME} (${familyId})`);
    }

    console.log("3. Criando/verificando membros...");
    const memberMap = new Map<string, string>(); // displayName -> memberId

    for (const m of SEED_MEMBERS) {
      const userId = m.userEmail ? userMap.get(m.userEmail) ?? null : null;
      const [existingMember] = await db
        .select()
        .from(schema.familyMembers)
        .where(
          and(
            eq(schema.familyMembers.familyId, familyId),
            eq(schema.familyMembers.displayName, m.displayName),
          ),
        )
        .limit(1);

      if (existingMember) {
        memberMap.set(m.displayName, existingMember.id);
        console.log(`   Membro já existe: ${m.displayName}`);
      } else {
        const [created] = await db
          .insert(schema.familyMembers)
          .values({
            familyId,
            userId,
            displayName: m.displayName,
            role: m.role,
            kinship: m.kinship,
            color: m.color,
            participatesInSplit: m.participatesInSplit,
            status: "ativo",
          })
          .returning();
        if (!created) throw new Error(`Falha ao criar membro ${m.displayName}`);
        memberMap.set(m.displayName, created.id);
        console.log(`   Membro criado: ${m.displayName}`);
      }
    }

    console.log("4. Criando/verificando categorias padrão...");
    const categoryMap = new Map<string, string>(); // name -> categoryId

    for (const cat of SEED_CATEGORIES) {
      const [existingCat] = await db
        .select()
        .from(schema.categories)
        .where(
          and(
            eq(schema.categories.familyId, familyId),
            eq(schema.categories.name, cat.name),
          ),
        )
        .limit(1);

      if (existingCat) {
        categoryMap.set(cat.name, existingCat.id);
      } else {
        const [created] = await db
          .insert(schema.categories)
          .values({
            familyId,
            name: cat.name,
            color: cat.color,
            nature: cat.nature,
          })
          .returning();
        if (!created) throw new Error(`Falha ao criar categoria ${cat.name}`);
        categoryMap.set(cat.name, created.id);
      }
    }

    console.log("5. Criando/verificando formas de pagamento...");
    const paymentMap = new Map<string, string>(); // name -> methodId

    for (const pm of SEED_PAYMENT_METHODS) {
      const [existingPm] = await db
        .select()
        .from(schema.paymentMethods)
        .where(
          and(
            eq(schema.paymentMethods.familyId, familyId),
            eq(schema.paymentMethods.name, pm.name),
          ),
        )
        .limit(1);

      if (existingPm) {
        paymentMap.set(pm.name, existingPm.id);
      } else {
        const ownerId = pm.ownerName ? memberMap.get(pm.ownerName) ?? null : null;
        const [created] = await db
          .insert(schema.paymentMethods)
          .values({
            familyId,
            name: pm.name,
            type: pm.type,
            ownerMemberId: ownerId,
            archived: false,
            cardLast4: pm.cardLast4 ?? null,
            closingDay: pm.closingDay ?? null,
            dueDay: pm.dueDay ?? null,
          })
          .returning();
        if (!created) throw new Error(`Falha ao criar forma de pagamento ${pm.name}`);
        paymentMap.set(pm.name, created.id);
      }
    }

    console.log("6. Criando/verificando período mensal e rendas...");
    const month = currentMonth();
    const referenceMonthDate = `${month}-01`;

    let periodId: string;
    const [existingPeriod] = await db
      .select()
      .from(schema.monthlyPeriods)
      .where(
        and(
          eq(schema.monthlyPeriods.familyId, familyId),
          eq(schema.monthlyPeriods.month, referenceMonthDate),
        ),
      )
      .limit(1);

    if (existingPeriod) {
      periodId = existingPeriod.id;
      console.log(`   Período já existe para ${month}`);
    } else {
      const [created] = await db
        .insert(schema.monthlyPeriods)
        .values({
          familyId,
          month: referenceMonthDate,
          investMode: "valor",
          investValue: 150000, // R$ 1.500,00
          investDestination: "Tesouro Direto / Reserva",
          splitRule: "proporcional",
        })
        .returning();
      if (!created) throw new Error("Falha ao criar período mensal");
      periodId = created.id;
      console.log(`   Período criado para ${month}`);
    }

    for (const m of SEED_MEMBERS) {
      const memberId = memberMap.get(m.displayName);
      if (!memberId) continue;

      const [existingIncome] = await db
        .select()
        .from(schema.memberIncomes)
        .where(
          and(
            eq(schema.memberIncomes.periodId, periodId),
            eq(schema.memberIncomes.memberId, memberId),
          ),
        )
        .limit(1);

      if (!existingIncome) {
        await db.insert(schema.memberIncomes).values({
          familyId,
          periodId,
          memberId,
          salaryCents: m.salaryCents,
          extraCents: m.extraCents,
        });
      }
    }

    console.log("7. Criando/verificando despesas recorrentes e despesas do protótipo...");
    // 7.1 Cadastrar recorrentes na tabela recurringExpenses
    const recurringMap = new Map<string, string>(); // description -> recurringId
    for (const def of SEED_EXPENSES.filter((e) => e.recurring)) {
      const catId = categoryMap.get(def.categoryName);
      if (!catId) continue;
      const ownerId = def.ownerName ? memberMap.get(def.ownerName) ?? null : null;

      const [existingRec] = await db
        .select()
        .from(schema.recurringExpenses)
        .where(
          and(
            eq(schema.recurringExpenses.familyId, familyId),
            eq(schema.recurringExpenses.description, def.description),
          ),
        )
        .limit(1);

      if (existingRec) {
        recurringMap.set(def.description, existingRec.id);
      } else {
        const [created] = await db
          .insert(schema.recurringExpenses)
          .values({
            familyId,
            description: def.description,
            amountCents: def.amountCents,
            categoryId: catId,
            ownerMemberId: ownerId,
            dueDay: def.dueDay,
            active: true,
          })
          .returning();
        if (created) recurringMap.set(def.description, created.id);
      }
    }

    // 7.2 Cadastrar despesas do mês e parcelas futuras
    const builtExpenses = buildSeedExpenses(month);

    for (const exp of builtExpenses) {
      const catId = categoryMap.get(exp.categoryName);
      if (!catId) continue;

      const ownerId = exp.ownerName ? memberMap.get(exp.ownerName) ?? null : null;
      const createdById = memberMap.get(exp.createdByName) ?? jeffersonUserId;
      const paidById = exp.paidByName ? memberMap.get(exp.paidByName) ?? null : null;
      const recId = exp.recurring ? recurringMap.get(exp.description) ?? null : null;

      const [existingExp] = await db
        .select()
        .from(schema.expenses)
        .where(
          and(
            eq(schema.expenses.familyId, familyId),
            eq(schema.expenses.referenceMonth, exp.referenceMonth),
            eq(schema.expenses.description, exp.description),
            exp.installmentNumber
              ? eq(schema.expenses.installmentNumber, exp.installmentNumber)
              : undefined,
          ),
        )
        .limit(1);

      if (!existingExp) {
        await db.insert(schema.expenses).values({
          familyId,
          referenceMonth: exp.referenceMonth,
          description: exp.description,
          amountCents: exp.amountCents,
          categoryId: catId,
          ownerMemberId: ownerId,
          createdByMemberId: createdById,
          dueDate: exp.dueDate,
          status: exp.status,
          paidAt: exp.status === "pago" ? new Date(`${exp.dueDate}T12:00:00Z`) : null,
          paidByMemberId: paidById,
          installmentGroupId: exp.installmentGroupId ?? null,
          installmentNumber: exp.installmentNumber ?? null,
          installmentTotal: exp.installmentTotal ?? null,
          recurringId: recId,
          notes: exp.notes ?? null,
        });
      }
    }

    console.log("Seed finalizado com sucesso!");
  } finally {
    await pool.end();
  }
}

// Execução direta via CLI (pnpm db:seed)
if (process.argv[1]?.endsWith("seed.ts")) {
  runSeed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
