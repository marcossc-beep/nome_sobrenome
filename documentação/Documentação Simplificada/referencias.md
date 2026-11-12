# Testes da API com REST Client

> Escreva estes pedidos no arquivo **referencias.http** (na raiz do projeto) e clique em **Send Request** acima de cada um. A API precisa estar rodando (`npm start`).

## Testando a API com REST Client (referencias.http)

```text
O REST Client é uma extensão do VS Code que permite testar as rotas da API direto no editor, sem precisar de programas como Postman ou Insomnia. Criamos um arquivo chamado `referencias.http` na raiz do projeto.

// Regras do arquivo .http:
// 1. Usamos três hashtags '###' para separar uma requisição da outra.
// 2. Primeira linha: Método HTTP + URL completa (ex: POST http://localhost:6767/barbeiros).
// 3. Headers: Ficam logo abaixo da URL. Usamos 'Content-Type: application/json' para avisar que o body está em JSON.
// 4. Linha em branco: É OBRIGATÓRIO dar 1 espaço (linha em branco) entre os Headers e o Body, senão a requisição dá erro.
// 5. Body (Payload): É o JSON enviado para o servidor nos métodos POST, PUT ou PATCH.
```

## Exemplos para o arquivo referencias.http:

### Buscar todos os barbeiros (GET)

```http
GET http://localhost:6767/barbeiros
```

### Buscar barbeiros por termo (GET com ?busca=)

```http
GET http://localhost:6767/barbeiros?busca=ana
```

### Cadastrar um barbeiro (POST)

```http
POST http://localhost:6767/barbeiros
Content-Type: application/json

{
    "nome": "Thiago Pente",
    "cpf": "777.888.999-00",
    "senha": "senha000"
}
```

### Atualizar um barbeiro por ID (PUT)

```http
PUT http://localhost:6767/barbeiros/1
Content-Type: application/json

{
    "nome": "Carlos Silva Souza",
    "cpf": "111.222.333-44",
    "senha": "senha123"
}
```

### Deletar um barbeiro por ID (DELETE)

```http
DELETE http://localhost:6767/barbeiros/1
```

### Cadastrar um cliente ligado a um barbeiro (POST com chave estrangeira)

```http
POST http://localhost:6767/clientes
Content-Type: application/json

{
    "nome": "Lucas Ferreira",
    "cpf": "888.999.000-11",
    "barbeiro_id": 1
}
```

### Listar os agendamentos com JOIN, ordenados por data (GET)

```http
GET http://localhost:6767/agendamentos
```

### Atualizar só a data de um agendamento (PUT)

```http
PUT http://localhost:6767/agendamentos/1
Content-Type: application/json

{
    "data_hora": "2026-11-25T09:00"
}
```

## Status HTTP que usamos

```text
// 200  deu certo
// 201  criado (cadastrar)
// 400  faltou dado ou dado inválido
// 404  o registro não existe
// 500  erro no servidor (veja a mensagem no terminal onde roda o npm start)
```

## Script completo

```http
@api = http://localhost:6767

### ---------- BARBEIROS ----------

### Listar todos
GET {{api}}/barbeiros

### Buscar por termo
GET {{api}}/barbeiros?busca=ana

### Cadastrar
POST {{api}}/barbeiros
Content-Type: application/json

{
    "nome": "Thiago Pente",
    "cpf": "777.888.999-00",
    "senha": "senha000"
}

### Editar pelo id
PUT {{api}}/barbeiros/1
Content-Type: application/json

{
    "nome": "Carlos Silva Souza",
    "cpf": "111.222.333-44",
    "senha": "senha123"
}

### Excluir pelo id
DELETE {{api}}/barbeiros/3

### ---------- CLIENTES (pertencem a um barbeiro) ----------

### Listar todos
GET {{api}}/clientes

### Cadastrar ligado a um barbeiro
POST {{api}}/clientes
Content-Type: application/json

{
    "nome": "Lucas Ferreira",
    "cpf": "888.999.000-11",
    "barbeiro_id": 1
}

### Cadastrar com barbeiro que não existe (esperado: 400)
POST {{api}}/clientes
Content-Type: application/json

{
    "nome": "Teste Erro",
    "cpf": "000.000.000-00",
    "barbeiro_id": 999
}

### ---------- AGENDAMENTOS ----------

### Listar ordenado por data, com os dados do barbeiro e do cliente (JOIN)
GET {{api}}/agendamentos

### Cadastrar
POST {{api}}/agendamentos
Content-Type: application/json

{
    "data_hora": "2026-11-21T15:00",
    "barbeiro_id": 1,
    "cliente_id": 1
}

### Atualizar só a data (depois rode o GET e veja a ordem mudar)
PUT {{api}}/agendamentos/1
Content-Type: application/json

{
    "data_hora": "2026-11-17T08:30"
}
```
