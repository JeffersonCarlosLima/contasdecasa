import { cx } from "./cx";

export type PersonColor = "person-a" | "person-b" | "person-c" | "person-d";

const SUFFIX: Record<PersonColor, string> = { "person-a": "a", "person-b": "b", "person-c": "c", "person-d": "d" };

/** Avatar com inicial (cor nunca sozinha). `color="family"` = despesas da Família. */
export function MemberAvatar({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: PersonColor | "family";
  size?: "md" | "lg";
}) {
  const mod = color === "family" ? "family" : SUFFIX[color];
  return (
    <span className={cx("cc-avatar", `cc-avatar--${mod}`, size === "lg" && "cc-avatar--lg")} title={name} aria-hidden={color === "family" || undefined}>
      {color === "family" ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5 12 3l9 7.5V21H3z" />
        </svg>
      ) : (
        name.trim().charAt(0).toUpperCase()
      )}
    </span>
  );
}
