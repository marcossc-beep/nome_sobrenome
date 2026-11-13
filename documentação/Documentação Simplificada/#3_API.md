# API (Node.js + Fastify + pg)

A API recebe as requisições HTTP do front (ou do REST Client), executa o SQL no PostgreSQL e devolve a resposta em JSON.
Todo o código fica no `server.js`, na raiz do projeto. Porta da API: `6767`.

Execução: `npm start` no terminal do VS Code (reinicia a API sempre que o `server.js` é salvo).

| Biblioteca | Função |
|---|---|
| `fastify` | servidor HTTP e rotas |
| `@fastify/cors` | libera o front (navegador) a chamar a API |
| `pg` | conexão com o PostgreSQL |

## Servidor, CORS e conexão

```js
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Pool } from 'pg'

const servidor = Fastify()

servidor.register(cors, { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] })

const sql = new Pool({
    user: "postgres",     // usuário do Postgres
    password: "senai",    // senha do Postgres
    host: "localhost",
    port: 5432,           // porta do Postgres
    database: "saep_db"
})
```

- Sem `PUT` e `DELETE` em `methods`, editar e excluir funcionam no REST Client mas falham no navegador.
- `sql.query('SQL', [valores])`: cada `$1`, `$2`, `$3` do SQL recebe o valor da mesma posição no array. Os valores nunca são colados no texto do SQL (evita SQL injection).

```js
await sql.query('DELETE FROM barbeiro WHERE id = $1', [id])

await sql.query('INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES ($1, $2, $3)', [body.nome, body.cpf, body.barbeiro_id])
```

## Requisição e resposta

| Parte | Onde chega | Exemplo |
|---|---|---|
| parâmetro de rota (`:id`) | `request.params.id` | `PUT /barbeiros/1` |
| query string (`?busca=`) | `request.query.busca` | `GET /barbeiros?busca=ana` |
| body (JSON) | `request.body` | `POST`, `PUT` |

Resposta: `reply.status(código).send(objeto)`. Resultado do banco: `resultado.rows` (linhas) e `resultado.rowCount` (linhas afetadas).

| Status | Significado |
|---|---|
| 200 | sucesso |
| 201 | criado |
| 400 | dado faltando ou inválido |
| 401 | login recusado |
| 404 | registro não existe |
| 500 | erro no servidor (detalhes no terminal do `npm start`) |

Cada método + endpoint existe uma única vez no `server.js`. Uma rota repetida impede a API de iniciar:
`Method 'GET' already declared for route '/barbeiros'`.

## Rotas

| Método | Endpoint | Função |
|---|---|---|
| POST | `/login` | login do barbeiro (cpf e senha) |
| GET | `/barbeiros` e `/barbeiros?busca=termo` | lista / busca por nome |
| POST | `/barbeiros` | cadastra |
| PUT | `/barbeiros/:id` | edita nome e cpf |
| DELETE | `/barbeiros/:id` | exclui |
| GET | `/clientes` | lista com o nome do barbeiro (JOIN) |
| POST | `/clientes` | cadastra associado a um barbeiro |
| GET | `/agendamentos` | lista ordenada por data, com barbeiro e cliente (JOIN) |
| POST | `/agendamentos` | cadastra |
| PUT | `/agendamentos/:id` | atualiza só a data |

## POST /login

Retorna o barbeiro (`id`, `nome`) quando cpf e senha conferem. Falha: 400 (campo vazio) ou 401 (cpf ou senha errados).

```js
servidor.post('/login', async (request, reply) => {
    const body = request.body

    if (!body || !body.cpf || !body.senha) {
        return reply.status(400).send({ message: "Preencha CPF e senha!" })
    }

    const resultado = await sql.query(
        'SELECT id, nome FROM barbeiro WHERE cpf = $1 AND senha = $2',
        [body.cpf, body.senha]
    )

    if (resultado.rows.length === 0) {
        return reply.status(401).send({ message: "CPF ou senha inválidos!" })
    }

    reply.status(200).send({ message: "Login realizado!", usuario: resultado.rows[0] })
})
```

Resposta de sucesso:

```json
{ "message": "Login realizado!", "usuario": { "id": 1, "nome": "Carlos Silva" } }
```

## GET /barbeiros (lista e busca)

Sem `?busca=` (ou com busca vazia) lista todos. Com `?busca=termo` filtra pelo nome com `ILIKE`. A senha não sai da API.

```js
servidor.get('/barbeiros', async (request, reply) => {
    const busca = request.query.busca

    if (busca) {
        const barbeiros = await sql.query(
            'SELECT id, nome, cpf FROM barbeiro WHERE nome ILIKE $1 ORDER BY id',
            [`%${busca}%`]
        )
        return reply.send(barbeiros.rows)
    }

    const barbeiros = await sql.query('SELECT id, nome, cpf FROM barbeiro ORDER BY id')
    reply.send(barbeiros.rows)
})
```

## POST /barbeiros

```js
servidor.post('/barbeiros', async (request, reply) => {
    const body = request.body

    await sql.query(
        'INSERT INTO barbeiro (nome, cpf, senha) VALUES ($1, $2, $3)',
        [body.nome, body.cpf, body.senha]
    )

    reply.status(201).send({ message: "Barbeiro cadastrado!" })
})
```

## PUT /barbeiros/:id

Edita nome e cpf; a senha não muda. Id inexistente: 404.

```js
servidor.put('/barbeiros/:id', async (request, reply) => {
    const body = request.body
    const id = request.params.id

    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [id])
    if (barbeiro.rows.length === 0) {
        return reply.status(404).send({ message: "Barbeiro não existe!" })
    }

    await sql.query(
        'UPDATE barbeiro SET nome = $2, cpf = $3 WHERE id = $1',
        [id, body.nome, body.cpf]
    )
    reply.status(200).send({ message: `Barbeiro ${body.nome} alterado!` })
})
```

## DELETE /barbeiros/:id

Pelo `ON DELETE CASCADE`, os clientes e agendamentos do barbeiro também são apagados.

```js
servidor.delete('/barbeiros/:id', async (request, reply) => {
    const id = request.params.id
    await sql.query('DELETE FROM barbeiro WHERE id = $1', [id])
    reply.status(200).send({ message: 'Barbeiro deletado!' })
})
```

## GET /clientes

```js
servidor.get('/clientes', async (request, reply) => {
    const clientes = await sql.query(`
        SELECT
            cliente.id,
            cliente.nome,
            cliente.cpf,
            barbeiro.nome AS barbeiro_nome
        FROM cliente
        INNER JOIN barbeiro ON cliente.barbeiro_id = barbeiro.id
        ORDER BY cliente.id
    `)
    reply.send(clientes.rows)
})
```

## POST /clientes

O cliente pertence a um barbeiro (`barbeiro_id`). Barbeiro inexistente: 400 (sem a conferência, o Postgres recusa a chave estrangeira e a API responde 500).

```js
servidor.post('/clientes', async (request, reply) => {
    const body = request.body

    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [body.barbeiro_id])
    if (barbeiro.rows.length === 0) {
        return reply.status(400).send({ message: "Barbeiro informado não existe!" })
    }

    await sql.query(
        'INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES ($1, $2, $3)',
        [body.nome, body.cpf, body.barbeiro_id]
    )

    reply.status(201).send({ message: "Cliente cadastrado!" })
})
```

## GET /agendamentos

Ordenado por data (`ORDER BY`), com os dados do barbeiro e do cliente (JOIN das 3 tabelas).

```js
servidor.get('/agendamentos', async (request, reply) => {
    const agendamentos = await sql.query(`
        SELECT
            agendamento.id,
            agendamento.data_hora,
            TO_CHAR(agendamento.data_hora, 'DD/MM/YYYY HH24:MI') AS data_formatada,
            barbeiro.id AS barbeiro_id,
            barbeiro.nome AS barbeiro_nome,
            barbeiro.cpf AS barbeiro_cpf,
            cliente.id AS cliente_id,
            cliente.nome AS cliente_nome,
            cliente.cpf AS cliente_cpf
        FROM agendamento
        INNER JOIN barbeiro ON agendamento.barbeiro_id = barbeiro.id
        INNER JOIN cliente ON agendamento.cliente_id = cliente.id
        ORDER BY agendamento.data_hora ASC
    `)
    reply.send(agendamentos.rows)
})
```

> **OBS: fuso horário.** A coluna `TIMESTAMP` não guarda fuso. Ao ler, a biblioteca `pg` trata a data como horário local e o JSON a envia em UTC, com 3 horas a mais e um `Z` no fim:
> `20/11/2026 14:00` no banco chega como `"data_hora": "2026-11-20T17:00:00.000Z"`.
> O banco está certo; só a exibição muda. Por isso o SELECT também traz a `data_formatada`, montada pelo próprio Postgres com `TO_CHAR` (`"20/11/2026 14:00"`), e é ela que o front exibe.
> Alternativa no front: `new Date(ag.data_hora).toLocaleString('pt-BR')` converte de volta para o horário de Brasília.

## POST /agendamentos

Confere as duas chaves estrangeiras antes de gravar.

```js
servidor.post('/agendamentos', async (request, reply) => {
    const body = request.body

    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [body.barbeiro_id])
    const cliente = await sql.query('SELECT id FROM cliente WHERE id = $1', [body.cliente_id])
    if (barbeiro.rows.length === 0 || cliente.rows.length === 0) {
        return reply.status(400).send({ message: "Barbeiro ou cliente informado não existe!" })
    }

    await sql.query(
        'INSERT INTO agendamento (data_hora, barbeiro_id, cliente_id) VALUES ($1, $2, $3)',
        [body.data_hora, body.barbeiro_id, body.cliente_id]
    )

    reply.status(201).send({ message: "Agendamento cadastrado!" })
})
```

## PUT /agendamentos/:id

Atualiza só a data. `rowCount === 0` significa que o id não existe (404).

```js
servidor.put('/agendamentos/:id', async (request, reply) => {
    const body = request.body
    const id = request.params.id

    const resultado = await sql.query(
        'UPDATE agendamento SET data_hora = $2 WHERE id = $1',
        [id, body.data_hora]
    )

    if (resultado.rowCount === 0) {
        return reply.status(404).send({ message: "Agendamento não existe!" })
    }

    reply.status(200).send({ message: "Data do agendamento atualizada!" })
})
```

> **OBS: fuso horário.** A data deve ser enviada sem fuso: `"2026-11-25T09:00"` ou `"2026-11-25 09:00"` (o formato do `<input type="datetime-local">`).
> Uma data com `Z` no fim, como a de `new Date().toISOString()` (`"2026-11-25T12:00:00.000Z"`), é gravada com o horário UTC, 3 horas a mais.

## Listen

```js
servidor.listen({ port: 6767 }).then(() => console.log('API da barbearia rodando em http://localhost:6767'))
```

## server.js completo

```js
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Pool } from 'pg'

const servidor = Fastify()

servidor.register(cors, { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] })

const sql = new Pool({
    user: "postgres",
    password: "senai",
    host: "localhost",
    port: 5432,
    database: "saep_db"
})

// ---------- LOGIN ----------

servidor.post('/login', async (request, reply) => {
    const body = request.body

    if (!body || !body.cpf || !body.senha) {
        return reply.status(400).send({ message: "Preencha CPF e senha!" })
    }

    const resultado = await sql.query(
        'SELECT id, nome FROM barbeiro WHERE cpf = $1 AND senha = $2',
        [body.cpf, body.senha]
    )

    if (resultado.rows.length === 0) {
        return reply.status(401).send({ message: "CPF ou senha inválidos!" })
    }

    reply.status(200).send({ message: "Login realizado!", usuario: resultado.rows[0] })
})

// ---------- BARBEIROS ----------

servidor.get('/barbeiros', async (request, reply) => {
    const busca = request.query.busca

    if (busca) {
        const barbeiros = await sql.query(
            'SELECT id, nome, cpf FROM barbeiro WHERE nome ILIKE $1 ORDER BY id',
            [`%${busca}%`]
        )
        return reply.send(barbeiros.rows)
    }

    const barbeiros = await sql.query('SELECT id, nome, cpf FROM barbeiro ORDER BY id')
    reply.send(barbeiros.rows)
})

servidor.post('/barbeiros', async (request, reply) => {
    const body = request.body

    await sql.query(
        'INSERT INTO barbeiro (nome, cpf, senha) VALUES ($1, $2, $3)',
        [body.nome, body.cpf, body.senha]
    )

    reply.status(201).send({ message: "Barbeiro cadastrado!" })
})

servidor.put('/barbeiros/:id', async (request, reply) => {
    const body = request.body
    const id = request.params.id

    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [id])
    if (barbeiro.rows.length === 0) {
        return reply.status(404).send({ message: "Barbeiro não existe!" })
    }

    await sql.query(
        'UPDATE barbeiro SET nome = $2, cpf = $3 WHERE id = $1',
        [id, body.nome, body.cpf]
    )
    reply.status(200).send({ message: `Barbeiro ${body.nome} alterado!` })
})

servidor.delete('/barbeiros/:id', async (request, reply) => {
    const id = request.params.id
    await sql.query('DELETE FROM barbeiro WHERE id = $1', [id])
    reply.status(200).send({ message: 'Barbeiro deletado!' })
})

// ---------- CLIENTES ----------

servidor.get('/clientes', async (request, reply) => {
    const clientes = await sql.query(`
        SELECT
            cliente.id,
            cliente.nome,
            cliente.cpf,
            barbeiro.nome AS barbeiro_nome
        FROM cliente
        INNER JOIN barbeiro ON cliente.barbeiro_id = barbeiro.id
        ORDER BY cliente.id
    `)
    reply.send(clientes.rows)
})

servidor.post('/clientes', async (request, reply) => {
    const body = request.body

    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [body.barbeiro_id])
    if (barbeiro.rows.length === 0) {
        return reply.status(400).send({ message: "Barbeiro informado não existe!" })
    }

    await sql.query(
        'INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES ($1, $2, $3)',
        [body.nome, body.cpf, body.barbeiro_id]
    )

    reply.status(201).send({ message: "Cliente cadastrado!" })
})

// ---------- AGENDAMENTOS ----------

servidor.get('/agendamentos', async (request, reply) => {
    const agendamentos = await sql.query(`
        SELECT
            agendamento.id,
            agendamento.data_hora,
            TO_CHAR(agendamento.data_hora, 'DD/MM/YYYY HH24:MI') AS data_formatada,
            barbeiro.id AS barbeiro_id,
            barbeiro.nome AS barbeiro_nome,
            barbeiro.cpf AS barbeiro_cpf,
            cliente.id AS cliente_id,
            cliente.nome AS cliente_nome,
            cliente.cpf AS cliente_cpf
        FROM agendamento
        INNER JOIN barbeiro ON agendamento.barbeiro_id = barbeiro.id
        INNER JOIN cliente ON agendamento.cliente_id = cliente.id
        ORDER BY agendamento.data_hora ASC
    `)
    reply.send(agendamentos.rows)
})

servidor.post('/agendamentos', async (request, reply) => {
    const body = request.body

    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [body.barbeiro_id])
    const cliente = await sql.query('SELECT id FROM cliente WHERE id = $1', [body.cliente_id])
    if (barbeiro.rows.length === 0 || cliente.rows.length === 0) {
        return reply.status(400).send({ message: "Barbeiro ou cliente informado não existe!" })
    }

    await sql.query(
        'INSERT INTO agendamento (data_hora, barbeiro_id, cliente_id) VALUES ($1, $2, $3)',
        [body.data_hora, body.barbeiro_id, body.cliente_id]
    )

    reply.status(201).send({ message: "Agendamento cadastrado!" })
})

servidor.put('/agendamentos/:id', async (request, reply) => {
    const body = request.body
    const id = request.params.id

    const resultado = await sql.query(
        'UPDATE agendamento SET data_hora = $2 WHERE id = $1',
        [id, body.data_hora]
    )

    if (resultado.rowCount === 0) {
        return reply.status(404).send({ message: "Agendamento não existe!" })
    }

    reply.status(200).send({ message: "Data do agendamento atualizada!" })
})

// ---------- LISTEN ----------

servidor.listen({ port: 6767 }).then(() => console.log('API da barbearia rodando em http://localhost:6767'))
```

## Mensagens de erro

| Mensagem | Causa |
|---|---|
| `Method 'GET' already declared for route '/barbeiros'` | rota escrita duas vezes |
| `Failed to fetch` (navegador) | API parada ou CORS ausente |
| `password authentication failed for user "postgres"` | senha do `Pool` diferente da senha do Postgres |
| `connect ECONNREFUSED 127.0.0.1:5432` | porta do `Pool` diferente da porta do Postgres |
| `relation "barbeiro" does not exist` | `saep_db.sql` não executado no banco `saep_db` |
| `CPF ou senha inválidos!` com dados certos | CPF digitado diferente do INSERT (pontos e traço) |
