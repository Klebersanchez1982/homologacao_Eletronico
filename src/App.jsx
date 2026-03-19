import React, { useEffect, useMemo, useState, useRef } from "react";
import OSModule from "./modules/OSModule";
import EstoqueModule from "./modules/EstoqueModule";

const ORDERS_STORAGE_KEY = "manutex:orders";
function loadOrders() {
  try {
    const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadSession() {
  try {
    const saved = localStorage.getItem("manutex:session");
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

const initialStatuses = [
  "Triagem",
  "Aberta",
  "Aguardando Aprovação",
  "Aprovada",
  "Em Execução",
  "Aguardando Peças",
  "Em Laboratório",
  "Concluída",
  "Faturada",
  "Cancelada",
];

const initialOrders = [
  {
    id: "OS-2026-001",
    cliente: "Metalúrgica Atlas",
    ativo: "Torno CNC Romi GL 240",
    tecnico: "Carlos Silva",
    prioridade: "Alta",
    prazo: "2026-03-20",
    status: "Em Execução",
    categoria: "Corretiva",
    descricao: "Ruído anormal no eixo principal e falha intermitente no painel.",
    horas: 4.5,
    pecas: [
      { item: "Rolamento 6205", qtd: 2 },
      { item: "Sensor Indutivo M12", qtd: 1 },
    ],
  },
  {
    id: "OS-2026-002",
    cliente: "Usinagem Prime",
    ativo: "Centro de Usinagem VF-2",
    tecnico: "João Lima",
    prioridade: "Média",
    prazo: "2026-03-21",
    status: "Triagem",
    categoria: "Preventiva",
    descricao: "Checklist semestral e inspeção de lubrificação.",
    horas: 2,
    pecas: [],
  },
  {
    id: "OS-2026-003",
    cliente: "Corte Laser BR",
    ativo: "Prensa Hidráulica PH-80",
    tecnico: "Ana Souza",
    prioridade: "Crítica",
    prazo: "2026-03-18",
    status: "Aguardando Peças",
    categoria: "Corretiva",
    descricao: "Vazamento em linha hidráulica e necessidade de kit de vedação.",
    horas: 1.5,
    pecas: [{ item: "Kit Vedação PH-80", qtd: 1 }],
  },
  {
    id: "OS-2026-004",
    cliente: "Mecânica União",
    ativo: "Compressor Schulz SRP 4015",
    tecnico: "Carlos Silva",
    prioridade: "Baixa",
    prazo: "2026-03-25",
    status: "Aberta",
    categoria: "Instalação",
    descricao: "Instalação inicial e parametrização básica.",
    horas: 0,
    pecas: [],
  },
];

const initialItems = [
  { codigo: "ITM-001", descricao: "Rolamento 6205", unidade: "UN", local: "A1-02", saldo: 18, minimo: 8, fabricante: "SKF" },
  { codigo: "ITM-002", descricao: "Sensor Indutivo M12", unidade: "UN", local: "B3-04", saldo: 3, minimo: 5, fabricante: "Sick" },
  { codigo: "ITM-003", descricao: "Kit Vedação PH-80", unidade: "KIT", local: "C2-01", saldo: 0, minimo: 2, fabricante: "Parker" },
  { codigo: "ITM-004", descricao: "Óleo Hidráulico ISO 68", unidade: "LT", local: "Q1-01", saldo: 42, minimo: 20, fabricante: "Mobil" },
];

const initialRequests = [
  { id: "SOL-001", solicitante: "Carlos Silva", setor: "Campo", status: "Aberta", itens: 2 },
  { id: "SOL-002", solicitante: "Ana Souza", setor: "Laboratório", status: "Em Separação", itens: 1 },
  { id: "SOL-003", solicitante: "João Lima", setor: "Campo", status: "Atendida", itens: 3 },
];

const navItems = [
  { key: "welcome", label: "Início", perms: ["all"] },
  { key: "dashboard", label: "Dashboard", perms: ["all"] },
  { key: "cadastros", label: "Cadastros", perms: ["admin", "manager"] },
  { key: "permissoes", label: "Permissões", perms: ["admin"] },
  { key: "os-module", label: "Módulo OS", perms: ["all"] },
  { key: "estoque-module", label: "Módulo Estoque", perms: ["all"] },
  { key: "parametrizacoes", label: "Parametrizações", perms: ["admin"] },
  { key: "tecnicos", label: "Técnico", perms: ["all"] },
];

function isLate(prazo, status) {
  if (["Concluída", "Faturada", "Cancelada"].includes(status)) return false;
  const deadline = new Date(prazo + "T23:59:59");
  const now = new Date("2026-03-18T12:00:00");
  return deadline < now;
}

function priorityClass(prioridade) {
  if (prioridade === "Crítica") return "badge danger";
  if (prioridade === "Alta") return "badge primary";
  if (prioridade === "Média") return "badge warning";
  return "badge";
}

export default function App() {
  const [activeView, setActiveView] = useState("welcome");
  const [statuses] = useState(initialStatuses);
  const [orders, setOrders] = useState(() => loadOrders() || initialOrders);
  const [items, setItems] = useState(initialItems);
  const [requests] = useState(initialRequests);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("prazo");
  const [session, setSession] = useState(() => loadSession() || null);
  const permissions = {
    admin: ["all", "manage_users", "manage_cadastros"],
    manager: ["all", "manage_os"],
    operator: ["read_os", "read_estoque"],
  };

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [triagemOpen, setTriagemOpen] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [triagem, setTriagem] = useState({
    cliente: "",
    equipamento: "",
    serie: "",
    prioridade: "Média",
    categoria: "Corretiva",
    descricao: "",
    fotos: [],
  });
  const [newOrder, setNewOrder] = useState({
    cliente: "",
    ativo: "",
    prioridade: "Média",
    prazo: "",
    status: "Aberta",
    categoria: "Corretiva",
    descricao: "",
    foto: null,
  });

  function login(username, password) {
    const users = {
      admin: { nome: "Admin", role: "admin", senha: "admin" },
      manager: { nome: "Gerente", role: "manager", senha: "manager" },
      operator: { nome: "Operador", role: "operator", senha: "operator" },
    };
    const user = users[username];
    if (user && user.senha === password) {
      setSession({ nome: user.nome, role: user.role });
      setActiveView("welcome");
      return true;
    }
    return false;
  }

  function logout() {
    setSession(null);
    setActiveView("welcome");
  }

  useEffect(() => {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (session) localStorage.setItem("manutex:session", JSON.stringify(session));
    else localStorage.removeItem("manutex:session");
  }, [session]);

  const filteredOrders = useMemo(() => {
    const q = query.toLowerCase().trim();
    let filtered = orders;
    if (q) {
      filtered = orders.filter((os) =>
        [os.id, os.cliente, os.ativo, os.status, os.categoria]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    if (sortBy === "prazo") {
      filtered = [...filtered].sort((a, b) => new Date(a.prazo) - new Date(b.prazo));
    } else if (sortBy === "prioridade") {
      const order = { Crítica: 0, Alta: 1, Média: 2, Baixa: 3 };
      filtered = [...filtered].sort((a, b) => (order[a.prioridade] ?? 99) - (order[b.prioridade] ?? 99));
    }
    return filtered;
  }, [orders, query, sortBy]);

  const stats = useMemo(() => {
    const abertas = orders.filter((o) => !["Concluída", "Faturada", "Cancelada"].includes(o.status)).length;
    const atrasadas = orders.filter((o) => isLate(o.prazo, o.status)).length;
    const estoqueBaixo = items.filter((i) => i.saldo <= i.minimo).length;
    const pendentes = requests.filter((r) => ["Aberta", "Em Separação"].includes(r.status)).length;
    return { abertas, atrasadas, estoqueBaixo, pendentes };
  }, [orders, items, requests]);

  function moveOrder(orderId, newStatus) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
  }

  function createOrder() {
    const next = {
      id: `OS-2026-${String(orders.length + 1).padStart(3, "0")}`,
      ...newOrder,
      horas: 0,
      pecas: [],
    };
    setOrders((prev) => [next, ...prev]);
    setNewOrderOpen(false);
    setNewOrder({
      cliente: "",
      ativo: "",
      prioridade: "Média",
      prazo: "",
      status: "Aberta",
      categoria: "Corretiva",
      descricao: "",
    });
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      alert("Erro ao acessar a câmera: " + error.message);
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    try {
      const context = canvas.getContext("2d");
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL("image/jpeg", 0.9);
        setTriagem(prev => ({ ...prev, fotos: [...prev.fotos, { id: Date.now(), data: photoData }] }));
        alert("Foto capturada com sucesso!");
      } else {
        alert("Câmera não está pronta. Tente novamente.");
      }
    } catch (error) {
      alert("Erro ao capturar foto: " + error.message);
    }
  }

  function handleFileUpload(e) {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setTriagem(prev => ({
            ...prev,
            fotos: [...prev.fotos, { id: Date.now() + Math.random(), data: event.target.result }]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function removeFoto(id) {
    setTriagem(prev => ({
      ...prev,
      fotos: prev.fotos.filter(f => f.id !== id)
    }));
  }

  function finalizarTriagem() {
    if (!triagem.cliente || !triagem.equipamento) {
      alert("Preencha cliente e equipamento!");
      return;
    }

    const now = new Date();
    const dia = String(now.getDate()).padStart(2, "0");
    const mes = String(now.getMonth() + 1).padStart(2, "0");
    const ano = now.getFullYear();
    const hora = String(now.getHours()).padStart(2, "0");
    const minuto = String(now.getMinutes()).padStart(2, "0");
    const osId = `OS-${dia}${mes}${ano}-${hora}${minuto}`;
    const dataHora = now.toLocaleString("pt-BR");

    const novaOS = {
      id: osId,
      cliente: triagem.cliente,
      ativo: triagem.equipamento,
      serie: triagem.serie,
      tecnico: "A definir",
      prioridade: triagem.prioridade,
      prazo: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "Triagem",
      categoria: triagem.categoria,
      descricao: triagem.descricao,
      horas: 0,
      pecas: [],
      fotos: triagem.fotos.map(f => f.data),
      dataCriacao: dataHora,
    };

    setOrders((prev) => [novaOS, ...prev]);
    setTriagem({
      cliente: "",
      equipamento: "",
      serie: "",
      prioridade: "Média",
      categoria: "Corretiva",
      descricao: "",
      foto: null,
    });
    stopCamera();
    setTriagemOpen(false);
    alert("Triagem registrada! OS criada com sucesso.");
  }

  if (!session) {
    return (
      <div className="app-shell" style={{ minHeight: '100vh', gridTemplateColumns: '1fr' }}>
        <main className="content" style={{ padding: 22 }}>
          <section className="panel" style={{ maxWidth: 420, margin: '60px auto' }}>
            <div className="panel-header"><h3>Login</h3></div>
            <div className="panel-body" style={{ display: 'grid', gap: 8 }}>
              <label className="field"><span>Usuário</span><input className="input" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} /></label>
              <label className="field"><span>Senha</span><input className="input" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} /></label>
              <button className="btn primary" onClick={() => {
                const ok = login(loginUsername, loginPassword);
                if (!ok) setLoginError("Usuário ou senha incorretos");
              }}>Entrar</button>
              {loginError && <div style={{ color: 'red' }}>{loginError}</div>}
              <small>Use admin/admin, manager/manager, operator/operator</small>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>Manutex OS & Estoque</h1>
          <p>ERP industrial em Kanban</p>
        </div>
        <nav className="menu">
          {navItems.filter((item) => item.perms.includes(session.role) || item.perms.includes("all")).map((item) => (
            <button
              key={item.key}
              className={activeView === item.key ? "menu-item active" : "menu-item"}
              onClick={() => setActiveView(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 22px' }}>
          <div>
            <small>Usuário:</small>
            <strong style={{ marginLeft: 5 }}>{session.nome} ({session.role})</strong>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={logout}>Logout</button>
          </div>
        </div>
        <header className="topbar">
          <div>
            <h2>Sistema de Serviços com Estoque</h2>
            <p>Controle de ordens de serviço, ativos, estoque e solicitações.</p>
          </div>
          <div className="topbar-actions">
            <input
              className="input search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar OS, cliente, ativo ou técnico..."
            />
            <select className="input" style={{maxWidth: '180px'}} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="prazo">Ordenar por prazo</option>
              <option value="prioridade">Ordenar por prioridade</option>
            </select>
            {activeView === "os-module" && (
              <button className="btn primary" onClick={() => setNewOrderOpen(true)}>+ Nova OS</button>
            )}
          </div>
        </header>

        {activeView === "welcome" && (
          <section className="panel" style={{ margin: '22px', padding: '20px' }}>
            <div className="panel-header"><h3>Bem-vindo ao Manutex OS & Estoque</h3></div>
            <div className="panel-body">
              <p>Use o menu para acessar o Kanban, estoque e solicitações. Suas ordens de serviço são salvas automaticamente no navegador.</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn primary" onClick={() => setTriagemOpen(true)}>🔍 Nova Triagem</button>
                <button className="btn" onClick={() => setActiveView('os-module')}>📋 Ver Kanban OS</button>
                <button className="btn" onClick={() => setActiveView('estoque-module')}>📦 Ver Estoque</button>
                <button className="btn" onClick={() => setActiveView('dashboard')}>📊 Dashboard</button>
              </div>
            </div>
          </section>
        )}

        <section className="stats-grid">
          <StatCard title="OS abertas" value={stats.abertas} />
          <StatCard title="OS atrasadas" value={stats.atrasadas} />
          <StatCard title="Itens em estoque baixo" value={stats.estoqueBaixo} />
          <StatCard title="Solicitações pendentes" value={stats.pendentes} />
        </section>

        {activeView === "dashboard" && (
          <section className="two-col">
            <div className="panel">
              <div className="panel-header"><h3>Resumo operacional</h3></div>
              <div className="panel-body stack">
                {statuses.map((status) => {
                  const total = orders.filter((o) => o.status === status).length;
                  return (
                    <div key={status} className="row-card">
                      <span>{status}</span>
                      <span className="badge">{total}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="panel">
              <div className="panel-header"><h3>Alertas de estoque</h3></div>
              <div className="panel-body stack">
                {items.filter((i) => i.saldo <= i.minimo).map((item) => (
                  <div key={item.codigo} className="card-soft">
                    <strong>{item.descricao}</strong>
                    <small>Saldo: {item.saldo} | Mínimo: {item.minimo} | Local: {item.local}</small>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeView === "os-module" && (
          <OSModule
            orders={orders}
            setOrders={setOrders}
            statuses={statuses}
            setSelectedOrder={setSelectedOrder}
            setDraggedId={setDraggedId}
            draggedId={draggedId}
            priorityClass={priorityClass}
            isLate={isLate}
            setNewOrderOpen={setNewOrderOpen}
          />
        )}

        {activeView === "estoque-module" && (
          <EstoqueModule items={items} setItems={setItems} requests={requests} />
        )}




        {activeView === "tecnicos" && (
          <section className="card-grid">
            {[
              { nome: "Carlos Silva", esp: "CNC / Campo", status: "Em atendimento" },
              { nome: "Ana Souza", esp: "Hidráulica / Laboratório", status: "Em laboratório" },
              { nome: "João Lima", esp: "Preventiva / Campo", status: "Disponível" },
            ].map((tec) => (
              <div key={tec.nome} className="panel">
                <div className="panel-body">
                  <strong>{tec.nome}</strong>
                  <p>{tec.esp}</p>
                  <span className="badge">{tec.status}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {activeView === "cadastros" && (
          <section className="card-grid">
            {[
              "Clientes",
              "Ativos",
              "Técnicos",
              "Categorias de OS",
              "Fornecedores",
              "Almoxarifados / Locais",
              "Itens de estoque",
            ].map((cad) => (
              <div key={cad} className="panel">
                <div className="panel-body">
                  <strong>{cad}</strong>
                  <p>Cadastro base para parametrização do sistema.</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {activeView === "permissoes" && (
          <section style={{ padding: '0 22px 22px' }}>
            <div className="panel">
              <div className="panel-header"><h3>Gestão de Permissões</h3></div>
              <div className="panel-body stack">
                <div className="row-card">
                  <div><strong>Perfis</strong></div>
                  <div>admin, manager, operator</div>
                </div>
                <div className="row-card">
                  <div><strong>Regra</strong></div>
                  <div>admin: acesso total; manager: OS + cadastros; operator: leitura</div>
                </div>
                <div className="row-card">
                  <div><strong>Usuários do sistema</strong></div>
                  <div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      <li>admin (Administrador)</li>
                      <li>manager (Gerente)</li>
                      <li>operator (Operador)</li>
                    </ul>
                  </div>
                </div>
                <div className="row-card">
                  <div><strong>Notificação</strong></div>
                  <div>Somente admin cria/edita perfis e permissões</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeView === "parametrizacoes" && (
          <section className="two-col" style={{ padding: '0 22px 22px' }}>
            <div className="panel">
              <div className="panel-header"><h3>Parâmetros do Sistema</h3></div>
              <div className="panel-body">
                <div className="row-card">
                  <div><strong>Data de corte de prazo</strong></div>
                  <div>2026-03-18</div>
                </div>
                <div className="row-card">
                  <div><strong>Permissões de criação de OS</strong></div>
                  <div>admin, manager</div>
                </div>
                <div className="row-card">
                  <div><strong>Política de estoque mínimo</strong></div>
                  <div>{"Saldo <= mínimo => alerta"}</div>
                </div>
              </div>
            </div>
            <div className="panel">
              <div className="panel-header"><h3>Configurações de usuários</h3></div>
              <div className="panel-body stack">
                <div className="row-card">Usuário Admin: acesso total</div>
                <div className="row-card">Gerente: acesso a OS e parâmetros</div>
                <div className="row-card">Operador: acesso leitura</div>
              </div>
            </div>
          </section>
        )}
      </main>

      {triagemOpen && (
        <div className="modal-backdrop" onClick={() => {
          setTriagemOpen(false);
          stopCamera();
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>📋 Nova Triagem</h3>
              <button className="btn" onClick={() => {
                setTriagemOpen(false);
                stopCamera();
              }}>✕</button>
            </div>

            <div style={{ padding: '24px', display: 'grid', gap: 12 }}>
              {/* Formulário */}
              <label className="field">
                <input
                  className="input"
                  value={triagem.cliente}
                  onChange={(e) => setTriagem({ ...triagem, cliente: e.target.value })}
                  placeholder="Cliente - Ex: Metalúrgica Atlas"
                />
              </label>
              <label className="field">
                <input
                  className="input"
                  value={triagem.equipamento}
                  onChange={(e) => setTriagem({ ...triagem, equipamento: e.target.value })}
                  placeholder="Equipamento - Ex: Torno CNC"
                />
              </label>
              <label className="field">
                <input
                  className="input"
                  value={triagem.serie}
                  onChange={(e) => setTriagem({ ...triagem, serie: e.target.value })}
                  placeholder="Série/Modelo - Ex: GL-240"
                />
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label className="field">
                  <select
                    className="input"
                    value={triagem.prioridade}
                    onChange={(e) => setTriagem({ ...triagem, prioridade: e.target.value })}
                  >
                    <option>Prioridade</option>
                    <option>Baixa</option>
                    <option>Média</option>
                    <option>Alta</option>
                    <option>Crítica</option>
                  </select>
                </label>
                <label className="field">
                  <select
                    className="input"
                    value={triagem.categoria}
                    onChange={(e) => setTriagem({ ...triagem, categoria: e.target.value })}
                  >
                    <option>Categoria</option>
                    <option>Corretiva</option>
                    <option>Preventiva</option>
                    <option>Instalação</option>
                  </select>
                </label>
              </div>

              <label className="field">
                <textarea
                  className="input"
                  value={triagem.descricao}
                  onChange={(e) => setTriagem({ ...triagem, descricao: e.target.value })}
                  placeholder="Descrição do Problema"
                  style={{ minHeight: 70, resize: 'none' }}
                />
              </label>

              {/* Câmera e Foto */}
              {!cameraActive ? (
                <div>
                  {triagem.foto ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                      <img
                        src={triagem.foto}
                        alt="Capturada"
                        style={{
                          width: "100%",
                          borderRadius: 10,
                          maxHeight: 180,
                          objectFit: "cover",
                        }}
                      />
                      <button
                        className="btn"
                        onClick={() => setTriagem({ ...triagem, foto: null })}
                        style={{ width: "100%" }}
                      >
                        ✕ Remover Foto
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
                      <button
                        className="btn primary"
                        onClick={startCamera}
                        style={{ width: "100%" }}
                      >
                        📷 Capturar
                      </button>
                      <button
                        className="btn"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ width: "100%" }}
                      >
                        📁 Upload
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: "none" }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: "100%",
                      borderRadius: 10,
                      backgroundColor: "#000",
                      maxHeight: 180,
                    }}
                  />
                  <div style={{ display: "grid", gap: 10, gridTemplateColumns: '1fr 1fr' }}>
                    <button
                      className="btn primary"
                      onClick={capturePhoto}
                      style={{ width: "100%" }}
                    >
                      📸 Capturar
                    </button>
                    <button
                      className="btn"
                      onClick={stopCamera}
                      style={{ width: "100%" }}
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>

            <div style={{ padding: '20px 24px', borderTop: '1px solid #ddd', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                className="btn primary"
                onClick={finalizarTriagem}
                style={{ fontWeight: 'bold' }}
              >
                ✓ Salvar
              </button>
              <button
                className="btn"
                onClick={() => {
                  setTriagemOpen(false);
                  stopCamera();
                  setTriagem({
                    cliente: "",
                    equipamento: "",
                    serie: "",
                    prioridade: "Média",
                    categoria: "Corretiva",
                    descricao: "",
                    foto: null,
                  });
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedOrder.id} • {selectedOrder.cliente}</h3>
              <button className="btn" onClick={() => setSelectedOrder(null)}>Fechar</button>
            </div>

            <div className="tabs-line">
              <span className="tab-pill active">Cadastro</span>
              <span className="tab-pill">Itens</span>
              <span className="tab-pill">Serviços</span>
              <span className="tab-pill">Checklist</span>
              <span className="tab-pill">Observações</span>
              <span className="tab-pill">Técnicos</span>
              <span className="tab-pill">Ferramentas</span>
              <span className="tab-pill">Veículos</span>
              <span className="tab-pill">Totalização</span>
            </div>

            {selectedOrder.foto && (
              <div style={{ padding: '20px 22px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                <small style={{ color: 'var(--muted)' }}>Foto do Equipamento</small>
                <img 
                  src={selectedOrder.foto} 
                  alt="Equipamento" 
                  style={{ 
                    width: '100%', 
                    maxWidth: '400px', 
                    maxHeight: '300px', 
                    borderRadius: '12px', 
                    marginTop: '12px',
                    objectFit: 'cover'
                  }} 
                />
              </div>
            )}

            <div className="detail-grid">
              <Info label="Cliente" value={selectedOrder.cliente} />
              <Info label="Equipamento" value={selectedOrder.ativo} />
              <Info label="Categoria" value={selectedOrder.categoria} />
              <Info label="Status" value={selectedOrder.status} />
              <Info label="Série" value={selectedOrder.serie} />
              <div className="info-box span-2">
                <small>Descrição da OS</small>
                <strong>{selectedOrder.descricao}</strong>
              </div>
              <div className="info-box span-2">
                <small>Itens vinculados</small>
                {selectedOrder.pecas.length ? (
                  selectedOrder.pecas.map((p, i) => (
                    <div key={i} className="row-card">
                      <span>{p.item}</span>
                      <span className="badge">Qtd: {p.qtd}</span>
                    </div>
                  ))
                ) : (
                  <p>Nenhuma peça vinculada.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {newOrderOpen && (
        <div className="modal-backdrop" onClick={() => setNewOrderOpen(false)}>
          <div className="modal small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nova Ordem de Serviço</h3>
              <button className="btn" onClick={() => setNewOrderOpen(false)}>Fechar</button>
            </div>

            <div className="form-grid">
              <Field label="Cliente">
                <input className="input" value={newOrder.cliente} onChange={(e) => setNewOrder({ ...newOrder, cliente: e.target.value })} />
              </Field>
              <Field label="Equipamento">
                <input className="input" value={newOrder.ativo} onChange={(e) => setNewOrder({ ...newOrder, ativo: e.target.value })} />
              </Field>
              <Field label="Série">
                <input className="input" type="text" value={newOrder.prazo} onChange={(e) => setNewOrder({ ...newOrder, prazo: e.target.value })} />
              </Field>
              <Field label="Prioridade">
                <select className="input" value={newOrder.prioridade} onChange={(e) => setNewOrder({ ...newOrder, prioridade: e.target.value })}>
                  <option>Baixa</option>
                  <option>Média</option>
                  <option>Alta</option>
                  <option>Crítica</option>
                </select>
              </Field>
              <Field label="Categoria">
                <select className="input" value={newOrder.categoria} onChange={(e) => setNewOrder({ ...newOrder, categoria: e.target.value })}>
                  <option>Corretiva</option>
                  <option>Preventiva</option>
                  <option>Instalação</option>
                  <option>Laboratório</option>
                </select>
              </Field>
              <div className="span-2">
                <Field label="Descrição">
                  <textarea className="input area" value={newOrder.descricao} onChange={(e) => setNewOrder({ ...newOrder, descricao: e.target.value })} />
                </Field>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setNewOrderOpen(false)}>Cancelar</button>
              <button className="btn primary" onClick={createOrder}>Criar OS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="panel stat-card">
      <div className="panel-body">
        <small>{title}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="info-box">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
