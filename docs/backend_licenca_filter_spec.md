# Especificação de Filtro de Licenças (Backend)

Este documento descreve os requisitos para a implementação ou atualização do endpoint de listagem de licenças para suportar filtros avançados.

## Endpoint

**GET** `/api/licencas`

## Parâmetros de Consulta (Query Parameters)

O endpoint deve aceitar os seguintes parâmetros opcionais para filtragem:

| Parâmetro             | Tipo              | Descrição                                                         | Exemplo                                |
| :-------------------- | :---------------- | :---------------------------------------------------------------- | :------------------------------------- |
| `clienteId`           | UUID              | Filtra licenças pertencentes a um cliente específico.             | `123e4567-e89b-12d3-a456-426614174000` |
| `produtoId`           | UUID              | Filtra licenças associadas a um produto específico.               | `a1b2c3d4-e5f6-7890-1234-567890abcdef` |
| `planoId`             | UUID              | Filtra licenças associadas a um plano específico.                 | `f1e2d3c4-b5a6-9087-6543-210987fedcba` |
| `status`              | String (Enum)     | Filtra licenças pelo status atual.                                | `ATIVO`, `SUSPENSO`, `TRIAL`           |
| `dataExpiracaoInicio` | Date (YYYY-MM-DD) | Filtra licenças com data de expiração maior ou igual a esta data. | `2024-01-01`                           |
| `dataExpiracaoFim`    | Date (YYYY-MM-DD) | Filtra licenças com data de expiração menor ou igual a esta data. | `2024-12-31`                           |
| `page`                | Integer           | Número da página (zero-based).                                    | `0`                                    |
| `size`                | Integer           | Tamanho da página.                                                | `20`                                   |
| `sort`                | String            | Ordenação dos resultados.                                         | `dataExpiracao,desc`                   |

## Comportamento Esperado

1.  **Combinação de Filtros**: Todos os filtros fornecidos devem ser aplicados em conjunto (lógica **AND**).
    - Exemplo: Se `clienteId` e `status` forem fornecidos, retornar apenas licenças desse cliente COM esse status.
2.  **Parâmetros Opcionais**: Se um parâmetro não for fornecido (null), ele deve ser ignorado na filtragem.
3.  **Intervalo de Datas**:
    - `dataExpiracaoInicio`: Licenças expirando a partir desta data (inclusive).
    - `dataExpiracaoFim`: Licenças expirando até esta data (inclusive).
    - Se apenas um for fornecido, aplicar filtro aberto (ex: apenas `>= inicio` ou apenas `<= fim`).

## Sugestão de Implementação (Spring Boot + JPA)

Recomenda-se o uso de `JpaSpecificationExecutor` para construir a query dinamicamente.

### 1. Controller

```java
@GetMapping
public ResponseEntity<Page<LicencaDTO>> getAll(
    @RequestParam(required = false) UUID clienteId,
    @RequestParam(required = false) UUID produtoId,
    @RequestParam(required = false) UUID planoId,
    @RequestParam(required = false) LicencaStatus status,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataExpiracaoInicio,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataExpiracaoFim,
    Pageable pageable
) {
    LicencaFilter filter = LicencaFilter.builder()
        .clienteId(clienteId)
        .produtoId(produtoId)
        .planoId(planoId)
        .status(status)
        .dataExpiracaoInicio(dataExpiracaoInicio)
        .dataExpiracaoFim(dataExpiracaoFim)
        .build();

    Page<LicencaDTO> licencas = licencaService.findAll(filter, pageable);
    return ResponseEntity.ok(licencas);
}
```

### 2. Specification

```java
public class LicencaSpecs {
    public static Specification<Licenca> withFilter(LicencaFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getClienteId() != null) {
                predicates.add(cb.equal(root.get("cliente").get("id"), filter.getClienteId()));
            }
            if (filter.getProdutoId() != null) {
                predicates.add(cb.equal(root.get("produto").get("id"), filter.getProdutoId()));
            }
            if (filter.getPlanoId() != null) {
                predicates.add(cb.equal(root.get("plano").get("id"), filter.getPlanoId()));
            }
            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }
            if (filter.getDataExpiracaoInicio() != null) {
                // Converte LocalDate para LocalDateTime no inicio do dia para comparação correta se o banco usar timestamp
                // Ou usa apenas a data se o banco usar DATE
                predicates.add(cb.greaterThanOrEqualTo(root.get("dataExpiracao"), filter.getDataExpiracaoInicio().atStartOfDay()));
            }
            if (filter.getDataExpiracaoFim() != null) {
                // Converte LocalDate para LocalDateTime no final do dia
                predicates.add(cb.lessThanOrEqualTo(root.get("dataExpiracao"), filter.getDataExpiracaoFim().atTime(LocalTime.MAX)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
```

### 3. Service

```java
public Page<LicencaDTO> findAll(LicencaFilter filter, Pageable pageable) {
    Specification<Licenca> spec = LicencaSpecs.withFilter(filter);
    return licencaRepository.findAll(spec, pageable).map(licencaMapper::toDTO);
}
```
