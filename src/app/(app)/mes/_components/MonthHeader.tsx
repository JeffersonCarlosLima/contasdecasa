import { MonthSwitcher } from "@/components/ui/MonthSwitcher";
import { getMonthHeading } from "./helpers";

interface MonthHeaderProps {
  month: string;
  closed?: boolean;
}

export function MonthHeader({ month, closed }: MonthHeaderProps) {
  const heading = getMonthHeading(month);

  return (
    <div className="cc-top">
      <div className="cc-top__titles">
        <h1 className="heading">{heading}</h1>
        <span className="body cc-muted">
          Informe a renda e quanto vão investir. O resto do app calcula a partir daqui.
        </span>
      </div>
      <MonthSwitcher month={month} basePath="/mes" closed={closed} />
    </div>
  );
}
