# Manutex OS & Estoque

Sistema web em React, pronto para GitHub, com foco em:
- Kanban de Ordens de Serviço
- Estoque industrial
- Solicitações ao estoque
- Dashboard operacional
- Base inicial para futura integração com a API da Omie

## Como rodar localmente

```bash
npm install
npm run dev
```

## Como gerar build

```bash
npm run build
```

A pasta final será `dist/`.

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie estes arquivos para o repositório.
3. No GitHub, ative o Pages para publicar a branch desejada ou use uma action de deploy.
4. Como este projeto está com `base: './'`, ele funciona melhor em publicação estática simples.

## Estrutura

- `src/App.jsx`: interface principal
- `src/styles.css`: visual do sistema
- `vite.config.js`: configuração do Vite para publicação estática

## Próximas etapas recomendadas

- conectar banco de dados
- autenticação de usuários
- CRUD real de clientes, técnicos e ativos
- baixa automática de estoque
- integração com Omie via backend
