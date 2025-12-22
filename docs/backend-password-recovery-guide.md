# Backend - Recuperação de Senha - Especificação

## 🔌 Endpoints Necessários

### 1. Solicitar Recuperação de Senha

```
POST /api/auth/esqueci-senha
```

**Request:**

```json
{
  "email": "usuario@exemplo.com"
}
```

**Response (200 OK):**

```json
{
  "mensagem": "Se o email existir, você receberá instruções para redefinir sua senha.",
  "sucesso": true
}
```

**Observações:**

- Sempre retornar sucesso (não revelar se email existe)
- Gerar token único de 64 caracteres (UUID + UUID)
- Token válido por 6 horas
- Enviar email com link: `{URL_FRONTEND}/reset-password?token={token}`

---

### 2. Validar Token de Redefinição

```
POST /api/auth/validar-token-redefinicao
```

**Request:**

```json
{
  "token": "abc123def456..."
}
```

**Response (200 OK - Token Válido):**

```json
{
  "valido": true,
  "email": "usuario@exemplo.com"
}
```

**Response (400 Bad Request - Token Inválido):**

```json
{
  "valido": false,
  "mensagem": "Token inválido ou expirado"
}
```

---

### 3. Redefinir Senha

```
POST /api/auth/redefinir-senha
```

**Request:**

```json
{
  "token": "abc123def456...",
  "novaSenha": "SenhaForte@123"
}
```

**Response (200 OK):**

```json
{
  "mensagem": "Senha redefinida com sucesso",
  "sucesso": true
}
```

**Response (400 Bad Request - Validação):**

```json
{
  "mensagem": "Senha não atende aos requisitos de segurança",
  "status": 400,
  "erros": {
    "novaSenha": [
      "A senha deve ter no mínimo 8 caracteres",
      "A senha deve conter pelo menos uma letra maiúscula",
      "A senha deve conter pelo menos uma letra minúscula",
      "A senha deve conter pelo menos um número",
      "A senha deve conter pelo menos um caractere especial (@#$%^&+=!*()_-)"
    ]
  }
}
```

---

## ✅ Regras de Validação da Senha

A senha deve atender TODOS os requisitos:

- ✅ Mínimo de 8 caracteres
- ✅ Pelo menos uma letra maiúscula (A-Z)
- ✅ Pelo menos uma letra minúscula (a-z)
- ✅ Pelo menos um número (0-9)
- ✅ Pelo menos um caractere especial: `@#$%^&+=!*()_-`

---

## 📧 Template HTML do Email

**Assunto:** Redefinir Senha - Núcleo Admin

**Variáveis a substituir:**

- `${nomeUsuario}` - Nome do usuário
- `${linkRedefinicao}` - Link completo: `{URL_FRONTEND}/reset-password?token={token}`
- `${anoAtual}` - Ano atual

```html
<!DOCTYPE html>
<html>
  <body
    style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;"
  >
    <table role="presentation" style="width:100%;border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:40px 0;">
          <table
            style="width:600px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);"
          >
            <!-- Cabeçalho -->
            <tr>
              <td
                style="padding:40px;text-align:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:8px 8px 0 0;"
              >
                <img
                  src="https://seu-dominio.com/logo-white.png"
                  alt="Núcleo Admin"
                  style="height:60px;"
                />
              </td>
            </tr>

            <!-- Título -->
            <tr>
              <td style="padding:40px 40px 20px;">
                <h1
                  style="margin:0;font-size:28px;font-weight:700;color:#1a1a1a;text-align:center;"
                >
                  Redefinir Senha
                </h1>
              </td>
            </tr>

            <!-- Conteúdo -->
            <tr>
              <td style="padding:0 40px 30px;">
                <p
                  style="margin:0 0 20px;font-size:16px;line-height:24px;color:#4a5568;"
                >
                  Olá, <strong>${nomeUsuario}</strong>!
                </p>
                <p
                  style="margin:0 0 20px;font-size:16px;line-height:24px;color:#4a5568;"
                >
                  Recebemos uma solicitação para redefinir a senha da sua conta
                  no <strong>Núcleo Admin</strong>.
                </p>
                <p
                  style="margin:0 0 30px;font-size:16px;line-height:24px;color:#4a5568;"
                >
                  Clique no botão abaixo para criar uma nova senha:
                </p>
              </td>
            </tr>

            <!-- Botão -->
            <tr>
              <td style="padding:0 40px 30px;text-align:center;">
                <a
                  href="${linkRedefinicao}"
                  style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:600;color:#fff;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);text-decoration:none;border-radius:6px;box-shadow:0 4px 6px rgba(102,126,234,0.4);"
                >
                  Redefinir Minha Senha
                </a>
              </td>
            </tr>

            <!-- Link Alternativo -->
            <tr>
              <td style="padding:0 40px 30px;">
                <p
                  style="margin:0 0 10px;font-size:14px;color:#718096;text-align:center;"
                >
                  Ou copie e cole este link no seu navegador:
                </p>
                <p
                  style="margin:0;font-size:12px;color:#667eea;word-break:break-all;text-align:center;"
                >
                  ${linkRedefinicao}
                </p>
              </td>
            </tr>

            <!-- Aviso de Segurança -->
            <tr>
              <td
                style="padding:30px 40px;background:#fef5e7;border-left:4px solid #f39c12;"
              >
                <p
                  style="margin:0 0 10px;font-size:14px;color:#856404;font-weight:600;"
                >
                  ⚠️ Informações Importantes:
                </p>
                <ul
                  style="margin:0;padding-left:20px;font-size:13px;color:#856404;"
                >
                  <li>Este link é válido por <strong>6 horas</strong></li>
                  <li>
                    Se você não solicitou esta redefinição, ignore este email
                  </li>
                  <li>
                    Sua senha atual permanecerá ativa até que você a altere
                  </li>
                </ul>
              </td>
            </tr>

            <!-- Rodapé -->
            <tr>
              <td
                style="padding:30px 40px;background:#f7fafc;border-radius:0 0 8px 8px;text-align:center;"
              >
                <p style="margin:0 0 10px;font-size:12px;color:#a0aec0;">
                  © ${anoAtual} Núcleo Admin. Todos os direitos reservados.
                </p>
                <p style="margin:0;font-size:12px;color:#a0aec0;">
                  Este é um email automático, por favor não responda.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 🗄️ Modelo de Dados Sugerido

**Tabela:** `tokens_redefinicao_senha`

| Campo        | Tipo         | Observação                  |
| ------------ | ------------ | --------------------------- |
| `id`         | VARCHAR(36)  | UUID                        |
| `usuario_id` | VARCHAR(36)  | FK para usuarios            |
| `hash_token` | VARCHAR(255) | Hash SHA-256 do token       |
| `expira_em`  | TIMESTAMP    | Data/hora de expiração (6h) |
| `usado`      | BOOLEAN      | Default: false              |
| `criado_em`  | TIMESTAMP    | Auto                        |

**Importante:**

- Nunca armazenar o token em texto puro, apenas o hash
- Token deve ser único (índice em `hash_token`)
- Após uso, marcar `usado = true`

---

## 🔐 Requisitos de Segurança

1. **Rate Limiting**: Máximo 3 solicitações por email em 1 hora
2. **Token Seguro**: 64 caracteres aleatórios (UUID + UUID sem hífens)
3. **Hash SHA-256**: Armazenar apenas hash do token
4. **Expiração**: 6 horas após criação
5. **Uso Único**: Invalidar token após uso
6. **Não Revelar**: Sempre retornar mensagem genérica de sucesso
7. **Limpeza**: Job para deletar tokens expirados (diariamente)

---

## 📋 Resumo

**Endpoints:**

- `POST /api/auth/esqueci-senha`
- `POST /api/auth/validar-token-redefinicao`
- `POST /api/auth/redefinir-senha`

**Frontend:**

- Rota: `/reset-password?token={token}`

**Email:**

- Link: `{URL_FRONTEND}/reset-password?token={token}`
- Template HTML fornecido acima
