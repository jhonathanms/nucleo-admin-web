# Contexto do Projeto: Núcleo Admin

Este documento fornece uma visão geral técnica e funcional do sistema **Núcleo Admin**, destinado a contextualizar assistentes de IA (como ChatGPT) para o planejamento de novos recursos.

## 1. Visão Geral do Sistema

O **Núcleo Admin** é um sistema de gestão administrativa (Backoffice) para controle de produtos, planos, licenças, clientes e usuários. Ele serve como o núcleo central para gerenciar o ecossistema de softwares da empresa.

## 2. Estrutura de Negócio (Módulos)

O sistema é dividido nos seguintes módulos principais:

- **Dashboard**: Visão consolidada de métricas e indicadores.
- **Clientes**: Gestão de empresas ou pessoas físicas que utilizam os produtos.
- **Produtos**: Cadastro dos softwares/serviços oferecidos (Web, API, Desktop, Mobile).
- **Planos**: Definição de modelos de cobrança (Fixo, Por Usuário, Por Recurso, Pacote) vinculados a produtos.
- **Licenças**: Controle de acesso dos clientes aos produtos, com datas de expiração e limites de usuários.
- **Usuários**: Gestão de acessos ao sistema (Admin, Gerente, Operador, Cliente).
- **Financeiro**: Controle de faturas e pagamentos relacionados às licenças.
- **Auditoria**: Log de atividades e alterações realizadas no sistema.

## 3. Modelos de Dados (Entidades Principais)

### Cliente (`Cliente`)

- `id`, `nome`, `documento` (CPF/CNPJ), `tipo` (PF/PJ), `email`, `telefone`, `endereco`, `status` (ATIVO, INATIVO, SUSPENSO).

### Produto (`Produto`)

- `id`, `nome`, `descricao`, `tipo` (WEB, API, DESKTOP, MOBILE), `versao`, `tagProduto` (identificador único), `modulos` (lista de strings).

### Plano (`Plano`)

- `id`, `nome`, `descricao`, `produtoId`, `tipoCobranca` (USUARIO, RECURSO, FIXO, VOLUME, PACOTE_USUARIO), `valor`, `valorBase`, `valorPorUsuario`, `limiteUsuarios`, `recursos` (lista de strings).

### Licença (`Licenca`)

- `id`, `chave` (UUID), `clienteId`, `produtoId`, `planoId`, `status`, `dataInicio`, `dataExpiracao`, `limiteUsuarios`, `usuariosAtivos`, `tagProduto`.

### Usuário (`Usuario`)

- `id`, `nome`, `email`, `role` (ADMIN, GERENTE, OPERADOR, CLIENTE), `ativo`, `clienteId` (opcional), `licencaId` (opcional).

## 4. Detalhes do Frontend

### Tecnologias

- **Framework**: React com Vite.
- **Linguagem**: TypeScript.
- **Estilização**: Tailwind CSS.
- **Componentes**: Shadcn UI + Lucide Icons.
- **Gerenciamento de Estado/Dados**: React Query (TanStack Query).
- **Roteamento**: React Router v6.
- **Feedback**: Sonner (toasts) e Radix UI.

### Estrutura de Pastas

- `src/components`: Componentes reutilizáveis e UI.
- `src/pages`: Telas principais da aplicação.
- `src/services`: Camada de comunicação com a API (Axios).
- `src/types`: Definições de interfaces TypeScript.
- `src/hooks`: Hooks customizados.
- `src/lib`: Utilitários e configurações (ex: storage de tokens).

## 5. Comunicação com o Backend (API)

### Padrão de Chamadas

As chamadas são centralizadas em uma instância do Axios (`src/services/api.ts`) que gerencia:

- **Base URL**: Configurável via `.env`.
- **Autenticação**: Bearer Token (JWT) enviado no header `Authorization`.
- **Headers Obrigatórios**: `X-TAG_PRODUTO` identifica qual sistema está operando.
- **Refresh Token**: Lógica automática para renovar o token em caso de 401.

### Endpoints Comuns (CRUD)

Cada serviço (ex: `ClienteService`) segue o padrão:

- `GET /clientes`: Listagem paginada.
- `GET /clientes/:id`: Detalhes de um registro.
- `POST /clientes`: Criação.
- `PUT /clientes/:id`: Atualização.
- `DELETE /clientes/:id`: Remoção.
- `PATCH /clientes/:id/activate`: Ativação de status.

## 6. Fluxos de Negócio Importantes

1. **Autenticação**: O usuário faz login, recebe um `accessToken` e um `refreshToken`. O sistema armazena o perfil e as permissões.
2. **Venda de Licença**: Um cliente escolhe um produto e um plano. Uma licença é gerada com uma chave única e data de expiração.
3. **Controle de Acesso**: O backend valida a licença através do header `X-TAG_PRODUTO` e da sessão do usuário.
4. **Auditoria**: Quase todas as operações de escrita (POST, PUT, DELETE) geram um registro na tabela de auditoria para rastreabilidade.

---

_Este documento deve ser atualizado sempre que houver mudanças estruturais significativas no projeto._
