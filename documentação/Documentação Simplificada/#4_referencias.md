# Testes da API (REST Client)

Arquivo `referencias.http`, na raiz do projeto, executado pela extensão REST Client: link **Send Request** acima de cada requisição. A API precisa estar em execução (`npm start`).

## Formato do arquivo .http

| Elemento | Regra |
|---|---|
| `###` | separa uma requisição da outra |
| primeira linha | método + URL (`POST http://localhost:6767/barbeiros`) |
| headers | logo abaixo da URL (`Content-Type: application/json` quando há body) |
| linha em branco | obrigatória entre os headers e o body |
| body | JSON, só em POST e PUT |
| `@api = ...` | variável, usada como `{{api}}` |

GET e DELETE não têm body nem `Content-Type`.

## Login

```http
### Login certo (200)
POST http://localhost:6767/login
Content-Type: application/json

{
    "cpf": "111.222.333-44",
    "senha": "senha123"
}

### Senha errada (401)
POST http://localhost:6767/login
Content-Type: application/json

{
    "cpf": "111.222.333-44",
    "senha": "errada"
}
```

## Barbeiros

```http
### Listar
GET http://localhost:6767/barbeiros

### Buscar por nome
GET http://localhost:6767/barbeiros?busca=ana

### Cadastrar
POST http://localhost:6767/barbeiros
Content-Type: application/json

{
    "nome": "Thiago Pente",
    "cpf": "777.888.999-00",
    "senha": "senha000"
}

### Editar
PUT http://localhost:6767/barbeiros/1
Content-Type: application/json

{
    "nome": "Carlos Silva Souza",
    "cpf": "111.222.333-44"
}

### Excluir
DELETE http://localhost:6767/barbeiros/3
```

## Clientes

```http
### Listar (com o nome do barbeiro)
GET http://localhost:6767/clientes

### Cadastrar associado ao barbeiro 1
POST http://localhost:6767/clientes
Content-Type: application/json

{
    "nome": "Lucas Ferreira",
    "cpf": "888.999.000-11",
    "barbeiro_id": 1
}

### Barbeiro inexistente (400)
POST http://localhost:6767/clientes
Content-Type: application/json

{
    "nome": "Teste Erro",
    "cpf": "000.000.000-00",
    "barbeiro_id": 999
}
```

## Agendamentos

```http
### Listar ordenado por data
GET http://localhost:6767/agendamentos

### Cadastrar
POST http://localhost:6767/agendamentos
Content-Type: application/json

{
    "data_hora": "2026-11-21T15:00",
    "barbeiro_id": 1,
    "cliente_id": 1
}

### Atualizar só a data
PUT http://localhost:6767/agendamentos/1
Content-Type: application/json

{
    "data_hora": "2026-11-25T09:00"
}
```

> **OBS: fuso horário.** No GET, o campo `data_hora` aparece com 3 horas a mais e um `Z` no fim (`"2026-11-25T12:00:00.000Z"` para uma data gravada como 09:00). É o horário convertido para UTC pela biblioteca `pg`; o valor no banco está certo. O horário de Brasília aparece no campo `data_formatada` (`"25/11/2026 09:00"`), gerado pelo `TO_CHAR` do SELECT (ver o GET /agendamentos no `#3_API.md`).
>
> No PUT e no POST, a data vai sem fuso: `"2026-11-25T09:00"`. Com `Z` no fim, o Postgres grava o horário UTC.
