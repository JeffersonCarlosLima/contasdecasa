import Link from "next/link";
import {
  DashboardIcon,
  DespesasIcon,
  FamiliaIcon,
  FechamentoIcon,
  PlusIcon,
} from "./icons";
import { isExpenseFormRoute, isRouteActive } from "./nav-utils";

export interface MobileBottomBarProps {
  pathname: string;
}

export function MobileBottomBar({ pathname }: MobileBottomBarProps) {
  if (isExpenseFormRoute(pathname)) {
    return null;
  }

  const isHomeActive = isRouteActive(pathname, "/");
  const isDespesasActive = isRouteActive(pathname, "/despesas");
  const isMesActive = isRouteActive(pathname, "/mes");
  const isFamiliaActive = isRouteActive(pathname, "/familia");

  return (
    <nav className="cc-bottom" aria-label="Principal">
      <Link href="/" aria-current={isHomeActive ? "page" : undefined}>
        <DashboardIcon />
        Início
      </Link>
      <Link
        href="/despesas"
        aria-current={isDespesasActive ? "page" : undefined}
      >
        <DespesasIcon />
        Despesas
      </Link>
      <Link
        className="cc-fab"
        href="/despesas/nova"
        aria-label="Lançar despesa"
      >
        <PlusIcon />
      </Link>
      <Link href="/mes" aria-current={isMesActive ? "page" : undefined}>
        <FechamentoIcon />
        Mês
      </Link>
      <Link
        href="/familia"
        aria-current={isFamiliaActive ? "page" : undefined}
      >
        <FamiliaIcon />
        Família
      </Link>
    </nav>
  );
}
