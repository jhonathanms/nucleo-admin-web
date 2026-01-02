# Changelog

## [Unreleased] - 2026-01-02

### Adicionado

- **Licenças**: Suporte completo para licenças com cobrança por dispositivo (`POR_DISPOSITIVO`).
- **Licenças**: Ícones dinâmicos na tabela de licenças (Monitor, Tablet, Smartphone) baseados no produto.
- **Dispositivos**: Modal de gerenciamento de dispositivos (listar, bloquear, desbloquear, remover).
- **Dispositivos**: Serviço `DispositivoService` atualizado para usar paginação e métodos POST para ações.

### Alterado

- **Usuários**: Remoção do perfil `GERENTE`. Sistema unificado em `ADMIN` e `OPERADOR`.
- **Usuários**: Endpoint de revogação de sessão atualizado para `/auth/revogar-sessoes/{id}`.
- **Licenças**: Lógica de verificação de títulos financeiros aprimorada para evitar falsos positivos.
- **Licenças**: Coluna "Uso / Limite" agora exibe corretamente dados baseados no tipo de controle.
- **Planos**: Correção no carregamento de dados de edição para planos com limite de dispositivos.

### Corrigido

- **UX**: Bug de auto-fill do navegador interferindo na busca de usuários e modal de senha.
- **UX**: Feedback visual ao editar e-mail de usuário.
- **Bug**: Erro `dispositivos.filter is not a function` ao abrir modal de dispositivos.
- **Bug**: Usuário principal não sendo carregado ao editar licença por dispositivo.
