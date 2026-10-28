# Testes da API com REST Client

> Escreva estes pedidos no arquivo **referencias.http** (na raiz do projeto) e clique em **Send Request** acima de cada um. A API precisa estar rodando (`npm start`).

## Testando a API com REST Client (referencias.http)

```text
O REST Client é uma extensão do VS Code que permite testar as rotas da API direto no editor, sem precisar de programas como Postman ou Insomnia. Criamos um arquivo chamado `referencias.http` na raiz do projeto.

// Regras do arquivo .http:
// 1. Usamos três hashtags '###' para separar uma requisição da outra.
// 2. Primeira linha: Método HTTP + URL completa (ex: POST http://localhost:6767/login).
// 3. Headers: Ficam logo abaixo da URL. Usamos 'Content-Type: application/json' para avisar que o body está em JSON.
// 4. Linha em branco: É OBRIGATÓRIO dar 1 espaço (linha em branco) entre os Headers e o Body, senão a requisição dá erro.
// 5. Body (Payload): É o JSON enviado para o servidor nos métodos POST, PUT ou PATCH.
```

## Exemplos para o arquivo referencias.http:

### Buscar todos os usuários (GET)

```http
GET http://localhost:6767/usuarios
```

### Cadastrar um usuário (POST)

```http
POST http://localhost:6767/usuarios
Content-Type: application/json

{
    "nome": "Carlos Dias",
    "cpf": "777.888.999-00",
    "senha": "senha000"
}
```

### Fazer Login (POST)

```http
POST http://localhost:6767/login
Content-Type: application/json

{
    "cpf": "444.555.666-77",
    "senha": "senha123"
}
```

### Atualizar um usuário por ID (PUT)

```http
PUT http://localhost:6767/usuarios/1
Content-Type: application/json

{
    "nome": "Beatriz Lima Souza",
    "cpf": "444.555.666-77",
    "senha": "senha123"
}
```

### Deletar um usuário por ID (DELETE)

```http
DELETE http://localhost:6767/usuarios/1
```

### Buscar usuários por termo (GET com ?busca=)

```http
GET http://localhost:6767/usuarios?busca=ana
```

### Listar as reuniões com JOIN, ordenadas por data (GET)

```http
GET http://localhost:6767/reunioes
```

### Cadastrar uma sala ligada a um usuário (POST com chave estrangeira)

```http
POST http://localhost:6767/salas
Content-Type: application/json

{
    "nome": "Sala 04",
    "bloco": "Bloco A",
    "usuario_id": 1
}
```

### Atualizar só a data de uma reunião (PUT)

```http
PUT http://localhost:6767/reunioes/1
Content-Type: application/json

{
    "data_hora": "2026-12-20T09:00"
}
```

## Status HTTP que usamos

```text
// 200  deu certo
// 201  criado (cadastrar)
// 400  faltou dado ou dado inválido
// 401  não autenticado (login errado, token vencido)
// 404  o registro não existe
// 500  erro no servidor (veja a mensagem no terminal onde roda o npm start)
```
