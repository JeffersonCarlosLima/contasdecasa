import Link from "next/link";
import { MemberAvatar, type PersonColor } from "@/components/ui/MemberAvatar";
import { BackChevronIcon } from "./icons";
import {
  getMobileHeaderTitle,
  isEditExpenseRoute,
  isExpenseFormRoute,
} from "./nav-utils";

export interface MobileHeaderProps {
  pathname: string;
  userName: string;
  userColor?: PersonColor;
}

export function MobileHeader({
  pathname,
  userName,
  userColor = "person-a",
}: MobileHeaderProps) {
  const isExpenseForm = isExpenseFormRoute(pathname);

  if (isExpenseForm) {
    const isEdit = isEditExpenseRoute(pathname);
    const title = isEdit ? "Editar despesa" : "Lançar despesa";

    return (
      <header className="cc-mtop">
        <Link
          href="/despesas"
          className="cc-month__btn"
          aria-label="Voltar"
          style={{ textDecoration: "none", minWidth: 40, minHeight: 40 }}
        >
          <BackChevronIcon />
        </Link>
        <span className="title">{title}</span>
        <span style={{ width: 40 }} aria-hidden="true" />
      </header>
    );
  }

  const title = getMobileHeaderTitle(pathname);

  return (
    <header className="cc-mtop">
      <span className="cc-logo" style={{ padding: 0, fontSize: "19px" }}>
        {title}
      </span>
      <MemberAvatar name={userName} color={userColor} size="lg" />
    </header>
  );
}
