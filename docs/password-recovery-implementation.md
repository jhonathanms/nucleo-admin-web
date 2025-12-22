# Plano de Implementação - Recuperação de Senha

## 📋 Visão Geral

Este documento detalha a implementação completa do sistema de recuperação de senha, incluindo:

- Solicitação de recuperação de senha
- Envio de email com token seguro
- Validação e redefinição de senha
- Template HTML profissional para emails

---

## 🔐 Fluxo de Funcionamento

### 1. Solicitação de Recuperação

```
Usuário esquece senha → Clica "Esqueci a senha" → Informa email →
Sistema valida email → Gera token único → Envia email → Exibe confirmação
```

### 2. Validação e Redefinição

```
Usuário clica no link do email → Frontend valida token →
Usuário informa nova senha → Sistema valida complexidade →
Atualiza senha → Invalida token → Redireciona para login
```

---

## 🎯 Backend - Endpoints Necessários

### 1. POST `/api/auth/forgot-password`

**Request:**

```json
{
  "email": "usuario@exemplo.com"
}
```

**Response (200):**

```json
{
  "message": "Se o email existir, você receberá instruções para redefinir sua senha.",
  "success": true
}
```

**Observações:**

- Sempre retornar sucesso (security best practice - não revelar emails válidos)
- Gerar token único com 6 horas de validade
- Armazenar hash do token no banco de dados
- Enviar email apenas se o usuário existir

---

### 2. POST `/api/auth/validate-reset-token`

**Request:**

```json
{
  "token": "abc123xyz456"
}
```

**Response (200):**

```json
{
  "valid": true,
  "email": "usuario@exemplo.com"
}
```

**Response (400):**

```json
{
  "valid": false,
  "message": "Token inválido ou expirado"
}
```

---

### 3. POST `/api/auth/reset-password`

**Request:**

```json
{
  "token": "abc123xyz456",
  "newPassword": "SenhaForte@123"
}
```

**Response (200):**

```json
{
  "message": "Senha redefinida com sucesso",
  "success": true
}
```

**Response (400):**

```json
{
  "message": "Token inválido ou senha não atende aos requisitos",
  "errors": {
    "password": [
      "Senha deve conter pelo menos 8 caracteres",
      "Senha deve conter letras maiúsculas e minúsculas"
    ]
  }
}
```

---

## 🗄️ Banco de Dados

### Tabela: `password_reset_tokens`

```sql
CREATE TABLE password_reset_tokens (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expira_em TIMESTAMP NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_token_hash (token_hash),
  INDEX idx_expira_em (expira_em)
);
```

**Campos:**

- `id`: UUID do registro
- `usuario_id`: Referência ao usuário
- `token_hash`: Hash SHA-256 do token (nunca armazenar token em texto puro)
- `expira_em`: Data/hora de expiração (6 horas após criação)
- `usado`: Flag para invalidar token após uso
- `criado_em`: Timestamp de criação

---

## 📧 Serviço de Email

### Configuração Spring Boot

**1. Dependências (pom.xml):**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
<dependency>
    <groupId>org.thymeleaf</groupId>
    <artifactId>thymeleaf-spring6</artifactId>
</dependency>
```

**2. Configuração (application.yml):**

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${EMAIL_USERNAME}
    password: ${EMAIL_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
        transport:
          protocol: smtp

app:
  email:
    from: noreply@nucleoadmin.com
    from-name: Núcleo Admin
    reset-password-url: ${FRONTEND_URL}/reset-password
```

**3. Alternativas de Serviço de Email:**

- **Gmail SMTP** (desenvolvimento)
- **SendGrid** (recomendado para produção)
- **Amazon SES** (alta disponibilidade)
- **Mailgun** (fácil integração)

---

## 🎨 Template HTML do Email

### Estrutura do Template (Thymeleaf)

**Localização:** `src/main/resources/templates/email/password-reset.html`

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Redefinir Senha - Núcleo Admin</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;"
  >
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 40px 0;">
          <table
            role="presentation"
            style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
          >
            <!-- Header com Logo -->
            <tr>
              <td
                style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;"
              >
                <img
                  src="https://seu-dominio.com/logo-white.png"
                  alt="Núcleo Admin"
                  style="height: 60px; width: auto;"
                />
              </td>
            </tr>

            <!-- Título -->
            <tr>
              <td style="padding: 40px 40px 20px 40px;">
                <h1
                  style="margin: 0; font-size: 28px; font-weight: 700; color: #1a1a1a; text-align: center;"
                >
                  Redefinir Senha
                </h1>
              </td>
            </tr>

            <!-- Conteúdo -->
            <tr>
              <td style="padding: 0 40px 30px 40px;">
                <p
                  style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;"
                >
                  Olá, <strong th:text="${userName}">Usuário</strong>!
                </p>
                <p
                  style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;"
                >
                  Recebemos uma solicitação para redefinir a senha da sua conta
                  no <strong>Núcleo Admin</strong>.
                </p>
                <p
                  style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #4a5568;"
                >
                  Clique no botão abaixo para criar uma nova senha:
                </p>
              </td>
            </tr>

            <!-- Botão CTA -->
            <tr>
              <td style="padding: 0 40px 30px 40px; text-align: center;">
                <a
                  th:href="${resetLink}"
                  style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-decoration: none; border-radius: 6px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);"
                >
                  Redefinir Minha Senha
                </a>
              </td>
            </tr>

            <!-- Link alternativo -->
            <tr>
              <td style="padding: 0 40px 30px 40px;">
                <p
                  style="margin: 0 0 10px 0; font-size: 14px; line-height: 20px; color: #718096; text-align: center;"
                >
                  Ou copie e cole este link no seu navegador:
                </p>
                <p
                  style="margin: 0; font-size: 12px; line-height: 18px; color: #667eea; word-break: break-all; text-align: center;"
                >
                  <a
                    th:href="${resetLink}"
                    th:text="${resetLink}"
                    style="color: #667eea; text-decoration: none;"
                  >
                    link
                  </a>
                </p>
              </td>
            </tr>

            <!-- Informações de segurança -->
            <tr>
              <td
                style="padding: 30px 40px; background-color: #fef5e7; border-left: 4px solid #f39c12;"
              >
                <p
                  style="margin: 0 0 10px 0; font-size: 14px; line-height: 20px; color: #856404; font-weight: 600;"
                >
                  ⚠️ Informações Importantes:
                </p>
                <ul
                  style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 20px; color: #856404;"
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

            <!-- Footer -->
            <tr>
              <td
                style="padding: 30px 40px; background-color: #f7fafc; border-radius: 0 0 8px 8px; text-align: center;"
              >
                <p
                  style="margin: 0 0 10px 0; font-size: 12px; line-height: 18px; color: #a0aec0;"
                >
                  ©
                  <span th:text="${#dates.year(#dates.createNow())}">2024</span>
                  Núcleo Admin. Todos os direitos reservados.
                </p>
                <p
                  style="margin: 0; font-size: 12px; line-height: 18px; color: #a0aec0;"
                >
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

## 🔒 Validação de Senha Complexa

### Requisitos de Senha

```java
public class PasswordValidator {

    private static final int MIN_LENGTH = 8;
    private static final String UPPERCASE_PATTERN = ".*[A-Z].*";
    private static final String LOWERCASE_PATTERN = ".*[a-z].*";
    private static final String DIGIT_PATTERN = ".*\\d.*";
    private static final String SPECIAL_CHAR_PATTERN = ".*[@#$%^&+=!*()_-].*";

    public static List<String> validatePassword(String password) {
        List<String> errors = new ArrayList<>();

        if (password == null || password.length() < MIN_LENGTH) {
            errors.add("A senha deve ter no mínimo " + MIN_LENGTH + " caracteres");
        }

        if (!password.matches(UPPERCASE_PATTERN)) {
            errors.add("A senha deve conter pelo menos uma letra maiúscula");
        }

        if (!password.matches(LOWERCASE_PATTERN)) {
            errors.add("A senha deve conter pelo menos uma letra minúscula");
        }

        if (!password.matches(DIGIT_PATTERN)) {
            errors.add("A senha deve conter pelo menos um número");
        }

        if (!password.matches(SPECIAL_CHAR_PATTERN)) {
            errors.add("A senha deve conter pelo menos um caractere especial (@#$%^&+=!*()_-)");
        }

        return errors;
    }
}
```

---

## 🛡️ Segurança

### Boas Práticas Implementadas

1. **Token Seguro:**

   - Gerar token com 32+ caracteres aleatórios
   - Armazenar apenas hash SHA-256 no banco
   - Expiração de 6 horas
   - Invalidar após uso

2. **Rate Limiting:**

   - Máximo 3 solicitações por email em 1 hora
   - Previne spam e ataques

3. **Email Enumeration Protection:**

   - Sempre retornar mensagem genérica de sucesso
   - Não revelar se o email existe ou não

4. **Logging:**
   - Registrar todas as tentativas de recuperação
   - Monitorar padrões suspeitos

---

## 📱 Frontend - Recursos Necessários

### 1. Componente PasswordStrengthMeter

- Indicador visual de força da senha
- Validação em tempo real
- Feedback colorido (vermelho/amarelo/verde)

### 2. Modal de Recuperação

- Campo de email
- Validação de formato
- Feedback de envio

### 3. Página de Redefinição

- Validação de token
- Campos de nova senha e confirmação
- Indicador de força
- Validação de complexidade

### 4. LocalStorage para "Lembrar-me"

- Armazenar email (não senha)
- Limpar ao fazer logout
- Opção de desabilitar

---

## 🚀 Implementação Backend - Checklist

### Fase 1: Estrutura Base

- [ ] Criar entidade `PasswordResetToken`
- [ ] Criar repository `PasswordResetTokenRepository`
- [ ] Criar DTOs (Request/Response)
- [ ] Criar validadores de senha

### Fase 2: Serviços

- [ ] Implementar `EmailService`
- [ ] Configurar templates Thymeleaf
- [ ] Implementar `PasswordResetService`
- [ ] Adicionar geração de tokens seguros

### Fase 3: Controllers

- [ ] Endpoint `/forgot-password`
- [ ] Endpoint `/validate-reset-token`
- [ ] Endpoint `/reset-password`
- [ ] Testes unitários

### Fase 4: Email

- [ ] Configurar SMTP
- [ ] Criar template HTML
- [ ] Testar envio de emails
- [ ] Adicionar logo e imagens

### Fase 5: Segurança

- [ ] Implementar rate limiting
- [ ] Adicionar logging
- [ ] Testes de segurança
- [ ] Documentação API

---

## 📊 Exemplo de Código Backend (Spring Boot)

### Service

```java
@Service
public class PasswordResetService {

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmailService emailService;

    public void requestPasswordReset(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
            .orElse(null);

        if (usuario == null) {
            // Não revelar que o email não existe
            return;
        }

        // Gerar token único
        String token = generateSecureToken();
        String tokenHash = hashToken(token);

        // Salvar no banco
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUsuarioId(usuario.getId());
        resetToken.setTokenHash(tokenHash);
        resetToken.setExpiraEm(LocalDateTime.now().plusHours(6));
        tokenRepository.save(resetToken);

        // Enviar email
        String resetLink = buildResetLink(token);
        emailService.sendPasswordResetEmail(usuario, resetLink);
    }

    private String generateSecureToken() {
        return UUID.randomUUID().toString() +
               UUID.randomUUID().toString().replace("-", "");
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erro ao gerar hash", e);
        }
    }
}
```

---

## ✅ Conclusão

Este plano fornece uma implementação completa e segura do sistema de recuperação de senha, incluindo:

- ✅ Endpoints RESTful bem definidos
- ✅ Template HTML profissional
- ✅ Validação de senha robusta
- ✅ Medidas de segurança adequadas
- ✅ Experiência do usuário otimizada

**Próximos Passos:**

1. Implementar backend conforme especificação
2. Configurar serviço de email
3. Criar componentes frontend
4. Realizar testes de integração
5. Deploy em ambiente de homologação
