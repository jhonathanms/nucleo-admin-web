# 🔧 Ajuste Frontend - Nova Estrutura de Clientes

## 📋 Visão Geral

Este documento descreve as alterações necessárias no frontend para suportar a nova estrutura de clientes com múltiplos contatos e seleção de contatos principais por tipo.

## 🔄 Principais Mudanças

### 1. **Campos do Cliente Atualizados**
- `nome` → `razaoSocial` (obrigatório)
- Novo: `nomeFantasia` (opcional)
- Novo: `inscricaoEstadual` (opcional)
- Novo: `inscricaoMunicipal` (opcional)
- Removido: `email` e `telefone` (agora são contatos)
- Novo: `contatos[]` (array de contatos)

### 2. **Sistema de Contatos Principais**
- **Um email principal** e **um telefone principal** por cliente
- Seleção independente por tipo
- Flag `isPrincipal` controlada automaticamente pela API

## 🛠️ Alterações Necessárias

### 1. **Interfaces TypeScript**

```typescript
interface Cliente {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  documento: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  codigoCrm: string;
  tipo: 'PF' | 'PJ';
  contatos: ClienteContato[];
  endereco?: Endereco;
  status: 'ATIVO' | 'INATIVO' | 'SUSPENSO';
  observacoes?: string;
  logo?: string;
  criadoEm: string;
  atualizadoEm: string;
}

interface ClienteContato {
  id?: string;
  tipo: 'EMAIL' | 'TELEFONE';
  valor: string;
  isWhatsapp: boolean;
  isPrincipal: boolean;
}
```

### 2. **Serviços/API**

```typescript
class ClienteService {
  async getContatos(clienteId: string): Promise<ClienteContato[]> {
    return api.get(`/clientes/${clienteId}/contatos`);
  }

  async addContato(clienteId: string, contato: Omit<ClienteContato, 'id'>): Promise<ClienteContato> {
    return api.post(`/clientes/${clienteId}/contatos`, contato);
  }

  async deleteContato(contatoId: string): Promise<void> {
    return api.delete(`/clientes/contatos/${contatoId}`);
  }

  async setContatoPrincipal(contatoId: string): Promise<ClienteContato> {
    return api.patch(`/clientes/contatos/${contatoId}/principal`);
  }
}
```

### 3. **Componente de Contatos**

```tsx
const ContatosSection = ({ contatos, onChange }) => {
  const [contatosList, setContatosList] = useState(contatos || []);

  const setContatoPrincipal = async (contatoId: string, tipo: 'EMAIL' | 'TELEFONE') => {
    try {
      await clienteService.setContatoPrincipal(contatoId);
      
      // Atualizar estado local
      setContatosList(prev => prev.map(contato => ({
        ...contato,
        isPrincipal: contato.tipo === tipo ? contato.id === contatoId : contato.isPrincipal
      })));
      
      onChange(contatosList);
    } catch (error) {
      console.error('Erro ao definir contato principal:', error);
    }
  };

  const getContatoPrincipal = (tipo: 'EMAIL' | 'TELEFONE') => {
    return contatosList.find(c => c.tipo === tipo && c.isPrincipal);
  };

  return (
    <div className="contatos-section">
      <h3>Contatos</h3>
      
      {/* Seção de Emails */}
      <div className="contatos-tipo">
        <h4>Emails</h4>
        {contatosList.filter(c => c.tipo === 'EMAIL').map((contato, index) => (
          <div key={contato.id || index} className="contato-item">
            <Input
              value={contato.valor}
              onChange={(e) => updateContato(index, 'valor', e.target.value)}
              placeholder="email@exemplo.com"
            />
            
            <div className="contato-actions">
              <Button
                variant={contato.isPrincipal ? "primary" : "outline"}
                onClick={() => setContatoPrincipal(contato.id, 'EMAIL')}
                disabled={contato.isPrincipal}
              >
                {contato.isPrincipal ? "Principal" : "Definir Principal"}
              </Button>
              
              <Button onClick={() => removeContato(index)} variant="danger" size="sm">
                Remover
              </Button>
            </div>
          </div>
        ))}
        
        <Button onClick={() => addContato('EMAIL')} variant="outline">
          + Adicionar Email
        </Button>
      </div>

      {/* Seção de Telefones */}
      <div className="contatos-tipo">
        <h4>Telefones</h4>
        {contatosList.filter(c => c.tipo === 'TELEFONE').map((contato, index) => (
          <div key={contato.id || index} className="contato-item">
            <Input
              value={contato.valor}
              onChange={(e) => updateContato(index, 'valor', e.target.value)}
              placeholder="(11) 99999-9999"
            />
            
            <Checkbox
              checked={contato.isWhatsapp}
              onChange={(checked) => updateContato(index, 'isWhatsapp', checked)}
              label="WhatsApp"
            />
            
            <div className="contato-actions">
              <Button
                variant={contato.isPrincipal ? "primary" : "outline"}
                onClick={() => setContatoPrincipal(contato.id, 'TELEFONE')}
                disabled={contato.isPrincipal}
              >
                {contato.isPrincipal ? "Principal" : "Definir Principal"}
              </Button>
              
              <Button onClick={() => removeContato(index)} variant="danger" size="sm">
                Remover
              </Button>
            </div>
          </div>
        ))}
        
        <Button onClick={() => addContato('TELEFONE')} variant="outline">
          + Adicionar Telefone
        </Button>
      </div>
    </div>
  );
};
```

### 4. **Validações Atualizadas**

```typescript
const validateContatos = (contatos: ClienteContato[]) => {
  const errors = [];
  
  // Verificar se há pelo menos um contato principal por tipo
  const tiposComContatos = [...new Set(contatos.map(c => c.tipo))];
  
  tiposComContatos.forEach(tipo => {
    const contatosDoTipo = contatos.filter(c => c.tipo === tipo);
    const principaisDoTipo = contatosDoTipo.filter(c => c.isPrincipal);
    
    if (principaisDoTipo.length === 0 && contatosDoTipo.length > 0) {
      errors.push(`Deve haver um contato principal do tipo ${tipo}`);
    }
    
    if (principaisDoTipo.length > 1) {
      errors.push(`Apenas um contato pode ser principal por tipo ${tipo}`);
    }
  });
  
  return errors;
};
```

### 5. **Hook para Gerenciamento de Contatos**

```typescript
const useClienteContatos = (clienteId: string) => {
  const [contatos, setContatos] = useState<ClienteContato[]>([]);
  const [loading, setLoading] = useState(false);

  const setContatoPrincipal = async (contatoId: string) => {
    try {
      const contatoAtualizado = await clienteService.setContatoPrincipal(contatoId);
      
      setContatos(prev => prev.map(c => 
        c.tipo === contatoAtualizado.tipo 
          ? { ...c, isPrincipal: c.id === contatoId }
          : c
      ));
      
      return contatoAtualizado;
    } catch (error) {
      throw error;
    }
  };

  const getContatoPrincipal = (tipo: 'EMAIL' | 'TELEFONE') => {
    return contatos.find(c => c.tipo === tipo && c.isPrincipal);
  };

  return {
    contatos,
    loading,
    setContatoPrincipal,
    getContatoPrincipal,
    // ... outros métodos
  };
};
```

### 6. **Exibição na Lista de Clientes**

```tsx
const ClienteRow = ({ cliente }) => {
  const emailPrincipal = cliente.contatos?.find(c => c.tipo === 'EMAIL' && c.isPrincipal);
  const telefonePrincipal = cliente.contatos?.find(c => c.tipo === 'TELEFONE' && c.isPrincipal);
  
  return (
    <tr>
      <td>{cliente.razaoSocial}</td>
      <td>{cliente.nomeFantasia || '-'}</td>
      <td>
        {emailPrincipal ? (
          <div className="contato-principal">
            <span>{emailPrincipal.valor}</span>
            <Badge size="sm">Principal</Badge>
          </div>
        ) : '-'}
      </td>
      <td>
        {telefonePrincipal ? (
          <div className="contato-principal">
            <span>{formatPhone(telefonePrincipal.valor)}</span>
            <div className="badges">
              <Badge size="sm">Principal</Badge>
              {telefonePrincipal.isWhatsapp && <Badge size="sm" variant="success">WhatsApp</Badge>}
            </div>
          </div>
        ) : '-'}
      </td>
      <td><StatusBadge status={cliente.status} /></td>
    </tr>
  );
};
```

## 🎯 Funcionalidades Implementadas

### ✅ **Contatos Principais por Tipo**
- Um email principal por cliente
- Um telefone principal por cliente
- Seleção independente por tipo
- API gerencia automaticamente as flags

### ✅ **Interface Intuitiva**
- Botões para definir principal
- Indicadores visuais claros
- Seções separadas por tipo
- Validação em tempo real

### ✅ **Gerenciamento Automático**
- API remove flag principal de outros do mesmo tipo
- Frontend atualiza estado automaticamente
- Validações garantem consistência

## 📱 Exemplo de Uso

```typescript
// Definir email como principal
await clienteService.setContatoPrincipal(emailId);

// Definir telefone como principal
await clienteService.setContatoPrincipal(telefoneId);

// Buscar contato principal por tipo
const emailPrincipal = getContatoPrincipal('EMAIL');
const telefonePrincipal = getContatoPrincipal('TELEFONE');
```

## ✅ Checklist de Implementação

- [ ] Atualizar interfaces TypeScript
- [ ] Implementar serviço setContatoPrincipal
- [ ] Criar componente de contatos por tipo
- [ ] Atualizar validações
- [ ] Implementar hook de gerenciamento
- [ ] Atualizar exibição na lista
- [ ] Testar seleção de principais
- [ ] Validar comportamento da API

A funcionalidade permite selecionar um contato principal por tipo (email e telefone) de forma independente e intuitiva! 🎯