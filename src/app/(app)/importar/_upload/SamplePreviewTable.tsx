"use client";

interface SamplePreviewTableProps {
  headers: string[];
  sample: string[][];
}

export function SamplePreviewTable({ headers, sample }: SamplePreviewTableProps) {
  if (!headers || headers.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <span className="caption cc-muted" style={{ fontWeight: 600 }}>
        Prévia das primeiras linhas do arquivo:
      </span>

      <div className="cc-tablebox">
        <table className="cc-table" aria-label="Prévia do extrato">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sample.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="cc-muted" style={{ textAlign: "center" }}>
                  Nenhuma linha de prévia disponível
                </td>
              </tr>
            ) : (
              sample.slice(0, 5).map((row, rIdx) => (
                <tr key={rIdx}>
                  {headers.map((_, cIdx) => (
                    <td key={cIdx}>{row[cIdx] ?? ""}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
