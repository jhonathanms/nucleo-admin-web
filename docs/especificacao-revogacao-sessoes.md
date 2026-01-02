# 🔐 Sistema de Revogação de Sessões - Especificação Técnica

## 📡 Endpoints Disponíveis

### POST /auth/logout
Revoga o access token do usuário atual.

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta:**
- **204**: Token revogado com sucesso

### POST /auth/revogar-sessoes/{usuarioId}
Revoga todas as sessões de um usuário específico (Admin apenas).

**Headers:**
```
Authorization: Bearer {token}
```

**Parâmetros:**
- `usuarioId` (UUID): ID do usuário

**Resposta:**
- **200**: Todas as sessões revogadas
- **404**: Usuário não encontrado
- **403**: Sem permissão

### POST /auth/validar-sessao
Verifica se a sessão atual ainda é válida.

**Headers:**
```
Authorization: Bearer {token}
X-TAG_PRODUTO: APP_NUCLEO_ADMIN
```

**Resposta:**
- **200**: Sessão válida
- **401**: Sessão inválida/revogada

## 🔄 Comportamento do Sistema

### Revogação Individual (logout)
1. Adiciona access token atual à blacklist
2. Token se torna inválido imediatamente
3. Próximas requisições retornam 401

### Revogação Total (revogar-sessoes)
1. Invalida refresh token no banco
2. Cria entrada na blacklist para todos os tokens do usuário
3. Marca todas as sessões como INVALIDADA
4. Registra auditoria da ação

### Validação de Tokens
- Verifica se JTI está na blacklist
- Verifica se usuário teve tokens revogados após emissão
- Retorna 401 para tokens revogados

## 🛡️ Segurança

- Endpoint de revogação restrito a admins/operadores
- Blacklist automática de tokens expirados
- Auditoria completa de todas as revogações
- Invalidação imediata sem dependência de expiração natural