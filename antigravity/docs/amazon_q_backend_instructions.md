# Instruções para Amazon Q - Validação e Implementação Backend

Este documento serve como contexto para o Amazon Q no IntelliJ IDEA. Ele contém a especificação completa dos modelos de dados do frontend e os endpoints esperados.

**Objetivo**: Validar a implementação atual do backend e criar os endpoints/recursos faltantes para garantir total compatibilidade com o frontend `nucleo-admin-web`.

---

## 1. Modelos de Dados (Typescript Interfaces)

Abaixo estão as interfaces utilizadas pelo frontend. O backend deve fornecer DTOs/Entidades compatíveis com estas estruturas.

### 1.1 Autenticação (`Auth`)

```typescript
export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}
export interface RefreshTokenRequest {
  refreshToken: string;
}
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
export interface User {
  id: string;
  nome: string;
  email: string;
  role: "ADMIN" | "GERENTE" | "OPERADOR" | "CLIENTE";
  ativo: boolean;
  avatar?: string;
  criadoEm: string;
  atualizadoEm: string;
}
export interface UpdateProfileRequest {
  nome?: string;
  email?: string;
  avatar?: string;
}
export interface ChangePasswordRequest {
  senhaAtual: string;
  novaSenha: string;
}
```

### 1.2 Clientes (`Cliente`)

```typescript
export interface Cliente {
  id: string;
  nome: string;
  documento: string;
  tipo: "PF" | "PJ";
  email: string;
  telefone: string;
  endereco?: Endereco;
  status: "ATIVO" | "INATIVO" | "SUSPENSO" | "CANCELADO" | "PENDENTE";
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}
export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
}
export interface CreateClienteDTO {
  nome: string;
  documento: string;
  tipo: "PF" | "PJ";
  email: string;
  telefone: string;
  endereco?: Endereco;
  observacoes?: string;
}
export interface UpdateClienteDTO {
  nome?: string;
  email?: string;
  telefone?: string;
  endereco?: Endereco;
  status?: Status;
  observacoes?: string;
}
```

### 1.3 Produtos (`Produto`)

```typescript
export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  tipo: "WEB" | "API" | "DESKTOP" | "MOBILE";
  versao: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
export interface CreateProdutoDTO {
  nome: string;
  descricao: string;
  tipo: ProdutoTipo;
  versao: string;
}
export interface UpdateProdutoDTO {
  nome?: string;
  descricao?: string;
  tipo?: ProdutoTipo;
  versao?: string;
  ativo?: boolean;
}
```

### 1.4 Planos (`Plano`)

```typescript
export interface Plano {
  id: string;
  nome: string;
  descricao: string;
  produtoId: string;
  produtoNome: string;
  tipoCobranca: "USUARIO" | "RECURSO" | "VOLUME" | "FIXO";
  valor: number;
  limiteUsuarios: number | null;
  trial: boolean;
  diasTrial: number;
  recursos: string[];
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
export interface CreatePlanoDTO {
  nome: string;
  descricao: string;
  produtoId: string;
  tipoCobranca: TipoCobranca;
  valor: number;
  limiteUsuarios?: number | null;
  trial: boolean;
  diasTrial: number;
  recursos?: string[];
}
export interface UpdatePlanoDTO {
  nome?: string;
  descricao?: string;
  tipoCobranca?: TipoCobranca;
  valor?: number;
  limiteUsuarios?: number | null;
  trial?: boolean;
  diasTrial?: number;
  recursos?: string[];
  ativo?: boolean;
}
```

### 1.5 Licenças (`Licenca`)

```typescript
export interface Licenca {
  id: string;
  chave: string;
  clienteId: string;
  clienteNome: string;
  produtoId: string;
  produtoNome: string;
  planoId: string;
  planoNome: string;
  status: Status;
  dataInicio: string;
  dataExpiracao: string;
  limiteUsuarios: number | null;
  usuariosAtivos: number;
  metadata?: Record<string, any>;
  criadoEm: string;
  atualizadoEm: string;
}
export interface CreateLicencaDTO {
  clienteId: string;
  produtoId: string;
  planoId: string;
  dataInicio: string;
  dataExpiracao: string;
  limiteUsuarios?: number | null;
  metadata?: Record<string, any>;
}
export interface UpdateLicencaDTO {
  status?: Status;
  dataExpiracao?: string;
  limiteUsuarios?: number | null;
  metadata?: Record<string, any>;
}
export interface RenovarLicencaDTO {
  meses: number;
}
```

### 1.6 Usuários (`Usuario`)

```typescript
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  avatar?: string;
  telefone?: string;
  ultimoAcesso?: string;
  criadoEm: string;
  atualizadoEm: string;
}
export interface CreateUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
  telefone?: string;
  avatar?: string;
  clienteId?: string;
}
export interface UpdateUsuarioDTO {
  nome?: string;
  email?: string;
  role?: UserRole;
  ativo?: boolean;
  telefone?: string;
  avatar?: string;
  clienteId?: string;
}
export interface ResetPasswordDTO {
  novaSenha: string;
}
```

### 1.7 Financeiro (`TituloFinanceiro`)

```typescript
export interface TituloFinanceiro {
  id: string;
  numero: string;
  licencaId: string;
  clienteNome: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  status: "PENDENTE" | "PAGO" | "EM_ATRASO" | "CANCELADO";
  criadoEm: string;
  atualizadoEm: string;
}
export interface CreateTituloDTO {
  licencaId: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  status: "PENDENTE" | "PAGO" | "EM_ATRASO" | "CANCELADO";
  criadoEm: string;
  atualizadoEm: string;
}
export interface UpdateTituloDTO {
  descricao?: string;
  valor?: number;
  dataVencimento?: string;
  dataPagamento?: string | null;
  status?: StatusTitulo;
}
```

### 1.8 Auditoria (`LogAuditoria`)

```typescript
export interface LogAuditoria {
  id: string;
  dataHora: string;
  usuario: string;
  usuarioEmail: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  detalhes: string;
  ip: string;
  nivel: "INFO" | "WARNING" | "ERROR";
}
```

---

## 2. Endpoints Necessários

O backend deve expor os seguintes endpoints RESTful.

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `POST /api/auth/change-password`

### Clientes

- `GET /api/clientes` (Paginação: `page`, `size`, `sort`)
- `GET /api/clientes/{id}`
- `POST /api/clientes`
- `PUT /api/clientes/{id}`
- `DELETE /api/clientes/{id}`
- `GET /api/clientes/search?q={query}`
- `GET /api/clientes/status/{status}`
- `PATCH /api/clientes/{id}/suspend`
- `PATCH /api/clientes/{id}/activate`

### Produtos

- `GET /api/produtos`
- `GET /api/produtos/{id}`
- `POST /api/produtos`
- `PUT /api/produtos/{id}`
- `DELETE /api/produtos/{id}`
- `GET /api/produtos/tipo/{tipo}`
- `GET /api/produtos/ativos`

### Planos

- `GET /api/planos`
- `GET /api/planos/{id}`
- `POST /api/planos`
- `PUT /api/planos/{id}`
- `DELETE /api/planos/{id}`
- `GET /api/planos/produto/{produtoId}`
- `POST /api/planos/{id}/duplicate`

### Licenças

- `GET /api/licencas`
- `GET /api/licencas/{id}`
- `POST /api/licencas`
- `PUT /api/licencas/{id}`
- `DELETE /api/licencas/{id}`
- `GET /api/licencas/cliente/{clienteId}`
- `POST /api/licencas/{id}/renovar`
- `PATCH /api/licencas/{id}/suspender`
- `PATCH /api/licencas/{id}/ativar`
- `GET /api/licencas/gerar-chave`

### Usuários

- `GET /api/usuarios`
- `GET /api/usuarios/{id}`
- `POST /api/usuarios`
- `PUT /api/usuarios/{id}`
- `DELETE /api/usuarios/{id}`
- `POST /api/usuarios/{id}/reset-password`
- `GET /api/usuarios/role/{role}`

### Financeiro

- `GET /api/financeiro/titulos`
- `GET /api/financeiro/titulos/{id}`
- `POST /api/financeiro/titulos`
- `PUT /api/financeiro/titulos/{id}`
- `DELETE /api/financeiro/titulos/{id}`
- `POST /api/financeiro/titulos/{id}/pagamento`
- `POST /api/financeiro/titulos/{id}/cancelar`

### Auditoria

- `GET /api/auditoria/logs` (Filtros: `entidade`, `nivel`, `dataInicio`, `dataFim`)

### Dashboard (Opcional - Recomendado)

- `GET /api/dashboard/stats` (Para evitar múltiplas chamadas do frontend)

---

## 3. Instruções de Validação e Criação

1.  **Verificar Controllers**: Confirme se os Controllers existentes mapeiam para as URLs acima.
2.  **Verificar DTOs**: Confirme se os DTOs de entrada e saída correspondem aos campos listados na seção de Modelos. Atenção especial para campos opcionais (`?`).
3.  **Implementar Faltantes**: Para qualquer endpoint ou recurso não encontrado, gere o código correspondente (Controller, Service, Repository, Entity, DTO) seguindo o padrão do projeto backend existente.
4.  **CORS**: Certifique-se de que o backend permite requisições da origem do frontend (ex: `http://localhost:5173`).
