import { MonthSwitcher } from "@/components/ui/MonthSwitcher";

interface DashboardHeaderProps {
  month: string;
  monthLabel: string;
  closed?: boolean;
}

export function DashboardHeader({ month, monthLabel, closed }: DashboardHeaderProps) {
  return (
    <div className="cc-top">
      <div className="cc-top__titles">
        <span className="label cc-muted">Visão do mês</span>
        <h1 className="display">{monthLabel}</h1>
      </div>
      <MonthSwitcher month={month} basePath="/" closed={closed} />
    </div>
  );
}
