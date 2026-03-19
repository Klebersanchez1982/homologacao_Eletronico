import React, { useMemo, useState } from "react";

export default function OSModule({ orders, setOrders, statuses, setSelectedOrder, setDraggedId, draggedId, priorityClass, isLate }) {
  const [statusFilter, setStatusFilter] = useState("Todas");

  const filtered = useMemo(() => {
    if (statusFilter === "Todas") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <section className="panel" style={{ margin: 22 }}>
      <div className="panel-header"><h3>Módulo Ordem de Serviço - Rotinas</h3></div>
      <div className="panel-body">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>Todas</option>
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginTop: 14 }}>
          {filtered.length === 0 ? <p>Nenhuma OS no filtro selecionado.</p> : (
            <div className="kanban-wrap">
              {statuses.map((status) => {
                const column = filtered.filter((o) => o.status === status);
                return (
                  <div key={status} className="kanban-column" onDragOver={(e) => e.preventDefault()} onDrop={() => draggedId && setOrders((prev) => prev.map((o) => o.id === draggedId ? { ...o, status } : o))}>
                    <div className="kanban-header"><h3>{status}</h3><span className="badge">{column.length}</span></div>
                    <div className="kanban-body">
                      {column.map((os) => (
                        <button key={os.id} className="os-card" draggable onDragStart={() => setDraggedId(os.id)} onDragEnd={() => setDraggedId(null)} onClick={() => setSelectedOrder(os)}>
                          {os.foto && (
                            <img src={os.foto} alt="Equipamento" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                          )}
                          <strong style={{ fontSize: 12 }}>{os.id}</strong><br />
                          <small style={{ color: '#657084', fontSize: 11 }}>{os.dataCriacao}</small><br />
                          <strong style={{ fontSize: 13 }}>{os.ativo}</strong><br />
                          <span style={{ fontSize: 12 }}>{os.cliente}</span><br />
                          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span className={priorityClass(os.prioridade)}>{os.prioridade}</span> 
                            <span style={{ fontSize: 11, color: '#657084' }}>{isLate(os.prazo, os.status) ? "Atrasada" : "No prazo"}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
