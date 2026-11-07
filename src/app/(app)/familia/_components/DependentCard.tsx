import { Button } from "@/components/ui/Button";

interface DependentCardProps {
  canManage: boolean;
  onAddClick: () => void;
}

export function DependentCard({ canManage, onAddClick }: DependentCardProps) {
  return (
    <div className="cc-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <h2 className="title">Dependente sem login</h2>
      <span className="body cc-muted">
        Para filhos ou quem não vai usar o app. As despesas dele ficam separadas, e você escolhe se
        ele entra na divisão.
      </span>
      {canManage && (
        <Button
          type="button"
          variant="secondary"
          onClick={onAddClick}
          aria-label="Adicionar dependente sem login"
        >
          Adicionar dependente
        </Button>
      )}
    </div>
  );
}
