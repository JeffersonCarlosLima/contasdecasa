export function RoleTable() {
  return (
    <div className="cc-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <h2 className="title">O que cada papel pode fazer</h2>
      <div className="cc-tablebox" style={{ boxShadow: "none" }}>
        <table className="cc-table" style={{ minWidth: "520px" }}>
          <thead>
            <tr>
              <th scope="col">Papel</th>
              <th scope="col">Lançar e editar as próprias</th>
              <th scope="col">Editar as dos outros</th>
              <th scope="col">Membros, mês e cadastros</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" style={{ fontWeight: 600 }}>Dono</th>
              <td>Sim</td>
              <td>Sim</td>
              <td>Sim, e pode excluir a família</td>
            </tr>
            <tr>
              <th scope="row" style={{ fontWeight: 600 }}>Admin</th>
              <td>Sim</td>
              <td>Sim</td>
              <td>Sim</td>
            </tr>
            <tr>
              <th scope="row" style={{ fontWeight: 600 }}>Membro</th>
              <td>Sim</td>
              <td>Não</td>
              <td>Não</td>
            </tr>
            <tr>
              <th scope="row" style={{ fontWeight: 600 }}>Dependente</th>
              <td colSpan={3} className="cc-muted">
                Sem login; dono e admin lançam por ele
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
