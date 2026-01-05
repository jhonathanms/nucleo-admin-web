# 📋 Clientes API - Frontend

## 🔗 Endpoints

### Clientes
```
GET    /clientes                    - Listar (paginado)
GET    /clientes/{id}               - Buscar por ID
GET    /clientes/search?q=termo     - Buscar por termo
GET    /clientes/status/{status}    - Filtrar por status
GET    /clientes/{id}/usuarios      - Usuários do cliente
POST   /clientes                    - Criar
PUT    /clientes/{id}               - Atualizar
PATCH  /clientes/{id}/suspend       - Suspender
PATCH  /clientes/{id}/activate      - Ativar
DELETE /clientes/{id}               - Deletar
```

### Contatos
```
GET    /clientes/{id}/contatos                    - Listar contatos
POST   /clientes/{id}/contatos                    - Adicionar contato
PATCH  /clientes/contatos/{contatoId}/principal   - Definir principal
DELETE /clientes/contatos/{contatoId}             - Remover contato
```

### Logo
```
POST   /clientes/{id}/logo          - Upload logo
GET    /clientes/{id}/logo          - Obter logo
GET    /clientes/{id}/logo/exists   - Verificar se tem logo
DELETE /clientes/{id}/logo          - Remover logo
```

## 📄 Modelos

### Cliente
```typescript
interface Cliente {
  id: string;
  razaoSocial: string;        // era 'nome'
  nomeFantasia?: string;      // novo
  documento: string;
  inscricaoEstadual?: string; // novo
  inscricaoMunicipal?: string;// novo
  codigoCrm: string;
  tipo: 'PF' | 'PJ';
  contatos: ClienteContato[]; // novo - array
  endereco?: Endereco;
  status: 'ATIVO' | 'INATIVO' | 'SUSPENSO';
  observacoes?: string;
  logo?: string;
  criadoEm: string;
  atualizadoEm: string;
}
```

### Contato
```typescript
interface ClienteContato {
  id?: string;
  tipo: 'EMAIL' | 'TELEFONE';
  valor: string;
  isWhatsapp: boolean;
  isPrincipal: boolean;
}
```

### Criar Cliente
```typescript
interface CreateClienteDTO {
  razaoSocial: string;
  nomeFantasia?: string;
  documento: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  tipo: 'PF' | 'PJ';
  contatos?: ClienteContato[];
  endereco?: Endereco;
  observacoes?: string;
}
```

## 💡 Regras de Negócio

### Contatos Principais
- **1 email principal** por cliente
- **1 telefone principal** por cliente
- Seleção independente por tipo
- API gerencia flags automaticamente

### Validações
- `razaoSocial` obrigatório
- `documento` obrigatório
- `tipo` obrigatório
- Apenas um principal por tipo de contato

## 🔧 Implementação

### Service
```typescript
class ClienteService {
  // CRUD básico
  async getAll(page = 0, size = 10): Promise<PageResponse<Cliente>>
  async getById(id: string): Promise<Cliente>
  async create(cliente: CreateClienteDTO): Promise<Cliente>
  async update(id: string, cliente: Partial<CreateClienteDTO>): Promise<Cliente>
  async delete(id: string): Promise<void>
  
  // Busca e filtros
  async search(query: string, page = 0, size = 10): Promise<PageResponse<Cliente>>
  async getByStatus(status: string, page = 0, size = 10): Promise<PageResponse<Cliente>>
  
  // Contatos
  async getContatos(clienteId: string): Promise<ClienteContato[]>
  async addContato(clienteId: string, contato: Omit<ClienteContato, 'id'>): Promise<ClienteContato>
  async setContatoPrincipal(contatoId: string): Promise<ClienteContato>
  async deleteContato(contatoId: string): Promise<void>
  
  // Logo
  async uploadLogo(clienteId: string, file: File): Promise<{message: string}>
  async getLogo(clienteId: string): Promise<ClienteLogoDTO>
  async deleteLogo(clienteId: string): Promise<void>
  async hasLogo(clienteId: string): Promise<{hasLogo: boolean}>
}
```

### Helpers
```typescript
// Buscar contato principal por tipo
const getContatoPrincipal = (contatos: ClienteContato[], tipo: 'EMAIL' | 'TELEFONE') => {
  return contatos?.find(c => c.tipo === tipo && c.isPrincipal);
};

// Validar contatos
const validateContatos = (contatos: ClienteContato[]) => {
  const errors = [];
  const tiposComContatos = [...new Set(contatos.map(c => c.tipo))];
  
  tiposComContatos.forEach(tipo => {
    const principaisDoTipo = contatos.filter(c => c.tipo === tipo && c.isPrincipal);
    if (principaisDoTipo.length === 0) {
      errors.push(`Deve haver um contato principal do tipo ${tipo}`);
    }
  });
  
  return errors;
};
```

## 📋 Checklist

- [ ] Atualizar interfaces (`nome` → `razaoSocial`)
- [ ] Implementar service completo
- [ ] Criar componente de contatos
- [ ] Implementar seleção de principais
- [ ] Atualizar formulários
- [ ] Atualizar listagem
- [ ] Testar CRUD completo
- [ ] Validar contatos principais