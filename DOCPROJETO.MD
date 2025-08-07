## 🎯 Visão Geral
O ReciclaSystem é um sistema web de gestão de reciclagem desenvolvido em React/TypeScript com Vite, focado no controle e monitoramento de cooperativas, catadores, eventos de coleta e impacto ambiental.

## 🏗️ Arquitetura Técnica
### Stack Principal:
- Frontend: React 18 + TypeScript + Vite
- UI Framework: shadcn/ui + Radix UI components
- Styling: Tailwind CSS com tema customizado
- Backend: Supabase (PostgreSQL + Auth + RLS)
- Roteamento: React Router DOM
- Estado: React Query (TanStack Query)
- Formulários: React Hook Form + Zod validation
### Estrutura de Pastas:
```
src/
├── components/          # Componentes 
reutilizáveis
│   ├── ui/             # Componentes base 
(shadcn/ui)
│   ├── Dashboard.tsx   # Dashboard 
principal
│   ├── Sidebar.tsx     # Menu lateral
│   └── ReciclaSystemLayout.tsx
├── pages/              # Páginas da 
aplicação
├── hooks/              # Custom hooks 
(useAuth, etc.)
├── lib/                # Utilitários e 
helpers
└── integrations/       # Integrações 
(Supabase)
```
## 🔐 Sistema de Autenticação
### Características:
- Login com CPF/CNPJ + senha
- Validação de CPF/CNPJ com máscara automática
- Sistema de validação de senha obrigatória no primeiro acesso
- Row Level Security (RLS) no Supabase
- Funções customizadas no PostgreSQL para autenticação
### Fluxo de Login:
1. 1.
   Usuário insere CPF/CNPJ e senha
2. 2.
   Sistema valida credenciais via função authenticate_user
3. 3.
   Se senha não foi validada ( password_validated = 'D' ), redireciona para validação
4. 4.
   Após validação, acesso liberado ao sistema
## 📊 Funcionalidades Principais
### Dashboard Implementado:
- Cards de estatísticas: Cooperativas ativas, catadores, eventos, geradores
- Reciclômetro: Progresso de metas mensais (79% implementado)
- Atividades recentes: Timeline de eventos
- Impacto ambiental: Árvores preservadas, água economizada, CO₂ não emitido
### Módulos Planejados (em desenvolvimento):
1. 1.
   Cooperativas/Catadores - Gestão de entidades
2. 2.
   Tipos de Entidades - Configuração de categorias
3. 3.
   Centrais de Apoio - Pontos de coleta
4. 4.
   Eventos de Coleta - Agendamento e controle
5. 5.
   Geradores de Resíduos - Empresas cadastradas
6. 6.
   Recebimento de Resíduos - Controle de entrada
7. 7.
   Ecoindicadores - Métricas ambientais
8. 8.
   Relatórios - Geração de reports
9. 9.
   Reciclômetro - Medição de metas
10. 10.
    Configurações - Ajustes do sistema
## 🎨 Design System
### Tema de Cores:
- Verde Reciclagem: recycle-green (cor principal)
- Azul Eco: eco-blue
- Laranja Eco: eco-orange
- Marrom Terra: earth-brown
- Paleta focada em sustentabilidade e meio ambiente
### Componentes UI:
- Sidebar colapsível com navegação por seções
- Cards responsivos com ícones Lucide React
- Formulários com validação em tempo real
- Toasts para feedback do usuário
- Progress bars para metas
## 🗄️ Banco de Dados
### Estrutura Principal:
- Tabela usuario : Dados de login e perfil
- Tabela entidade : Cooperativas, catadores, empresas
- Relacionamentos: Usuário → Entidade → Perfil
### Segurança:
- RLS habilitado em todas as tabelas
- Funções PostgreSQL para autenticação segura
- Políticas de acesso baseadas no usuário logado
## 🚀 Estado Atual do Desenvolvimento
### ✅ Implementado:
- Estrutura base da aplicação
- Sistema de autenticação completo
- Dashboard com métricas visuais
- Layout responsivo com sidebar
- Integração com Supabase
- Validação de formulários
### 🔄 Em Desenvolvimento:
- Todos os módulos de gestão (10 módulos)
- CRUD completo para entidades
- Sistema de relatórios
- Funcionalidades do reciclômetro
### 📋 Próximos Passos Sugeridos:
1. 1.
   Implementar CRUD de Cooperativas/Catadores
2. 2.
   Desenvolver sistema de eventos de coleta
3. 3.
   Criar módulo de recebimento de resíduos
4. 4.
   Implementar geração de relatórios
5. 5.
   Adicionar gráficos e dashboards avançados