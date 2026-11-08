import type { MonthSummary, SplitResult, SplitRule, InvestMode } from "@/lib/calc";
import type { PersonColor } from "@/components/ui/MemberAvatar";

export interface MonthMemberItem {
  id: string;
  displayName: string;
  color: PersonColor | string;
  kinship: string;
  hasLogin: boolean;
  participatesInSplit: boolean;
  customPercent: number | null;
  salaryCents: number;
  extraCents: number;
}

export interface MonthCloseData {
  month: string;
  closed: boolean;
  investMode: InvestMode;
  investValue: number;
  investDestination: string | null;
  splitRule: SplitRule;
  members: MonthMemberItem[];
  summary: MonthSummary;
  split: SplitResult;
  recurring: {
    copied: boolean;
    names: string[];
  };
  previousMonthLabel: string;
}
