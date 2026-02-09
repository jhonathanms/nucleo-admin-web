# Instruções para Consumo de Exceções (Frontend AI)

Este documento detalha o novo modelo padronizado para tratamento de erros e exceções na API do Núcleo Admin.

## 1. Estrutura da Resposta de Erro

A API pode retornar erros em dois formatos, dependendo do tipo de exceção:

### Formato 1: Array de `ErroDTO`

Este formato é utilizado para erros que podem ter múltiplas ocorrências ou que são tratados por handlers que agrupam erros (como validações de campos ou erros de runtime/HTTP genéricos).

**Exemplos de Handlers que retornam este formato:**
- `ConstraintHandlerEx` (para `ConstraintViolationException`)
- `RuntimeExceptionHandler` (para `RuntimeException`)
- `HttpMessageHandler` (para `HttpMessageNotReadableException`)

**Estrutura:** Um array de objetos `ErroDTO`.

```json
[
  {
    "codigo": integer,
    "mensagem": "string",
    "metadata": object | null
  },
  // ... outros ErroDTOs se houver múltiplas ocorrências
]
```

**Exemplo de Resposta (Status 400 Bad Request - Erro de Validação):**

```json
[
  {
    "codigo": -998,
    "mensagem": "Nome é obrigatório",
    "metadata": "nome"
  },
  {
    "codigo": -998,
    "mensagem": "Email inválido",
    "metadata": "email"
  }
]
```

### Formato 2: Objeto `ErroDTO` Único

Este formato é utilizado para erros específicos que são tratados individualmente e não se espera que ocorram em múltiplas instâncias simultaneamente (como erros de validação de negócio ou de autenticação/autorização).

**Exemplos de Handlers que retornam este formato:**
- `ValidationExceptionHandler` (para `ValidationException`)
- `UnauthorizedExceptionHandler` (para `UnauthorizedException`)

**Estrutura:** Um único objeto `ErroDTO`.

```json
{
  "codigo": integer,
  "mensagem": "string",
  "metadata": object | null
}
```

**Exemplo de Resposta (Status 401 Unauthorized):**

```json
{
  "codigo": -3,
  "mensagem": "Credenciais inválidas",
  "metadata": null
}
```

### Modelo `ErroDTO` (Detalhes)

-   **`codigo` (integer)**: Um código numérico único que representa o erro específico. Este código é estável e pode ser usado para lógicas de tratamento no frontend.
-   **`mensagem` (string)**: Uma mensagem descritiva e legível sobre o erro.
-   **`metadata` (object | null)**: Um campo opcional que pode conter informações adicionais. Para erros de validação de campo (`-998`), este campo geralmente conterá o nome do campo que falhou.

## 2. Status HTTP

A API utilizará os seguintes status HTTP para indicar a natureza do erro:

-   **`400 Bad Request`**: Usado para erros de validação de dados (ex: campos obrigatórios faltando, formato inválido) ou erros de negócio. O `codigo` será tipicamente `-998` ou outros códigos de validação de negócio.
-   **`401 Unauthorized`**: Usado para qualquer falha relacionada à autenticação ou autorização (token inválido, credenciais incorretas, falta de permissão, etc.). Os códigos de erro específicos detalharão o motivo.
-   **`404 Not Found`**: Usado quando um recurso específico não é encontrado.
-   **`500 Internal Server Error`**: Usado para erros inesperados no servidor. O `codigo` será `-999`.

## 3. Tabela de Códigos de Erro (`EValidacao`)

A seguir está a lista completa de códigos de erro que podem ser retornados no campo `codigo` do `ErroDTO`.

| Código | Mensagem                                     | Status HTTP Comum | Causa Provável                                                              |
| :----- | :------------------------------------------- | :---------------- | :-------------------------------------------------------------------------- |
| -1     | Token inválido                               | 401 Unauthorized  | O token JWT está malformado ou a assinatura é inválida.                     |
| -2     | Token expirado                               | 401 Unauthorized  | O token JWT ultrapassou seu tempo de vida.                                  |
| -3     | Credenciais inválidas                         | 401 Unauthorized  | A combinação de email e senha está incorreta.                               |
| -4     | Usuário inativo                              | 401 Unauthorized  | O usuário tentou logar, mas sua conta está marcada como inativa.            |
| -5     | Usuário não encontrado                       | 401 Unauthorized  | O email fornecido para login não corresponde a nenhum usuário.              |
| -6     | Licença inativa                              | 401 Unauthorized  | A licença do usuário para o produto está inativa.                           |
| -7     | Licença expirada                             | 401 Unauthorized  | A data de expiração da licença foi ultrapassada.                            |
| -8     | Usuário sem licença ativa para o produto     | 401 Unauthorized  | O usuário não possui nenhum vínculo com o produto que está tentando acessar. |
| -9     | Usuário não possui permissão de administrador | 401 Unauthorized  | Uma ação que requer privilégios de administrador foi tentada por um não-admin. |
| -10    | Sessão inválida                              | 401 Unauthorized  | A sessão do usuário foi invalidada manualmente (ex: logout em outro local). |
| -11    | Sessão expirada                              | 401 Unauthorized  | A sessão do usuário expirou por inatividade.                                |
| -12    | Token revogado                               | 401 Unauthorized  | O token foi explicitamente revogado antes de sua expiração natural.         |
| -13    | Usuário não possui vínculo com esta licença  | 401 Unauthorized  | O usuário tentou acessar ou selecionar uma licença à qual não está vinculado. |
| -14    | Licença não encontrada                       | 401 Unauthorized  | A licença especificada em uma requisição não existe.                        |
| -15    | Usuário inativo para a licença               | 401 Unauthorized  | O vínculo específico do usuário com a licença está inativo.                 |
| -998   | Entrada de dados inválida                    | 400 Bad Request   | Erro genérico para falhas de validação de campos.                           |
| -999   | Erro interno do servidor                     | 500 Internal Server | Um erro inesperado ocorreu no backend.                                      |