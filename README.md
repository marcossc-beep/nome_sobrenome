# Projeto base do SAEP: sistema da barbearia

Documentação de consulta para o desenvolvimento de um sistema com banco de dados PostgreSQL, API em Node.js (Fastify) e front-end em HTML e JavaScript.
Todos os exemplos usam o sistema de uma **barbearia** (barbeiros, clientes e agendamentos).

## Como abrir

1. Clone o repositório e abra a pasta no VS Code:

```bash
git clone https://github.com/marcossc-beep/nome_sobrenome
```

2. Aceite as extensões recomendadas que o VS Code oferecer (REST Client, Markdown All in One, Markdown PDF e Live Server).
3. Os arquivos `.md` da documentação abrem no modo de leitura. Para editar um deles: botão direito na aba > **Reopen Editor With... > Text Editor**.
4. As dependências já estão na pasta `node_modules`. Para rodar a API:

```bash
npm start
```

## Documentação

Duas versões do mesmo sistema. Cada uma é completa por si; o `server.js` segue uma ou outra (as rotas têm os mesmos nomes e não podem aparecer duas vezes).

| Arquivo | `Documentação backend` | `Documentação frontend` |
|---|---|---|
| `00_documentacao_de_software.md` | Anexo 1: requisitos funcionais e de infraestrutura | igual |
| `01_postgresql.md` | tabelas, INSERT, SELECT, filtros, busca, ordenação, datas, JOIN, DER | + CPF e senha em hash bcrypt |
| `02_node_fastify.md` | API: estrutura do servidor, login e rotas | + bcrypt, JWT e rotas protegidas |
| `03_vscode_rest_client.md` | atalhos do VS Code, REST Client, PDF do Anexo 1 | + token nas requisições, Live Server |
| `04_front_html_js.md` | | telas: login, principal, barbeiros, clientes, agendamentos |

## Documentação de software (Anexo 1) pelo VS Code

O Anexo 1 está na raiz em dois formatos: o original do Word (`ANEXO 1 - Documentação de Software_Editável (1).doc`)
e o `documentacao.md`, com os mesmos campos, para preencher direto no VS Code e exportar com
**Markdown PDF: Export (pdf)** (botão direito dentro do texto). O `documentacao.pdf` é o arquivo da entrega.
