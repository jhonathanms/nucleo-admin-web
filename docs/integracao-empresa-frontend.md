# 🏢 Integração de Empresas - Frontend SGF

## 📋 Mudanças nos Endpoints

### ❌ ANTES
```javascript
// Listagem
GET /api/empresas

// Busca
GET /api/empresas/search?q=termo

// Logo
Não disponível
```

### ✅ AGORA
```javascript
// Listagem
GET /api/empresa/listar

// Busca
GET /api/empresa/buscar?termo=texto

// Logo da empresa
GET /api/empresa/{id}/logo
GET /api/empresa/{id}/logo/exists
```

## 🔗 Novos Endpoints

### **GET /api/empresa/listar**
Lista todas as empresas integradas do nucleo_admin.

**Resposta:**
```json
[
  {
    "id": "uuid",
    "razaoSocial": "Empresa XYZ Ltda",
    "nomeFantasia": "XYZ",
    "cnpj": "12.345.678/0001-90",
    "inscricaoEstadual": "123456789",
    "inscricaoMunicipal": "987654321",
    "contatos": [
      {
        "id": "uuid",
        "tipo": "EMAIL",
        "valor": "contato@empresa.com",
        "isPrincipal": true,
        "isWhatsapp": false
      }
    ],
    "endereco": {
      "logradouro": "Rua das Flores, 123",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "uf": "SP",
      "cep": "01234-567"
    }
  }
]
```

### **GET /api/empresa/buscar?termo={texto}**
Busca empresas por razão social, nome fantasia, CNPJ ou contatos.

**Parâmetros:**
- `termo`: Texto para busca

**Resposta:** Mesmo formato do listar

### **GET /api/empresa/{id}/logo**
Retorna a imagem da logo da empresa em bytes.

**Headers de Resposta:**
```
Content-Type: image/jpeg
Content-Length: {tamanho}
```

**Resposta:** Dados binários da imagem

### **GET /api/empresa/{id}/logo/exists**
Verifica se a empresa possui logo.

**Resposta:**
```json
true
```

## 🎯 Implementação Frontend

### **Listagem de Empresas**
```javascript
// Substituir chamada
const empresas = await api.get('/api/empresa/listar');
```

### **Busca de Empresas**
```javascript
// Substituir chamada
const empresas = await api.get(`/api/empresa/buscar?termo=${termo}`);
```

### **Exibição de Logo**
```javascript
// Verificar se tem logo
const temLogo = await api.get(`/api/empresa/${id}/logo/exists`);

// Se tem logo, usar URL direta
if (temLogo) {
  const logoUrl = `/api/empresa/${id}/logo`;
  // Usar em <img src={logoUrl} />
}
```

## 📝 Observações

- **Integração automática**: Dados vêm do nucleo_admin
- **Fallback local**: Em caso de erro, usa dados locais
- **Logo em tempo real**: Imagens direto do nucleo_admin
- **Busca aprimorada**: Inclui todos os campos e contatos