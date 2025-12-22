# Correções Necessárias no Backend - Módulo de Planos e Licenças

## 1. Persistência de Campos Detalhados do Plano

Identificamos que, ao criar ou editar um plano com tipos de cobrança complexos (ex: "Por Usuário", "Pacote de Usuários"), os campos detalhados não estão sendo persistidos ou retornados corretamente pela API, retornando `null` mesmo quando enviados pelo frontend.

**Campos afetados:**

- `valorBase` (BigDecimal/Double)
- `valorPorUsuario` (BigDecimal/Double)
- `quantidadePacotes` (Integer)
- `usuariosPorPacote` (Integer)
- `recursosDetalhados` (Json/List)

**Ação Necessária:**
Verificar a entidade `Plano` e o DTO de entrada (`PlanoRequest` ou similar). Garantir que esses campos estejam mapeados corretamente no banco de dados e que o método de criação/atualização esteja copiando esses valores do DTO para a entidade.

**Exemplo de Payload enviado pelo Frontend (Correto):**

```json
{
  "nome": "Plano Flex",
  "tipoCobranca": "USUARIO",
  "valor": 150.0,
  "valorBase": 50.0,
  "valorPorUsuario": 10.0,
  "limiteUsuarios": 10
  // ...
}
```

**Retorno Atual (Incorreto):**

```json
{
  "tipoCobranca": "USUARIO",
  "valor": 150.00,
  "valorBase": null,       <-- ERRO
  "valorPorUsuario": null, <-- ERRO
  // ...
}
```

## 2. Redundância de Dados entre Plano e Licença

Para evitar redundância e inconsistência, sugere-se que a Licença possa herdar dinamicamente as configurações do Plano, mas mantendo a possibilidade de override (personalização).

**Sugestão de Ajuste na API de Licenças:**

- Ao criar uma licença (`POST /licencas`), se `limiteUsuarios` não for enviado (ou for null), o backend deve preencher automaticamente com o `limiteUsuarios` do plano selecionado.
- Se o plano tiver uma periodicidade definida (ex: mensal, anual - _sugere-se adicionar este campo ao Plano_), o backend poderia calcular a `dataExpiracao` automaticamente baseada na `dataInicio`, caso não seja fornecida.

## 3. Validação de Filtros de Data

No endpoint de listagem de licenças (`GET /licencas`), adicionar validação para garantir que `dataExpiracaoInicio` não seja maior que `dataExpiracaoFim`. Retornar `400 Bad Request` com mensagem clara caso ocorra.
