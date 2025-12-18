# Lista de Serviços Frontend Implementados

Este documento lista todos os serviços implementados no frontend `nucleo-admin-web` e os endpoints de API que eles consomem. Utilize esta lista para validar a implementação do backend e criar os endpoints faltantes.

## 1. Autenticação (`AuthService`)

**Base URL**: `/auth`

| Método | Endpoint                | Descrição                                  |
| ------ | ----------------------- | ------------------------------------------ |
| POST   | `/auth/login`           | Realiza login (retorna tokens e user)      |
| POST   | `/auth/logout`          | Realiza logout (invalida sessão)           |
| POST   | `/auth/refresh`         | Renova o access token usando refresh token |
| GET    | `/auth/me`              | Retorna dados do usuário autenticado       |
| PUT    | `/auth/profile`         | Atualiza perfil do usuário logado          |
| POST   | `/auth/change-password` | Altera senha do usuário logado             |

## 2. Clientes (`ClienteService`)

**Base URL**: `/clientes`

| Método | Endpoint                     | Descrição                   |
| ------ | ---------------------------- | --------------------------- |
| GET    | `/clientes`                  | Lista clientes (paginado)   |
| GET    | `/clientes/{id}`             | Busca cliente por ID        |
| POST   | `/clientes`                  | Cria novo cliente           |
| PUT    | `/clientes/{id}`             | Atualiza cliente            |
| DELETE | `/clientes/{id}`             | Remove cliente              |
| GET    | `/clientes/search?q={query}` | Busca clientes por nome/doc |
| GET    | `/clientes/status/{status}`  | Lista clientes por status   |
| PATCH  | `/clientes/{id}/suspend`     | Suspende cliente            |
| PATCH  | `/clientes/{id}/activate`    | Ativa cliente               |

## 3. Produtos (`ProdutoService`)

**Base URL**: `/produtos`

| Método | Endpoint                | Descrição                    |
| ------ | ----------------------- | ---------------------------- |
| GET    | `/produtos`             | Lista produtos (paginado)    |
| GET    | `/produtos/{id}`        | Busca produto por ID         |
| POST   | `/produtos`             | Cria novo produto            |
| PUT    | `/produtos/{id}`        | Atualiza produto             |
| DELETE | `/produtos/{id}`        | Remove produto               |
| GET    | `/produtos/tipo/{tipo}` | Lista produtos por tipo      |
| GET    | `/produtos/ativos`      | Lista apenas produtos ativos |

## 4. Planos (`PlanoService`)

**Base URL**: `/planos`

| Método | Endpoint                      | Descrição                  |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/planos`                     | Lista planos (paginado)    |
| GET    | `/planos/{id}`                | Busca plano por ID         |
| POST   | `/planos`                     | Cria novo plano            |
| PUT    | `/planos/{id}`                | Atualiza plano             |
| DELETE | `/planos/{id}`                | Remove plano               |
| GET    | `/planos/produto/{produtoId}` | Lista planos de um produto |
| POST   | `/planos/{id}/duplicate`      | Duplica um plano existente |

## 5. Licenças (`LicencaService`)

**Base URL**: `/licencas`

| Método | Endpoint                        | Descrição                          |
| ------ | ------------------------------- | ---------------------------------- |
| GET    | `/licencas`                     | Lista licenças (paginado)          |
| GET    | `/licencas/{id}`                | Busca licença por ID               |
| POST   | `/licencas`                     | Cria nova licença                  |
| PUT    | `/licencas/{id}`                | Atualiza licença                   |
| DELETE | `/licencas/{id}`                | Remove licença                     |
| GET    | `/licencas/cliente/{clienteId}` | Lista licenças de um cliente       |
| POST   | `/licencas/{id}/renovar`        | Renova licença (body: `{ meses }`) |
| PATCH  | `/licencas/{id}/suspender`      | Suspende licença                   |
| PATCH  | `/licencas/{id}/ativar`         | Ativa licença                      |
| GET    | `/licencas/gerar-chave`         | Gera uma chave de licença única    |

## 6. Usuários (`UsuarioService`)

**Base URL**: `/usuarios`

| Método | Endpoint                        | Descrição                            |
| ------ | ------------------------------- | ------------------------------------ |
| GET    | `/usuarios`                     | Lista usuários (paginado)            |
| GET    | `/usuarios/{id}`                | Busca usuário por ID                 |
| POST   | `/usuarios`                     | Cria novo usuário                    |
| PUT    | `/usuarios/{id}`                | Atualiza usuário                     |
| DELETE | `/usuarios/{id}`                | Remove usuário                       |
| POST   | `/usuarios/{id}/reset-password` | Reseta senha (body: `{ novaSenha }`) |
| GET    | `/usuarios/role/{role}`         | Lista usuários por perfil            |

## 7. Financeiro (`FinanceiroService`)

**Base URL**: `/financeiro`

| Método | Endpoint                             | Descrição                |
| ------ | ------------------------------------ | ------------------------ |
| GET    | `/financeiro/titulos`                | Lista títulos (paginado) |
| GET    | `/financeiro/titulos/{id}`           | Busca título por ID      |
| POST   | `/financeiro/titulos`                | Cria novo título         |
| PUT    | `/financeiro/titulos/{id}`           | Atualiza título          |
| DELETE | `/financeiro/titulos/{id}`           | Remove título            |
| POST   | `/financeiro/titulos/{id}/pagamento` | Registra pagamento       |
| POST   | `/financeiro/titulos/{id}/cancelar`  | Cancela título           |

## 8. Auditoria (`AuditoriaService`)

**Base URL**: `/auditoria`

| Método | Endpoint          | Descrição                                          |
| ------ | ----------------- | -------------------------------------------------- |
| GET    | `/auditoria/logs` | Lista logs de auditoria (filtros via query params) |

---

**Observação**: O `DashboardService` no frontend atualmente agrega dados chamando `clienteService`, `licencaService` e `usuarioService`. Para melhor performance, recomenda-se criar um endpoint dedicado no backend:

- GET `/dashboard/stats` (Retorna contagens e gráficos agregados)
