import React, { useState } from "react";

export default function EstoqueModule({ items, setItems, requests }) {
  const [newItem, setNewItem] = useState({ codigo: "", descricao: "", local: "", saldo: 0, minimo: 0, fabricante: "" });

  function addItem() {
    if (!newItem.codigo || !newItem.descricao) return;
    setItems((prev) => [...prev, { ...newItem, saldo: Number(newItem.saldo), minimo: Number(newItem.minimo) }]);
    setNewItem({ codigo: "", descricao: "", local: "", saldo: 0, minimo: 0, fabricante: "" });
  }

  return (
    <section className="panel" style={{ margin: 22 }}>
      <div className="panel-header"><h3>Módulo Estoque - Rotinas</h3></div>
      <div className="panel-body">
        <div className="form-grid">
          <label className="field"><span>Código</span><input className="input" value={newItem.codigo} onChange={(e) => setNewItem((prev) => ({ ...prev, codigo: e.target.value }))} /></label>
          <label className="field"><span>Descrição</span><input className="input" value={newItem.descricao} onChange={(e) => setNewItem((prev) => ({ ...prev, descricao: e.target.value }))} /></label>
          <label className="field"><span>Local</span><input className="input" value={newItem.local} onChange={(e) => setNewItem((prev) => ({ ...prev, local: e.target.value }))} /></label>
          <label className="field"><span>Saldo</span><input className="input" type="number" value={newItem.saldo} onChange={(e) => setNewItem((prev) => ({ ...prev, saldo: e.target.value }))} /></label>
          <label className="field"><span>Mínimo</span><input className="input" type="number" value={newItem.minimo} onChange={(e) => setNewItem((prev) => ({ ...prev, minimo: e.target.value }))} /></label>
          <label className="field"><span>Fabricante</span><input className="input" value={newItem.fabricante} onChange={(e) => setNewItem((prev) => ({ ...prev, fabricante: e.target.value }))} /></label>
        </div>
        <button className="btn primary" onClick={addItem}>Adicionar item</button>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr><th>Código</th><th>Descrição</th><th>Local</th><th>Saldo</th><th>Mínimo</th><th>Fabricante</th></tr>
            </thead>
            <tbody>{items.map((item) => <tr key={item.codigo}><td>{item.codigo}</td><td>{item.descricao}</td><td>{item.local}</td><td>{item.saldo}</td><td>{item.minimo}</td><td>{item.fabricante}</td></tr>)}</tbody>
          </table>
        </div>

        <div style={{ marginTop: 20 }}>
          <div className="panel-header"><h3>Solicitações ao Estoque</h3></div>
          <div className="panel-body">
            {requests.map((r) => (
              <div key={r.id} className="card-soft" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong>{r.id}</strong>
                  <span className="badge">{r.status}</span>
                </div>
                <small>{r.solicitante} • {r.setor}</small>
                <div>{r.itens} item(ns)</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
