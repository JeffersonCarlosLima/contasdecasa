import type { ImportRowReviewItem } from "./types";

export type SituationType = ImportRowReviewItem["situation"];

export interface SituationBadgeProps {
  situation: SituationType;
}

/**
 * Badge contextual para a situação de linhas do extrato (Nova, Possível vínculo, Duplicada).
 * Mantém o contrato do design system com ícone + palavra.
 */
export function SituationBadge({ situation }: SituationBadgeProps) {
  if (situation === "duplicada") {
    return (
      <span className="cc-badge cc-badge--late">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
        Duplicada
      </span>
    );
  }

  if (situation === "possivel_vinculo") {
    return (
      <span className="cc-badge cc-badge--pending">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        Possível vínculo
      </span>
    );
  }

  return (
    <span className="cc-badge cc-badge--paid">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      Nova
    </span>
  );
}
