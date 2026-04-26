# 🌿 Sistema Web - Retiro Espiritual 2027
## Igreja Batista Lírio Armação

> **"Enraizar. Crescer. Frutificar."**
> 
> Sistema completo de gerenciamento para o Retiro Espiritual 2027 — 05 a 10 de Fevereiro de 2027 | Hotel Fazenda Amoras, Santo Antônio de Jesus - BA

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 🌐 Módulo Público
- **Landing Page** (`index.html`) — Página inicial do evento com:
  - Countdown regressivo para o retiro
  - Apresentação das acomodações com preços e disponibilidade
  - Como participar (passo a passo)
  - CTA para inscrição e login
  - Design responsivo com animações

### 🔐 Autenticação
- **Tela de Login** (`login.html`) — Com seletor de perfis:
  - Administrador Geral: `admin@retiro2027.com` / `admin2027`
  - Equipe Financeira: `financeiro@retiro2027.com` / `fin2027`
  - Equipe Hospedagem: `hospedagem@retiro2027.com` / `hosp2027`
  - Equipe Alimentação: `alimentacao@retiro2027.com` / `ali2027`
  - Retirante: `retirante@email.com` / `retiro123`

### 📋 Módulo de Inscrição (`inscricao.html`)
- Formulário em **5 etapas** (stepper visual):
  1. Dados pessoais (Nome, CPF, Nascimento, Email, Celular, Sexo, PCD, Restrições)
  2. Seleção de acomodação com disponibilidade em tempo real
  3. Acompanhantes (dinâmico por tipo de apartamento):
     - Duplos/Suíte Master: até 3 acompanhantes (1 adulto + 2 crianças)
     - Triplos: até 3 (2 adultos + 1 criança)
     - Quádruplos: até 4 (3 adultos + 1 criança)
     - Quíntuplos: até 5 (4 adultos + 1 criança)
     - Alojamentos: individual (sem acompanhante)
  4. Pagamento (PIX, Cartão, Transferência, Dinheiro, Boleto, parcelamento)
  5. Confirmação com termos e resumo

### 📊 Dashboard Administrativo (`dashboard.html`)
**15+ módulos integrados:**

1. **Dashboard Geral** — KPIs em tempo real, gráficos, últimas inscrições, dias até o retiro
2. **Inscrições** — CRUD completo, busca, filtros, exportação, alteração de status
3. **Reservas** — Visão por tipo de acomodação, status, capacidade
4. **🗺️ Mapa de Ocupação** — 82 apartamentos visualizados por categoria (Flores, Frutas, Pássaros, Árvores, Alojamentos), filtrável
5. **Fila de Espera** — Gerenciar fila por tipo, notificação, posição
6. **Check-in/Check-out** — Registro de chegadas e saídas com responsável
7. **Refeições** — Controle diário por retirante (Café, Almoço, Lanche, Jantar), toggle visual
8. **Veículos** — Cadastro completo (Condutor, Marca, Modelo, Placa, Cor, Ano, Tipo)
9. **Financeiro** — Pagamentos, KPIs, gráficos de forma e evolução, quitação
10. **Despesas** — Estimadas e confirmadas, por categoria
11. **Recibos** — Geração e impressão de recibos individuais
12. **Relatórios** — Export PDF (impressão) e XLSX/CSV para todos os módulos
13. **Usuários** — Perfis e matriz de permissões
14. **Auditoria** — Log completo de ações do sistema
15. **Perfil** — Dados da conta e alteração de senha

---

## 📁 ESTRUTURA DE ARQUIVOS

```
/
├── index.html          # Landing page do evento
├── login.html          # Tela de autenticação
├── inscricao.html      # Formulário de inscrição (5 etapas)
├── dashboard.html      # Sistema administrativo completo
├── css/
│   └── main.css        # Estilos globais (variáveis, componentes, responsivo)
├── js/
│   ├── app.js          # Funções globais (API, formatação, utils)
│   └── dashboard.js    # Lógica de todos os módulos do dashboard
└── README.md
```

---

## 🌐 URLS E NAVEGAÇÃO

| Página | URL | Acesso |
|--------|-----|--------|
| Landing Page | `index.html` | Público |
| Login | `login.html` | Público |
| Inscrição | `inscricao.html` | Público |
| Dashboard | `dashboard.html` | Autenticado |
| Mapa Ocupação | `dashboard.html` → Mapa | Autenticado |
| Financeiro | `dashboard.html` → Financeiro | Admin/Financeiro |

---

## 🗄️ TABELAS DO BANCO DE DADOS

| Tabela | Descrição | Campos |
|--------|-----------|--------|
| `retirantes` | Inscritos e usuários | Nome, CPF, Celular, Email, Sexo, Status, Acomodação, Acompanhantes |
| `acomodacoes` | 82 apartamentos (pré-cadastrados) | Número, Nome, Tipo, Categoria, Capacidade, Preço, Status |
| `pagamentos` | Controle financeiro | Retirante, Valor Total/Pago/Pendente, Forma, Parcelas, Status |
| `veiculos` | Veículos dos participantes | Condutor, Marca, Modelo, Placa, Cor, Ano, Tipo |
| `refeicoes` | Controle de refeições | Retirante, Data, Café/Almoço/Lanche/Jantar, Restrições |
| `fila_espera` | Fila por tipo de acomodação | Nome, Tipo, Posição, Status |
| `checkins` | Check-in/Check-out | Retirante, Apartamento, Data/Hora, Responsável |
| `despesas` | Despesas do evento | Descrição, Categoria, Estimado, Confirmado, Status |
| `auditoria` | Log de ações | Usuário, Ação, Módulo, Data/Hora |

---

## 🏠 ACOMODAÇÕES (82 UNIDADES)

| Tipo | Séries | Unidades | Preço | Capacidade |
|------|--------|----------|-------|------------|
| Duplo | 🌸 Flores (Apt 01-16) | 18 | R$ 4.000 | 2 pessoas |
| Triplo | 🍊 Frutas (Apt 17-28) | 25 | R$ 5.400 | 3 pessoas |
| Alojamento Masculino | 🏠 Casa Rosa (29-30) | 2 blocos (30 vagas) | R$ 1.300/vaga | Individual |
| Quádruplo | 🐦 Pássaros (31-49) | 18 + Árvores | R$ 6.600 | 4 pessoas |
| Quíntuplo | 🌳 Árvores (50,51,54) | 3 | R$ 7.500 | 5 pessoas |
| Suíte Master | 🌳 Árvores (52,53) | 2 | R$ 6.500 | 4 pessoas |
| Alojamento Feminino | 🌳 Árvores (81,82) | 2 blocos (30 vagas) | R$ 1.300/vaga | Individual |

---

## 👥 PERFIS DE USUÁRIO E PERMISSÕES

| Módulo | Admin | Financeiro | Hospedagem | Alimentação | Retirante |
|--------|-------|------------|------------|-------------|-----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ❌ |
| Inscrições | ✅ | 👁️ | 👁️ | ❌ | 👁️ própria |
| Reservas/Mapa | ✅ | 👁️ | ✅ | ❌ | 👁️ |
| Check-in/out | ✅ | ❌ | ✅ | ❌ | ❌ |
| Refeições | ✅ | ❌ | ❌ | ✅ | ❌ |
| Financeiro | ✅ | ✅ | ❌ | ❌ | 👁️ próprio |
| Relatórios | ✅ | ✅ | ✅ | ✅ | ❌ |
| Usuários | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🎨 IDENTIDADE VISUAL

- **Cores**: Azul Escuro (`#0a2340`), Azul Médio (`#1a3f6f`), Dourado (`#c9a84c`), Branco
- **Tipografia**: Inter (UI), Cinzel (Títulos/Marca)
- **Design**: Responsivo, Mobile-first, Dark Sidebar + Light Content

---

## 🔧 TECNOLOGIAS UTILIZADAS

- **HTML5** semântico
- **CSS3** com variáveis CSS customizadas
- **JavaScript** ES6+ (sem frameworks)
- **Chart.js** — Gráficos e visualizações
- **Font Awesome 6** — Ícones
- **Google Fonts** — Tipografia (Inter + Cinzel)
- **RESTful Table API** — Persistência de dados

---

## ⚠️ PRÓXIMOS PASSOS RECOMENDADOS

1. **Integração de pagamento real** — Conectar a gateway como Stripe, Mercado Pago ou PagSeguro
2. **Notificações por email/WhatsApp** — Confirmação automática de inscrição
3. **Sistema de autenticação real** — JWT/OAuth com senhas criptografadas no backend
4. **Upload de comprovantes** — Serviço de armazenamento de arquivos (AWS S3, Cloudinary)
5. **Relatórios avançados** — PDFs formatados com jsPDF ou servidor
6. **Dashboard do retirante** — Área exclusiva para ver status e pagamento
7. **QR Code de check-in** — Gerar QR individual para check-in automatizado
8. **Impressão de crachás** — Geração automática de crachás para impressão

---

*Sistema desenvolvido para o Retiro Espiritual 2027 da Igreja Batista Lírio Armação*  
*Período do evento: 05 a 10 de Fevereiro de 2027 | Hotel Fazenda Amoras, Santo Antônio de Jesus - BA*
