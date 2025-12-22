# Atualização Backend - Persistência de Tema

Implemente as seguintes alterações no backend Spring Boot para suportar a persistência do tema do usuário:

1.  **Entidade Usuario**: Adicione o campo `private String tema;` (pode ser null, default "system").
2.  **DTOs**: Adicione o campo `tema` no `UsuarioDTO` (retornado no login/perfil).
3.  **Endpoint**: Crie um novo endpoint no `AuthController` (ou `UsuarioController`):
    - **Método**: `PUT`
    - **Path**: `/auth/theme`
    - **Body**: `Map<String, String>` (ex: `{"theme": "dark"}`)
    - **Ação**: Atualizar o campo `tema` do usuário autenticado.
4.  **Login**: Garanta que o endpoint de login (`/auth/login`) retorne o objeto `user` com o campo `tema` preenchido.

**Exemplo de Controller:**

```java
@PutMapping("/theme")
public ResponseEntity<?> updateTheme(@RequestBody Map<String, String> payload, Authentication authentication) {
    String theme = payload.get("theme");
    usuarioService.updateTheme(authentication.getName(), theme);
    return ResponseEntity.ok().build();
}
```
