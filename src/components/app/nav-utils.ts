function sanitizePath(path: string): string {
  const [withoutQuery = "/"] = (path || "/").split("?");
  const [withoutHash = "/"] = withoutQuery.split("#");
  return withoutHash || "/";
}

export function isRouteActive(currentPath: string, routeHref: string): boolean {
  const cleanPath = sanitizePath(currentPath);

  if (routeHref === "/") {
    return cleanPath === "/";
  }

  return cleanPath === routeHref || cleanPath.startsWith(`${routeHref}/`);
}

export function isExpenseFormRoute(pathname: string): boolean {
  const cleanPath = sanitizePath(pathname);
  return (
    cleanPath === "/despesas/nova" ||
    (cleanPath.startsWith("/despesas/") && cleanPath !== "/despesas")
  );
}

export function isEditExpenseRoute(pathname: string): boolean {
  const cleanPath = sanitizePath(pathname);
  return isExpenseFormRoute(cleanPath) && cleanPath !== "/despesas/nova";
}

export function getMobileHeaderTitle(pathname: string): string {
  const cleanPath = sanitizePath(pathname);

  if (cleanPath === "/despesas/nova") {
    return "Lançar despesa";
  }
  if (isEditExpenseRoute(cleanPath)) {
    return "Editar despesa";
  }
  if (cleanPath === "/despesas" || cleanPath.startsWith("/despesas/")) {
    return "Despesas";
  }
  if (cleanPath === "/importar" || cleanPath.startsWith("/importar/")) {
    return "Importar extrato";
  }
  if (cleanPath === "/mes" || cleanPath.startsWith("/mes/")) {
    return "Fechamento";
  }
  if (cleanPath === "/tipos" || cleanPath.startsWith("/tipos/")) {
    return "Tipos e formas";
  }
  if (cleanPath === "/familia" || cleanPath.startsWith("/familia/")) {
    return "Família";
  }
  if (cleanPath === "/conta" || cleanPath.startsWith("/conta/")) {
    return "Minha conta";
  }

  return "Contas da Casa";
}
