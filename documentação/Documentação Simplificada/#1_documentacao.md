# Documentação de software (Anexo 1)

```text
A primeira entrega da prova é o documentacao.pdf, feito a partir do Anexo 1.
No VS Code: abra o documentacao.md (raiz do projeto), preencha e gere o PDF:
botão direito dentro do texto > "Markdown PDF: Export (pdf)". O documentacao.pdf aparece na mesma pasta.

O que é avaliado:
- no mínimo 4 requisitos funcionais do sistema;
- os requisitos de infraestrutura: SGBD e linguagem de programação (com as versões).
```

## Requisito funcional: o que é

```text
Requisito funcional é uma coisa que o sistema FAZ, escrita do ponto de vista de quem usa.
Começa com um verbo: "O sistema deve permitir...", "O sistema deve exibir...".
Os requisitos saem do caderno de prova: leia a contextualização e as regras de negócio e transforme cada regra em uma linha.
```

## Exemplo preenchido (sistema da barbearia)

| ID | Requisito | Descrição |
|---|---|---|
| RF01 | Login | O sistema deve permitir que o barbeiro entre com CPF e senha cadastrados e mostrar uma mensagem quando o login falhar. |
| RF02 | Sessão com expiração | O sistema deve encerrar a sessão do usuário depois de um tempo, pedindo um novo login. |
| RF03 | Tela principal | O sistema deve exibir o nome do usuário logado, os links para Barbeiros, Clientes e Agendamentos e um botão para sair. |
| RF04 | Listar e excluir barbeiros | O sistema deve listar os barbeiros cadastrados e permitir excluir um barbeiro. |
| RF05 | Buscar barbeiro | O sistema deve permitir buscar barbeiros por um termo (nome) e atualizar a listagem com o resultado. |
| RF06 | Cadastrar e editar barbeiro | O sistema deve permitir cadastrar um barbeiro e editar os dados de um barbeiro já cadastrado, salvando no banco. |
| RF07 | Cadastrar cliente | O sistema deve permitir cadastrar um cliente associando-o a um barbeiro. |
| RF08 | Agendamentos | O sistema deve listar os agendamentos ordenados por data, com os dados do barbeiro e do cliente, e permitir atualizar a data de um agendamento. |

```text
Outros que também valem, se a prova pedir:
- O sistema deve armazenar o CPF e a senha de forma criptografada (LGPD).
- O sistema deve permitir cadastrar um agendamento escolhendo o barbeiro e o cliente.
```

## Requisitos de infraestrutura

```text
SGBD utilizado: PostgreSQL
Versão: veja no pgAdmin, no Query Tool:    SELECT version();      (ex: 17.x)

Linguagem de programação: JavaScript (Node.js)
Versão: veja no terminal do VS Code:      node -v                (ex: v22.x)
```

## Conferência final

```text
[ ] documentacao.md preenchido com nome, data e número da prova
[ ] pelo menos 4 requisitos funcionais (o modelo tem 8 linhas)
[ ] SGBD e linguagem com as versões
[ ] documentacao.pdf gerado na raiz do projeto
```
