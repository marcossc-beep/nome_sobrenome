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

2. Aceite as extensões recomendadas que o VS Code oferecer (REST Client e Markdown All in One).
3. Os arquivos `.md` já abrem no modo de leitura. Para editar um deles, clique com o botão direito na aba e escolha **Reopen Editor With... > Text Editor**.
4. Instale as dependências e rode a API:

```bash
npm install
npm start
```

## Onde está cada assunto

| Assunto | Documentação Simplificada (consulta rápida) | Documentação Completa (passo a passo) |
|---|---|---|
| Banco de dados: tabelas, INSERT, SELECT, JOIN, DER | `SQL.md` | `backend/#0_SQL.md` |
| Busca por termo e listagem com JOIN | `API.md` | `backend/#1_busca_e_JOIN.md` |
| Cadastro com chave estrangeira e atualizar data | `API.md` | `backend/#2_cliente_e_agendamento_API.md` |
| Criptografia (bcrypt), login e sessão com JWT | `API.md` (resumo) | `backend/#3_criptografia_e_login.md` |
| Testes com REST Client | `referencias.md` | dentro de cada arquivo |
| Front: fetch, CORS, tela de login e tela principal | | `frontend/#1_fetch_cors_login.md` |
| Front: listar, buscar, cadastrar, editar e excluir | | `frontend/#2_crud_barbeiro.md` |
| Front: cadastro com lista de escolha (select) | | `frontend/#3_cliente_dropdown.md` |
| Front: agendamentos ordenados e atualizar a data | | `frontend/#4_agendamentos.md` |

O modelo da documentação de software (Anexo 1) está na raiz: `ANEXO 1 - Documentação de Software_Editável (1).doc`.
