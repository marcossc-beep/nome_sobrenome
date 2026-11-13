# VS Code, REST Client e Markdown PDF

Referências:
- VS Code: https://code.visualstudio.com/docs
- REST Client: https://marketplace.visualstudio.com/items?itemName=humao.rest-client
- Markdown PDF: https://marketplace.visualstudio.com/items?itemName=yzane.markdown-pdf

## VS Code

| Atalho | Ação |
|---|---|
| Ctrl + ' | abre o terminal integrado |
| Ctrl + C (no terminal) | para a API |
| Ctrl + P | abre arquivo pelo nome |
| Ctrl + Shift + F | busca em todos os arquivos |
| Ctrl + / | comenta ou descomenta a linha |
| Ctrl + Shift + V | visualização de um arquivo `.md` |

A API roda com `npm start` e reinicia sozinha quando o `server.js` é salvo.

## Markdown PDF (documentacao.pdf)

O `documentacao.md` da raiz do projeto tem os campos do Anexo 1. Exportação: botão direito dentro do texto > **Markdown PDF: Export (pdf)**. O `documentacao.pdf` é criado na mesma pasta.

## REST Client

Arquivos com extensão `.http` (no projeto: `referencias.http`). Cada requisição é separada por `###`. O link **Send Request** aparece acima de cada uma. Entre os cabeçalhos e o corpo é obrigatória uma linha em branco. GET e DELETE não têm corpo.

```http
@base = http://localhost:6767

### Login
POST {{base}}/login
Content-Type: application/json

{
    "cpf": "111.222.333-44",
    "senha": "senha123"
}

### Login com senha errada (401)
POST {{base}}/login
Content-Type: application/json

{
    "cpf": "111.222.333-44",
    "senha": "errada"
}

### Listar barbeiros
GET {{base}}/barbeiros

### Buscar barbeiros por nome
GET {{base}}/barbeiros?busca=ana

### Cadastrar barbeiro
POST {{base}}/barbeiros
Content-Type: application/json

{
    "nome": "Thiago Pente",
    "cpf": "777.888.999-00",
    "senha": "senha000"
}

### Editar barbeiro 1
PUT {{base}}/barbeiros/1
Content-Type: application/json

{
    "nome": "Carlos Silva Souza",
    "cpf": "111.222.333-44"
}

### Excluir barbeiro 3
DELETE {{base}}/barbeiros/3

### Listar clientes (com o nome do barbeiro)
GET {{base}}/clientes

### Cadastrar cliente associado ao barbeiro 1
POST {{base}}/clientes
Content-Type: application/json

{
    "nome": "Lucas Ferreira",
    "cpf": "888.999.000-11",
    "barbeiro_id": 1
}

### Cliente com barbeiro inexistente (400)
POST {{base}}/clientes
Content-Type: application/json

{
    "nome": "Teste",
    "cpf": "000.000.000-00",
    "barbeiro_id": 999
}

### Listar agendamentos (ordenados por data)
GET {{base}}/agendamentos

### Cadastrar agendamento
POST {{base}}/agendamentos
Content-Type: application/json

{
    "data_hora": "2026-11-25T15:00",
    "barbeiro_id": 1,
    "cliente_id": 1
}

### Atualizar a data do agendamento 1
PUT {{base}}/agendamentos/1
Content-Type: application/json

{
    "data_hora": "2026-12-01T09:00"
}
```

A resposta aparece em uma aba ao lado, com o código HTTP na primeira linha.

> **Fuso horário.** No GET de agendamentos, o campo `data_hora` aparece em UTC, com 3 horas a mais e `Z` no fim (`"2026-12-01T12:00:00.000Z"` para uma data gravada como 09:00). O horário de Brasília está na `data_formatada` (`"01/12/2026 09:00"`). Detalhes em `02_node_fastify.md`, seção GET com JOIN de três tabelas.
