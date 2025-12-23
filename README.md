# 🚀 Núcleo Admin - Sistema de Gestão SaaS

Bem-vindo ao **Núcleo Admin**! Este é um sistema moderno de gestão de licenças e administração para plataformas SaaS. Ele foi construído com foco em performance, usabilidade e um design premium.

---

## 📋 Sobre o Projeto

O Núcleo Admin permite centralizar o controle de clientes, produtos, planos e licenças. Além disso, possui um módulo financeiro completo para gestão de cobranças e um sistema de auditoria para rastrear todas as ações importantes no sistema.

### Principais Funcionalidades:

- **Dashboard**: Visão geral de métricas e estatísticas.
- **Gestão de Clientes**: Cadastro e monitoramento de empresas/clientes.
- **Produtos e Planos**: Configuração de produtos SaaS e seus respectivos planos de assinatura.
- **Licenciamento**: Controle total sobre a expiração e status das licenças.
- **Financeiro**: Emissão de cobranças, registro de pagamentos e exportação de relatórios (CSV/PDF).
- **Editor de E-mail**: Editor de rich text (Visual e HTML) para personalizar mensagens de cobrança.
- **Auditoria**: Log detalhado de atividades para segurança e conformidade.

---

## 🛠️ Tecnologias Utilizadas

Este projeto utiliza o que há de mais moderno no ecossistema Frontend:

- **[React](https://reactjs.org/)**: Biblioteca principal para a interface.
- **[Vite](https://vitejs.dev/)**: Ferramenta de build ultra-rápida.
- **[TypeScript](https://www.typescriptlang.org/)**: Tipagem estática para evitar erros e melhorar o desenvolvimento.
- **[Tailwind CSS](https://tailwindcss.com/)**: Estilização baseada em utilitários.
- **[Shadcn/UI](https://ui.shadcn.com/)**: Componentes de interface acessíveis e elegantes.
- **[Lucide React](https://lucide.dev/)**: Biblioteca de ícones modernos.
- **[Axios](https://axios-http.com/)**: Cliente HTTP para comunicação com a API.

---

## 🚀 Como Começar (Localmente)

Siga estes passos para rodar o projeto na sua máquina:

### 1. Pré-requisitos

Certifique-se de ter o **Node.js** (versão 18 ou superior) e o **npm** instalados.

### 2. Instalação

Clone o repositório e instale as dependências:

```bash
# Instalar dependências
npm install
```

### 3. Configuração

Crie um arquivo `.env` na raiz do projeto (ou edite o existente) com as seguintes variáveis:

```env
VITE_API_BASE_URL=http://localhost:8680/api
VITE_API_TIMEOUT=30000
VITE_TAG_PRODUTO=APP_NUCLEO_ADMIN
```

### 4. Execução

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse `http://localhost:5173` no seu navegador.

---

## 🐳 Rodando com Docker

Se você prefere usar Docker para facilitar o deploy ou o desenvolvimento:

### Usando Docker Compose (Recomendado)

```bash
# Construir e subir o container
docker-compose up -d --build
```

A aplicação estará disponível em `http://localhost:8080`.

---

## 📂 Estrutura de Pastas

Para te ajudar a se localizar no projeto:

- `src/components`: Componentes reutilizáveis (botões, inputs, modais).
- `src/pages`: As telas principais do sistema (Login, Dashboard, Financeiro, etc).
- `src/services`: Arquivos que fazem as chamadas para a API (Backend).
- `src/types`: Definições de tipos TypeScript (Interfaces e DTOs).
- `src/hooks`: Hooks customizados do React.
- `src/lib`: Configurações de bibliotecas externas (como o Axios).

---

## 📝 Dicas para Devs Junior

- **Componentes**: Antes de criar um componente novo, veja se ele já não existe em `src/components/ui`.
- **Estilização**: Use as classes do Tailwind diretamente no JSX. Se precisar de algo muito específico, use o arquivo `index.css`.
- **API**: Todas as chamadas para o backend devem passar pelos arquivos em `src/services`.
- **Tipagem**: Sempre defina os tipos para as props e retornos de funções para manter o código seguro.

---

Desenvolvido com ❤️ por **Jhonathan Martins**.
