# Guia de Refatoração e Design: Projeto Filarmônica

Este documento serve como instrução para a IA Antigravity ajudar na migração do projeto Filarmônica para um design moderno, sofisticado e performático, baseado no sistema **Núcleo Admin**.

## 🎯 Objetivos Principais

1.  **Migração Tecnológica**: Transição de MUI5 (sx/css) para Tailwind CSS.
2.  **Design Premium**: Implementação de layout flutuante, glassmorphism e micro-animações.
3.  **Performance & UX**: Otimização de carregamento (Lazy Loading) e eliminação de "flashes" de conteúdo vazio.

---

## 🎨 Sistema de Design (Tokens)

Use estas variáveis no `tailwind.config.js` ou `index.css` para manter a consistência:

- **Cores**:
  - `primary`: `#0a84c1` (Azul Profissional)
  - `sidebar-bg`: `rgba(15, 23, 42, 0.95)` (Slate Escuro com transparência)
  - `glass-bg`: `rgba(255, 255, 255, 0.1)` (Para efeitos de desfoque)
- **Efeitos**:
  - `backdrop-blur-xl`: Para o efeito de vidro.
  - `shadow-lg`: Sombras suaves para profundidade.
  - `rounded-2xl` / `rounded-3xl`: Cantos bem arredondados para um ar moderno.

---

## 🏗️ Estrutura de Layout

### 1. Login Moderno

- **Layout**: Centralizado, com um card em `glassmorphism`.
- **Fundo**: Gradiente animado (`from-slate-900 via-blue-900 to-slate-900`).
- **Animações**: Use `animate-in fade-in slide-in-from-bottom-4` para a entrada dos elementos.

### 2. AppSidebar (Menu Lateral)

- **Estilo**: Flutuante (`fixed left-4 top-4 bottom-4`), não colado na borda.
- **Visual**: `bg-sidebar/95 backdrop-blur-xl`, bordas arredondadas (`rounded-3xl`).
- **Navegação**: Itens em formato "pílula" quando ativos, com micro-animações de escala no hover.

### 3. AppHeader (Toolbar)

- **Estilo**: Flutuante (`fixed top-4 right-4`), alinhado com o conteúdo.
- **Visual**: Mesma linguagem de vidro do sidebar.

---

## ⚡ Performance e Transições Suaves

Para resolver a lentidão e o "flash" de tabelas vazias:

### 1. Lazy Loading de Páginas

Use `React.lazy` e `Suspense` no roteamento principal:

```tsx
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
// ... no Router
<Suspense fallback={<LoadingScreen />}>
  <Dashboard />
</Suspense>;
```

### 2. Skeleton Screens (Tabelas)

Nunca exiba uma tabela vazia enquanto os dados carregam. Use componentes de Skeleton:

- Crie um componente `TableSkeleton` que imita as linhas da tabela.
- **Lógica**: `isLoading ? <TableSkeleton /> : (data.length > 0 ? <DataTable data={data} /> : <EmptyState />)`

### 3. Transições de Tela

Adicione uma animação de fade-in suave ao montar as páginas para esconder o tempo de renderização inicial.

---

## 🛠️ Estratégia de Migração (MUI para Tailwind)

1.  **Instalação**: Adicione Tailwind e configure o `content` para ler seus arquivos `.tsx`.
2.  **Substituição Gradual**:
    - Troque `Box sx={{ display: 'flex' }}` por `<div className="flex">`.
    - Troque `Typography variant="h4"` por `<h1 className="text-2xl font-bold">`.
    - Mantenha o MUI apenas para componentes complexos (DatePickers, etc) até que possa substituí-los por Shadcn/UI.
3.  **Remoção de CSS**: Elimine arquivos `.css` legados em favor das classes utilitárias do Tailwind.

---

## 🤖 Instrução para Antigravity

"Antigravity, ajude o usuário a refatorar o projeto Filarmônica seguindo o guia acima. Comece analisando o `App.tsx` e o `Layout` atual. Priorize a criação do novo `AppSidebar` flutuante e a implementação de `Skeletons` nas tabelas para remover a sensação de lentidão."
