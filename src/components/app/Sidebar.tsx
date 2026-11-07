import Link from "next/link";
import { MemberAvatar, type PersonColor } from "@/components/ui/MemberAvatar";
import {
  DashboardIcon,
  DespesasIcon,
  FamiliaIcon,
  FechamentoIcon,
  ImportarIcon,
  TiposIcon,
} from "./icons";
import { isExpenseFormRoute, isRouteActive } from "./nav-utils";

export interface SidebarProps {
  pathname: string;
  userName: string;
  userColor?: PersonColor;
  familyName: string;
  memberCount: number;
}

const DESKTOP_NAV_ITEMS = [
  { href: "/", label: "Dashboard", Icon: DashboardIcon },
  { href: "/despesas", label: "Despesas", Icon: DespesasIcon },
  { href: "/importar", label: "Importar", Icon: ImportarIcon },
  { href: "/mes", label: "Fechamento do mês", Icon: FechamentoIcon },
  { href: "/tipos", label: "Tipos e formas", Icon: TiposIcon },
  { href: "/familia", label: "Família", Icon: FamiliaIcon },
];

export function Sidebar({
  pathname,
  userName,
  userColor = "person-a",
  familyName,
  memberCount,
}: SidebarProps) {
  const isExpenseForm = isExpenseFormRoute(pathname);
  const memberLabel = memberCount === 1 ? "membro" : "membros";

  return (
    <aside className="cc-side">
      <div className="cc-logo">
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          Contas da Casa
        </Link>
      </div>

      <nav className="cc-nav" aria-label="Principal">
        {DESKTOP_NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isRouteActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>

      {!isExpenseForm && (
        <Link
          className="cc-btn cc-btn--primary"
          href="/despesas/nova"
          style={{ textDecoration: "none" }}
        >
          Lançar despesa
        </Link>
      )}

      <Link
        href="/conta"
        className="cc-side__foot focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2 hover:bg-[var(--surface-sunken)]"
        aria-label="Minha conta"
        aria-current={pathname === "/conta" ? "page" : undefined}
        style={{
          textDecoration: "none",
          color: "inherit",
          minHeight: 40,
          borderRadius: "var(--radius-md)",
        }}
      >
        <MemberAvatar name={userName} color={userColor} size="lg" />
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span
            className="label"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userName}
          </span>
          <span
            className="caption cc-muted"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {familyName} · {memberCount} {memberLabel}
          </span>
        </div>
      </Link>
    </aside>
  );
}
