# Documentação de software (Anexo 1)

Entregável: `documentacao.pdf`, gerado a partir do `documentacao.md` da raiz do projeto (exportação descrita em `03_vscode_rest_client.md`, seção Markdown PDF).

## Requisitos funcionais

Descrevem o que o sistema faz, do ponto de vista de quem usa. Saem da contextualização e das regras de negócio do caderno de prova.

Formato: `O sistema deve permitir...` / `O sistema deve exibir...`

### Exemplo: sistema da barbearia

| ID | Requisito | Descrição |
|---|---|---|
| RF01 | Login | O sistema deve permitir que o barbeiro entre com CPF e senha cadastrados e exibir uma mensagem quando o login falhar. |
| RF02 | Sessão com expiração | O sistema deve encerrar a sessão do usuário após um tempo, exigindo novo login. |
| RF03 | Tela principal | O sistema deve exibir o nome do usuário logado, o acesso a Barbeiros, Clientes e Agendamentos e uma opção para sair. |
| RF04 | Listar e excluir barbeiros | O sistema deve listar os barbeiros cadastrados e permitir a exclusão de um barbeiro. |
| RF05 | Buscar barbeiro | O sistema deve permitir a busca de barbeiros por um termo (nome), atualizando a listagem com o resultado. |
| RF06 | Cadastrar e editar barbeiro | O sistema deve permitir cadastrar um barbeiro e editar os dados de um barbeiro já cadastrado. |
| RF07 | Cadastrar cliente | O sistema deve permitir cadastrar um cliente associado a um barbeiro. |
| RF08 | Agendamentos | O sistema deve listar os agendamentos ordenados por data, com os dados do barbeiro e do cliente, e permitir atualizar a data de um agendamento. |
| RF09 | Proteção de dados | O sistema deve armazenar o CPF e a senha de forma criptografada (LGPD). |
| RF10 | Cadastrar agendamento | O sistema deve permitir cadastrar um agendamento escolhendo o barbeiro, o cliente e a data. |

## Requisitos de infraestrutura

| Item | Valor | Versão |
|---|---|---|
| SGBD | PostgreSQL | pgAdmin > Query Tool: `SELECT version();` |
| Linguagem de programação | JavaScript (Node.js) | terminal do VS Code: `node -v` |

## Diagrama entidade-relacionamento

Gerado pelo pgAdmin (ERD Tool) e exportado como `der.png`. Ver `01_postgresql.md`, seção pgAdmin 4.
