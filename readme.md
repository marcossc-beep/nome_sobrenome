Na pasta documentação tem as documentações das ferramentas. Não alterem nem apaguem essa pasta.

Extensões: Lembrem-se de verificar se a extensão REST Client está ativa no VS Code e salvem todos os arquivos nos locais corretos.

# Simulado SAEP 2026 - Barbearia

Stack da prova: Node.js + Fastify + PostgreSQL 17, com bcrypt (senha e CPF) e JWT (sessão com expiração).
A pasta node_modules já está pronta, não precisa rodar npm install.

## Como começar

1. No pgAdmin: `CREATE DATABASE saep_db;` e abra o Query Tool dentro desse banco.
2. Ajuste usuário, senha e porta do Postgres no `Pool` do `server.js` (a senha da SUA máquina).
3. Rode a API: `npm start` (porta 6767).
4. Abra a pasta `FRONT` com o Live Server do VS Code.

## Arquivos do projeto

| Arquivo | Para quê |
|---|---|
| `server.js` | API (Fastify) |
| `saep_db.sql` | script do banco (entrega 3) |
| `referencias.http` | testes da API com REST Client |
| `FRONT/` | telas (index.html é o login) |
| `ANEXO 1 - Documentação de Software_Editável.doc` | documentação da entrega 1 |

## Qual documentação usar em cada etapa

Documentação Simplificada é o básico para fazer o banco e o CRUD da API.
Documentação Completa vai mais a fundo e tem duas pastas: backend (banco, API, login e segurança) e frontend (as telas).
Quem vai fazer só o front-end usa a pasta frontend (a API precisa estar rodando).
Em cada arquivo, as linhas `// >>>` e `// <<<` só marcam onde o código começa e termina. Não copie essas linhas.

| Etapa | Arquivos |
|---|---|
| Ler a prova, Anexo 1, entregas e .zip | Simplificada / ANEXO1_E_ENTREGAS.txt |
| Banco: tabelas, inserts, DER, saep_db.sql | Simplificada / SQL.txt (resumo) e Completa / backend / #0_SQL.txt (passo a passo) |
| API: primeiro CRUD (GET, POST, PUT, DELETE) | Simplificada / API.txt |
| API: busca, JOIN, cliente e agendamento | Simplificada / API.txt (seções EXTRA), Completa / backend / #1_busca_e_JOIN.txt e #2_cliente_e_agendamento_API.txt |
| Login, bcrypt e JWT | Completa / backend / #3_criptografia_e_login.txt |
| CORS, fetch, tela de login, sessão e principal | Completa / frontend / #1_fetch_cors_login.txt |
| Tela de barbeiro (CRUD, busca, edição) | Completa / frontend / #2_crud_barbeiro.txt |
| Tela de cliente (select com chave estrangeira) | Completa / frontend / #3_cliente_dropdown.txt |
| Tela de agendamentos | Completa / frontend / #4_agendamentos.txt |

## Ordem das entregas (a mesma do caderno de prova)

1. documentacao.pdf (Anexo 1: requisitos funcionais + SGBD e linguagem com versões)
2. der.png ou der.pdf (pgAdmin: botão direito no banco > ERD For Database)
3. saep_db.sql (CREATE TABLE + mínimo 3 INSERT por tabela)
4. Login (com validação e sessão com tempo de expiração)
5. Principal (nome do usuário, menu para Barbeiro/Cliente/Agendamento e Sair)
6. Barbeiro (listar, buscar, cadastrar, editar, excluir, CPF e senha criptografados)
7. Cliente (cadastrar associando a um barbeiro)
8. Agendamento (listar ordenado por data com dados do barbeiro e do cliente, atualizar a data)

## Entrega final

Crie uma pasta com o seu nome completo contendo `documentacao.pdf`, `der.png`, `saep_db.sql` e a pasta `sistema`
(com `server.js`, `package.json`, `package-lock.json`, `referencias.http` e a pasta `FRONT`; sem node_modules).
Compacte (.zip) e confira o conteúdo do .zip. Passo a passo em Simplificada / ANEXO1_E_ENTREGAS.txt.
