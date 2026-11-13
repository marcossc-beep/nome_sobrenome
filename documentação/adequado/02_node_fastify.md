# Node.js, Fastify e pg (API)

Referências:
- Node.js: https://nodejs.org/docs/latest/api/
- Fastify: https://fastify.dev/docs/latest/
- @fastify/cors: https://github.com/fastify/fastify-cors
- node-postgres (pg): https://node-postgres.com/

Exemplos: API da barbearia (arquivo `server.js`, porta 6767, banco `saep_db`).

## Execução

| Comando (terminal do VS Code) | Efeito |
|---|---|
| `npm start` | inicia a API; reinicia sozinha a cada vez que o `server.js` é salvo |
| Ctrl + C | para a API |

O projeto já traz as bibliotecas na pasta `node_modules` e o `package.json` com `"type": "module"` (necessário para usar `import`).

## Servidor, CORS e conexão com o banco

```js
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Pool } from 'pg'

const servidor = Fastify()

servidor.register(cors, { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] })

const sql = new Pool({
    user: 'postgres',      // usuário do Postgres
    password: 'senai',     // senha do Postgres
    host: 'localhost',
    port: 5432,            // porta do Postgres
    database: 'saep_db'
})

// ... rotas ...

servidor.listen({ port: 6767 }).then(() => console.log('API rodando em http://localhost:6767'))
```

O CORS libera páginas abertas no navegador a chamarem a API. Um método fora de `methods` é bloqueado pelo navegador (o REST Client não passa por essa regra).

## Request e reply

| Propriedade | Conteúdo | Exemplo |
|---|---|---|
| `request.params` | parâmetros da URL definidos com `:` | `/barbeiros/:id` → `request.params.id` |
| `request.query` | parâmetros depois do `?` | `/barbeiros?busca=ana` → `request.query.busca` |
| `request.body` | corpo JSON enviado no POST/PUT | `request.body.nome` |

```js
reply.send(dados)                                          // status 200
reply.status(201).send({ message: 'Barbeiro cadastrado!' })
return reply.status(404).send({ message: 'Barbeiro não existe!' })
```

`return` antes do `reply` encerra a rota ali.

| Código | Significado |
|---|---|
| 200 | OK |
| 201 | criado |
| 400 | dado faltando ou inválido |
| 401 | não autorizado (login inválido) |
| 404 | não encontrado |
| 500 | erro no servidor (mensagem no terminal do `npm start`) |

## sql.query

```js
const resultado = await sql.query('SELECT * FROM barbeiro')
resultado.rows        // array com as linhas
resultado.rowCount    // quantidade de linhas retornadas ou alteradas
```

Os valores vão em um array no segundo argumento. `$1` é o primeiro item do array, `$2` o segundo, e assim por diante. A ordem dos `$n` no SQL não precisa seguir a ordem das colunas.

```js
await sql.query('SELECT * FROM barbeiro WHERE id = $1', [id])
await sql.query('UPDATE barbeiro SET nome = $2 WHERE id = $1', [id, body.nome])
```

Valores do usuário nunca são concatenados no texto do SQL (SQL injection).

## Rotas

Cada combinação de método + caminho existe uma única vez no `server.js`. Uma rota repetida impede a API de iniciar: `Method 'GET' already declared for route '/barbeiros'`.

| Método | Caminho | Função |
|---|---|---|
| POST | `/login` | confere cpf e senha do barbeiro |
| GET | `/barbeiros` e `/barbeiros?busca=termo` | lista / busca por nome |
| POST | `/barbeiros` | cadastra |
| PUT | `/barbeiros/:id` | edita nome e cpf |
| DELETE | `/barbeiros/:id` | exclui |
| GET | `/clientes` | lista com o nome do barbeiro |
| POST | `/clientes` | cadastra associado a um barbeiro |
| PUT | `/clientes/:id` | edita |
| DELETE | `/clientes/:id` | exclui |
| GET | `/agendamentos` | lista ordenada por data, com barbeiro e cliente |
| POST | `/agendamentos` | cadastra |
| PUT | `/agendamentos/:id` | atualiza a data |
| DELETE | `/agendamentos/:id` | exclui |

## Login comparando com o banco

- 400 quando faltar CPF ou senha.
- 401 quando não existe barbeiro com esse CPF e essa senha.

```js
servidor.post('/login', async (request, reply) => {
    const body = request.body

    if (!body || !body.cpf || !body.senha) {
        return reply.status(400).send({ message: 'Preencha CPF e senha!' })
    }

    const resultado = await sql.query(
        'SELECT id, nome FROM barbeiro WHERE cpf = $1 AND senha = $2',
        [body.cpf, body.senha]
    )

    if (resultado.rows.length === 0) {
        return reply.status(401).send({ message: 'CPF ou senha inválidos!' })
    }

    reply.status(200).send({ message: 'Login realizado!', usuario: resultado.rows[0] })
})
```

Resposta: `{ "message": "Login realizado!", "usuario": { "id": 1, "nome": "Carlos Silva" } }`

## GET: listar com busca opcional

```js
// GET /barbeiros              -> lista todos
// GET /barbeiros?busca=ana    -> lista só os que combinam com o termo
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

Os `%` ficam no valor, não no texto do SQL. A senha não entra no SELECT.

## GET com JOIN

```js
servidor.get('/clientes', async (request, reply) => {
    const clientes = await sql.query(`
        SELECT cliente.*, barbeiro.nome AS barbeiro_nome
        FROM cliente
        INNER JOIN barbeiro ON cliente.barbeiro_id = barbeiro.id
        ORDER BY cliente.id
    `)
    reply.send(clientes.rows)
})
```

Crase (`` ` ``) permite escrever o SQL em várias linhas.

## GET com JOIN de três tabelas, ordenado por data

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

Ordenação só pelo dia, mês ou ano: trocar a última linha do SQL (ver `01_postgresql.md`, seção Ordenação), por exemplo `ORDER BY EXTRACT(MONTH FROM agendamento.data_hora), agendamento.data_hora`.

> **Fuso horário.** A coluna `TIMESTAMP` não guarda fuso. A biblioteca `pg` lê a data como horário local e o JSON a envia em UTC: `20/11/2026 14:00` no banco chega como `"data_hora": "2026-11-20T17:00:00.000Z"` (3 horas a mais, com `Z` no fim). O valor no banco está certo; muda só a exibição. O `TO_CHAR` do SELECT entrega a `data_formatada` (`"20/11/2026 14:00"`) já no horário de Brasília. No JavaScript, `new Date(data_hora).toLocaleString('pt-BR')` faz a mesma conversão.

## POST

```js
servidor.post('/barbeiros', async (request, reply) => {
    const body = request.body

    await sql.query(
        'INSERT INTO barbeiro (nome, cpf, senha) VALUES ($1, $2, $3)',
        [body.nome, body.cpf, body.senha]
    )

    reply.status(201).send({ message: 'Barbeiro cadastrado!' })
})
```

## POST com chave estrangeira

Antes de gravar, confere se o registro referenciado existe. Sem a conferência, um id inexistente gera erro de chave estrangeira no banco e a API responde 500.

```js
servidor.post('/clientes', async (request, reply) => {
    const body = request.body

    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [body.barbeiro_id])
    if (barbeiro.rows.length === 0) {
        return reply.status(400).send({ message: 'Barbeiro informado não existe!' })
    }

    await sql.query(
        'INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES ($1, $2, $3)',
        [body.nome, body.cpf, body.barbeiro_id]
    )

    reply.status(201).send({ message: 'Cliente cadastrado!' })
})
```

Com duas chaves estrangeiras, confere as duas:

```js
servidor.post('/agendamentos', async (request, reply) => {
    const body = request.body

    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [body.barbeiro_id])
    const cliente = await sql.query('SELECT id FROM cliente WHERE id = $1', [body.cliente_id])
    if (barbeiro.rows.length === 0 || cliente.rows.length === 0) {
        return reply.status(400).send({ message: 'Barbeiro ou cliente informado não existe!' })
    }

    await sql.query(
        'INSERT INTO agendamento (data_hora, barbeiro_id, cliente_id) VALUES ($1, $2, $3)',
        [body.data_hora, body.barbeiro_id, body.cliente_id]
    )

    reply.status(201).send({ message: 'Agendamento cadastrado!' })
})
```

## PUT

```js
servidor.put('/barbeiros/:id', async (request, reply) => {
    const body = request.body
    const id = request.params.id

    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [id])
    if (barbeiro.rows.length === 0) {
        return reply.status(404).send({ message: 'Barbeiro não existe!' })
    }

    await sql.query(
        'UPDATE barbeiro SET nome = $2, cpf = $3 WHERE id = $1',
        [id, body.nome, body.cpf]
    )

    reply.status(200).send({ message: `Barbeiro ${body.nome} alterado!` })
})
```

## PUT de um campo só, usando rowCount

`rowCount` diz quantas linhas o `UPDATE` alterou. Zero significa que o id não existe.

```js
servidor.put('/agendamentos/:id', async (request, reply) => {
    const body = request.body
    const id = request.params.id

    const resultado = await sql.query(
        'UPDATE agendamento SET data_hora = $2 WHERE id = $1',
        [id, body.data_hora]
    )

    if (resultado.rowCount === 0) {
        return reply.status(404).send({ message: 'Agendamento não existe!' })
    }

    reply.status(200).send({ message: 'Data do agendamento atualizada!' })
})
```

> **Fuso horário.** A data é enviada sem fuso: `"2026-12-20T09:00"` (formato do `<input type="datetime-local">`) ou `"2026-12-20 09:00"`. Uma data com `Z` no fim, como a de `new Date().toISOString()`, é gravada no horário UTC (3 horas a mais).

## DELETE

```js
servidor.delete('/barbeiros/:id', async (request, reply) => {
    const id = request.params.id
    await sql.query('DELETE FROM barbeiro WHERE id = $1', [id])
    reply.status(200).send({ message: 'Barbeiro deletado!' })
})
```

Com `ON DELETE CASCADE`, os clientes e agendamentos do barbeiro também são apagados.

## server.js completo

```js
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Pool } from 'pg'

const servidor = Fastify()

servidor.register(cors, { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] })

const sql = new Pool({
    user: 'postgres',
    password: 'senai',
    host: 'localhost',
    port: 5432,
    database: 'saep_db'
})

// ---------- LOGIN ----------

servidor.post('/login', async (request, reply) => {
    const body = request.body

    if (!body || !body.cpf || !body.senha) {
        return reply.status(400).send({ message: 'Preencha CPF e senha!' })
    }

    const resultado = await sql.query(
        'SELECT id, nome FROM barbeiro WHERE cpf = $1 AND senha = $2',
        [body.cpf, body.senha]
    )

    if (resultado.rows.length === 0) {
        return reply.status(401).send({ message: 'CPF ou senha inválidos!' })
    }

    reply.status(200).send({ message: 'Login realizado!', usuario: resultado.rows[0] })
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

    reply.status(201).send({ message: 'Barbeiro cadastrado!' })
})

servidor.put('/barbeiros/:id', async (request, reply) => {
    const body = request.body
    const id = request.params.id

    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [id])
    if (barbeiro.rows.length === 0) {
        return reply.status(404).send({ message: 'Barbeiro não existe!' })
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
        SELECT cliente.*, barbeiro.nome AS barbeiro_nome
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
        return reply.status(400).send({ message: 'Barbeiro informado não existe!' })
    }

    await sql.query(
        'INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES ($1, $2, $3)',
        [body.nome, body.cpf, body.barbeiro_id]
    )

    reply.status(201).send({ message: 'Cliente cadastrado!' })
})

servidor.put('/clientes/:id', async (request, reply) => {
    const body = request.body
    const id = request.params.id

    const cliente = await sql.query('SELECT id FROM cliente WHERE id = $1', [id])
    if (cliente.rows.length === 0) {
        return reply.status(404).send({ message: 'Cliente não existe!' })
    }

    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [body.barbeiro_id])
    if (barbeiro.rows.length === 0) {
        return reply.status(400).send({ message: 'Barbeiro informado não existe!' })
    }

    await sql.query(
        'UPDATE cliente SET nome = $2, cpf = $3, barbeiro_id = $4 WHERE id = $1',
        [id, body.nome, body.cpf, body.barbeiro_id]
    )

    reply.status(200).send({ message: `Cliente ${body.nome} alterado!` })
})

servidor.delete('/clientes/:id', async (request, reply) => {
    const id = request.params.id
    await sql.query('DELETE FROM cliente WHERE id = $1', [id])
    reply.status(200).send({ message: 'Cliente deletado!' })
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
        return reply.status(400).send({ message: 'Barbeiro ou cliente informado não existe!' })
    }

    await sql.query(
        'INSERT INTO agendamento (data_hora, barbeiro_id, cliente_id) VALUES ($1, $2, $3)',
        [body.data_hora, body.barbeiro_id, body.cliente_id]
    )

    reply.status(201).send({ message: 'Agendamento cadastrado!' })
})

servidor.put('/agendamentos/:id', async (request, reply) => {
    const body = request.body
    const id = request.params.id

    const resultado = await sql.query(
        'UPDATE agendamento SET data_hora = $2 WHERE id = $1',
        [id, body.data_hora]
    )

    if (resultado.rowCount === 0) {
        return reply.status(404).send({ message: 'Agendamento não existe!' })
    }

    reply.status(200).send({ message: 'Data do agendamento atualizada!' })
})

servidor.delete('/agendamentos/:id', async (request, reply) => {
    const id = request.params.id
    await sql.query('DELETE FROM agendamento WHERE id = $1', [id])
    reply.status(200).send({ message: 'Agendamento deletado!' })
})

// ---------- LISTEN ----------

servidor.listen({ port: 6767 }).then(() => console.log('API rodando em http://localhost:6767'))
```

## Erros comuns

| Sintoma | Causa |
|---|---|
| `Method 'GET' already declared for route '/x'` | a mesma rota foi escrita duas vezes |
| `EADDRINUSE` | já tem uma API rodando na porta; feche o outro terminal |
| `password authentication failed` | usuário ou senha do Postgres errados no `Pool` |
| `connect ECONNREFUSED 127.0.0.1:5432` | porta do `Pool` diferente da porta do Postgres |
| `database "x" does not exist` | nome do banco errado no `Pool` |
| 404 `Route GET:/x not found` | caminho ou método diferente do definido na rota |
| 500 | erro no SQL; a mensagem aparece no terminal do `npm start` |
| `request.body` é `undefined` | faltou `Content-Type: application/json` na requisição |
| login sempre 401 com dados certos | CPF digitado diferente do INSERT (pontos e traço) |
