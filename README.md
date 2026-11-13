# Projeto base do SAEP: sistema da barbearia

Este repositório traz a documentação que usamos em aula para montar um sistema completo:
banco de dados no PostgreSQL, API com Fastify e front-end em HTML, CSS e JavaScript.
O exemplo de toda a documentação é uma **barbearia** (barbeiros, clientes e agendamentos).
No simulado e na prova o tema é outro: use a documentação como modelo e adapte para o tema pedido.

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

## Onde está cada assunto

| Assunto | Documentação Simplificada (consulta rápida) | Documentação Completa (passo a passo) |
|---|---|---|
| Banco de dados: tabelas, INSERT, SELECT, JOIN | `SQL.md` | `backend/#0_SQL.md` |
| DER (der.png pelo pgAdmin) | | `backend/#0_SQL.md` (passo 13) |
| Busca por termo e listagem com JOIN | `API.md` | `backend/#1_busca_e_JOIN.md` |
| Cadastro com chave estrangeira e atualizar data | `API.md` | `backend/#2_cliente_e_agendamento_API.md` |
| Criptografia do CPF e da senha | `SQL.md` e `API.md` (pgcrypto) | `backend/#3_criptografia_e_login.md` (bcrypt) |
| Login e sessão com JWT | | `backend/#3_criptografia_e_login.md` |
| Testes com REST Client | `referencias.md` | dentro de cada arquivo |
| Front: fetch, CORS, tela de login e tela principal | | `frontend/#1_fetch_cors_login.md` |
| Front: listar, buscar, cadastrar, editar e excluir | | `frontend/#2_crud_barbeiro.md` |
| Front: cadastro com lista de escolha (select) | | `frontend/#3_cliente_dropdown.md` |
| Front: agendamentos ordenados e atualizar a data | | `frontend/#4_agendamentos.md` |

## Documentação de software (Anexo 1) pelo VS Code

O Anexo 1 está na raiz em dois formatos: o original do Word (`ANEXO 1 - Documentação de Software_Editável (1).doc`)
e o `documentacao.md`, com os mesmos campos, para preencher direto no VS Code:

1. Abra o `documentacao.md` e preencha nome, data, número da prova, requisitos funcionais e infraestrutura.
2. Clique com o botão direito dentro do texto e escolha **Markdown PDF: Export (pdf)**.
3. O `documentacao.pdf` aparece na mesma pasta. É esse arquivo que vai na entrega.
