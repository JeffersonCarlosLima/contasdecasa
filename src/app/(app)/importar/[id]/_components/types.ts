import type {
  BatchReviewData,
  BatchReviewSummary,
  ImportBatchListItem,
  ImportRowReviewItem,
} from "@/lib/import-queries";

export type {
  BatchReviewData,
  BatchReviewSummary,
  ImportBatchListItem,
  ImportRowReviewItem,
};

export type FilterStatus = "todas" | "novas" | "duplicadas" | "ignoradas";

export interface ReviewFiltersState {
  status: FilterStatus;
  search: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  color: string;
}

export interface MemberOption {
  id: string;
  displayName: string;
  color: string;
}
