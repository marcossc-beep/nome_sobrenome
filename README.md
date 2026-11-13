# Projeto base do SAEP: sistema da barbearia

Este repositório traz a documentação que usamos em aula para montar um sistema completo:
banco de dados no PostgreSQL, API com Fastify e front-end em HTML, CSS e JavaScript.
O exemplo de toda a documentação é uma **barbearia** (barbeiros, clientes e agendamentos).

## Como abrir

1. Clone o repositório e abra a pasta no VS Code:

```bash
git clone https://github.com/marcossc-beep/nome_sobrenome
```

2. Aceite as extensões recomendadas que o VS Code oferecer (REST Client, Markdown All in One, Markdown PDF e Live Server).
3. Os arquivos `.md` da documentação já abrem no modo de leitura. Para editar um deles, clique com o botão direito na aba e escolha **Reopen Editor With... > Text Editor**.
4. Instale as dependências e rode a API:

```bash
npm install
npm start
```

## Escolha UM caminho e siga até o fim

As duas documentações montam o sistema inteiro, cada uma do seu jeito. Não misture as duas no mesmo `server.js`:
as rotas têm os mesmos nomes e a API para com o erro `Method ... already declared for route`.

### Documentação Simplificada (sem criptografia)

Login com CPF e senha guardados como texto, sessão com tempo de expiração no navegador.

| Ordem | Arquivo | O que tem |
|---|---|---|
| 1 | `#1_documentacao.md` | Anexo 1: requisitos funcionais e de infraestrutura |
| 2 | `#2_SQL.md` | tabelas, INSERT, SELECT, JOIN, o `saep_db.sql` completo e o DER |
| 3 | `#3_API.md` | todas as rotas, uma por vez, e o `server.js` completo no fim |
| 4 | `#4_referencias.md` | testes no REST Client (`referencias.http`) |
| 5 | `#5_FRONT.md` | todas as telas da pasta FRONT, cada arquivo completo |

### Documentação Completa (com bcrypt e JWT)

CPF e senha criptografados com bcrypt na API e sessão com token JWT que expira.

| Ordem | Arquivo | O que tem |
|---|---|---|
| 0 | `#0_documentacao.md` | Anexo 1: requisitos funcionais e de infraestrutura |
| 1 | `backend/#0_SQL.md` | banco passo a passo, o `saep_db.sql` completo e o DER |
| 2 | `backend/#1_servidor_login_e_criptografia.md` | projeto, conexão, bcrypt, JWT, login e rotas de barbeiro |
| 3 | `backend/#2_busca_e_JOIN.md` | busca por termo e listagens com JOIN |
| 4 | `backend/#3_cliente_e_agendamento_API.md` | cliente, agendamento e o `server.js` completo no fim |
| 5 | `frontend/#1_fetch_cors_login.md` | fetch, sessão, tela de login e tela principal |
| 6 | `frontend/#2_crud_barbeiro.md` | listar, buscar, cadastrar, editar e excluir |
| 7 | `frontend/#3_cliente_dropdown.md` | cadastro com lista de escolha (select) |
| 8 | `frontend/#4_agendamentos.md` | agendamentos ordenados e atualizar a data |

## Documentação de software (Anexo 1) pelo VS Code

O Anexo 1 está na raiz em dois formatos: o original do Word (`ANEXO 1 - Documentação de Software_Editável (1).doc`)
e o `documentacao.md`, com os mesmos campos, para preencher direto no VS Code:

1. Abra o `documentacao.md` e preencha nome, data, número da prova, requisitos funcionais e infraestrutura.
2. Clique com o botão direito dentro do texto e escolha **Markdown PDF: Export (pdf)**.
3. O `documentacao.pdf` aparece na mesma pasta. É esse arquivo que vai na entrega.
