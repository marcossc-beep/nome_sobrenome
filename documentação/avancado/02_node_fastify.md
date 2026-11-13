# Node.js, Fastify, pg, bcrypt e JWT (API)

Referências:
- Node.js: https://nodejs.org/docs/latest/api/
- Fastify: https://fastify.dev/docs/latest/
- @fastify/cors: https://github.com/fastify/fastify-cors
- @fastify/jwt: https://github.com/fastify/fastify-jwt
- bcrypt: https://github.com/kelektiv/node.bcrypt.js
- node-postgres (pg): https://node-postgres.com/

Exemplos: API da barbearia (arquivo `server.js`, porta 6767, banco `saep_db`).

## Execução

| Comando (terminal do VS Code) | Efeito |
|---|---|
| `npm start` | inicia a API; reinicia sozinha a cada vez que o `server.js` é salvo |
| Ctrl + C | para a API |

O projeto já traz as bibliotecas na pasta `node_modules` e o `package.json` com `"type": "module"` (necessário para usar `import`).

## Servidor, CORS, JWT e conexão com o banco

```js
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import bcrypt from 'bcrypt'
import { Pool } from 'pg'

const servidor = Fastify()

servidor.register(cors, { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] })

servidor.register(jwt, {
    secret: 'saep_barbearia_2026',     // chave que assina os tokens
    sign: { expiresIn: '30m' }         // validade do token
})

const sql = new Pool({
    user: 'postgres',      // usuário do Postgres
    password: 'senai',     // senha do Postgres
    host: 'localhost',
    port: 5432,            // porta do Postgres
    database: 'saep_db'
})

// ... função autenticar e rotas ...

servidor.listen({ port: 6767 }).then(() => console.log('API rodando em http://localhost:6767'))
```

Cada `register` aparece uma única vez no `server.js`.

## CORS

Libera páginas abertas no navegador a chamarem a API. Um método fora de `methods` é bloqueado pelo navegador (editar e excluir param sem `PUT` e `DELETE`). O REST Client não passa por essa regra.

## bcrypt

Gera um hash de um texto. O hash não volta ao texto original; para conferir, compara-se o texto com o hash.

```js
const hash = await bcrypt.hash('texto', 10)         // '$2b$10$...' (10 = custo)
const igual = await bcrypt.compare('texto', hash)   // true ou false
```

Cada chamada de `hash` gera um resultado diferente para o mesmo texto. Por isso não existe `WHERE cpf = hash`: os registros são lidos e conferidos com `compare`.

## JWT

| Função | Uso |
|---|---|
| `servidor.jwt.sign(payload)` | gera um token com os dados do `payload` (nunca a senha) |
| `servidor.jwt.decode(token)` | lê o conteúdo do token |
| `await request.jwtVerify()` | verifica o token do cabeçalho `Authorization: Bearer <token>`; lança erro se for inválido ou expirado |
| `request.user` | dados do token depois do `jwtVerify()` |

`expiresIn`: `'30s'`, `'10m'`, `'1h'`, `'7d'`. O token guarda o campo `exp`: o momento em que expira, em **segundos** desde 01/01/1970 (`Date.now()` do JavaScript usa milissegundos, por isso `exp * 1000`).

### Rotas protegidas (preHandler)

Uma função em `preHandler` roda antes da rota. Se ela responder, a rota não executa. A função precisa estar escrita antes das rotas que a usam.

```js
async function autenticar(request, reply) {
    try {
        await request.jwtVerify()
    } catch (erro) {
        return reply.status(401).send({ message: 'Sessão expirada ou inválida. Faça login novamente.' })
    }
}

servidor.get('/barbeiros', { preHandler: autenticar }, async (request, reply) => { ... })
```

O `/login` não tem `preHandler`: quem ainda não tem token precisa conseguir entrar.

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
| 401 | não autorizado (login inválido, token ausente ou expirado) |
| 404 | não encontrado |
| 500 | erro no servidor (mensagem no terminal do `npm start`) |

## sql.query

```js
const resultado = await sql.query('SELECT * FROM barbeiro')
resultado.rows        // array com as linhas
resultado.rowCount    // quantidade de linhas retornadas ou alteradas
```

Os valores vão em um array no segundo argumento. `$1` é o primeiro item do array, `$2` o segundo, e assim por diante.

```js
await sql.query('SELECT * FROM barbeiro WHERE id = $1', [id])
await sql.query('UPDATE barbeiro SET nome = $2 WHERE id = $1', [id, body.nome])
```

Valores do usuário nunca são concatenados no texto do SQL (SQL injection).

## Rotas

Cada combinação de método + caminho existe uma única vez no `server.js`. Uma rota repetida impede a API de iniciar: `Method 'GET' already declared for route '/barbeiros'`.

| Método | Caminho | Função | Token |
|---|---|---|---|
| POST | `/login` | confere cpf e senha, devolve o token | não |
| GET | `/barbeiros` e `/barbeiros?busca=termo` | lista / busca por nome | sim |
| POST | `/barbeiros` | cadastra (cpf e senha em hash) | sim |
| PUT | `/barbeiros/:id` | edita | sim |
| DELETE | `/barbeiros/:id` | exclui | sim |
| GET | `/clientes` | lista com o nome do barbeiro | sim |
| POST | `/clientes` | cadastra associado a um barbeiro | sim |
| PUT | `/clientes/:id` | edita | sim |
| DELETE | `/clientes/:id` | exclui | sim |
| GET | `/agendamentos` | lista ordenada por data, com barbeiro e cliente | sim |
| POST | `/agendamentos` | cadastra | sim |
| PUT | `/agendamentos/:id` | atualiza a data | sim |
| DELETE | `/agendamentos/:id` | exclui | sim |

## Login com bcrypt e JWT

- 400 quando faltar CPF ou senha.
- 401 com a mesma mensagem quando o CPF não existe ou a senha está errada (não revela quais CPFs existem).
- Quando está certo, gera o token e devolve o usuário e o horário de expiração em milissegundos.

O CPF está em hash, então o barbeiro é encontrado comparando o CPF digitado com o hash de cada registro.

```js
servidor.post('/login', async (request, reply) => {
    const body = request.body

    if (!body || !body.cpf || !body.senha) {
        return reply.status(400).send({ message: 'CPF e senha são obrigatórios!' })
    }

    const resultado = await sql.query('SELECT * FROM barbeiro')

    let barbeiro = null
    for (const item of resultado.rows) {
        if (await bcrypt.compare(body.cpf, item.cpf)) {
            barbeiro = item
            break
        }
    }

    if (!barbeiro || !(await bcrypt.compare(body.senha, barbeiro.senha))) {
        return reply.status(401).send({ message: 'Usuário ou senha inválidos!' })
    }

    const token = servidor.jwt.sign({ id: barbeiro.id, nome: barbeiro.nome })
    const expira = servidor.jwt.decode(token).exp * 1000

    reply.status(200).send({
        message: 'Login realizado com sucesso!',
        token: token,
        expira: expira,
        usuario: { id: barbeiro.id, nome: barbeiro.nome }
    })
})
```

Resposta: `{ "message": "...", "token": "eyJhbGci...", "expira": 1795000000000, "usuario": { "id": 1, "nome": "Carlos Silva" } }`

## GET: listar com busca opcional

```js
// GET /barbeiros              -> lista todos
// GET /barbeiros?busca=ana    -> lista só os que combinam com o termo
servidor.get('/barbeiros', { preHandler: autenticar }, async (request, reply) => {
    const busca = request.query.busca

    if (busca) {
        const barbeiros = await sql.query(
            'SELECT id, nome FROM barbeiro WHERE nome ILIKE $1 ORDER BY id',
            [`%${busca}%`]
        )
        return reply.send(barbeiros.rows)
    }

    const barbeiros = await sql.query('SELECT id, nome FROM barbeiro ORDER BY id')
    reply.send(barbeiros.rows)
})
```

Os `%` ficam no valor, não no texto do SQL. CPF e senha (hash) não entram no SELECT.

## GET com JOIN

```js
servidor.get('/clientes', { preHandler: autenticar }, async (request, reply) => {
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
servidor.get('/agendamentos', { preHandler: autenticar }, async (request, reply) => {
    const agendamentos = await sql.query(`
        SELECT
            agendamento.id,
            agendamento.data_hora,
            TO_CHAR(agendamento.data_hora, 'DD/MM/YYYY HH24:MI') AS data_formatada,
            barbeiro.id AS barbeiro_id,
            barbeiro.nome AS barbeiro_nome,
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

## POST com criptografia

```js
servidor.post('/barbeiros', { preHandler: autenticar }, async (request, reply) => {
    const body = request.body

    const cpfHash = await bcrypt.hash(body.cpf, 10)
    const senhaHash = await bcrypt.hash(body.senha, 10)

    await sql.query(
        'INSERT INTO barbeiro (nome, cpf, senha) VALUES ($1, $2, $3)',
        [body.nome, cpfHash, senhaHash]
    )

    reply.status(201).send({ message: 'Barbeiro cadastrado!' })
})
```

## POST com chave estrangeira

Antes de gravar, confere se o registro referenciado existe. Sem a conferência, um id inexistente gera erro de chave estrangeira no banco e a API responde 500.

```js
servidor.post('/clientes', { preHandler: autenticar }, async (request, reply) => {
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
servidor.post('/agendamentos', { preHandler: autenticar }, async (request, reply) => {
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

## PUT com criptografia

CPF e senha só mudam quando forem enviados preenchidos (o valor atual é hash e não aparece na tela).

```js
servidor.put('/barbeiros/:id', { preHandler: autenticar }, async (request, reply) => {
    const body = request.body
    const id = request.params.id

    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [id])
    if (barbeiro.rows.length === 0) {
        return reply.status(404).send({ message: 'Barbeiro não existe!' })
    }

    await sql.query('UPDATE barbeiro SET nome = $2 WHERE id = $1', [id, body.nome])

    if (body.cpf) {
        const cpfHash = await bcrypt.hash(body.cpf, 10)
        await sql.query('UPDATE barbeiro SET cpf = $2 WHERE id = $1', [id, cpfHash])
    }
    if (body.senha) {
        const senhaHash = await bcrypt.hash(body.senha, 10)
        await sql.query('UPDATE barbeiro SET senha = $2 WHERE id = $1', [id, senhaHash])
    }

    reply.status(200).send({ message: `Barbeiro ${body.nome} alterado!` })
})
```

## PUT de um campo só, usando rowCount

`rowCount` diz quantas linhas o `UPDATE` alterou. Zero significa que o id não existe.

```js
servidor.put('/agendamentos/:id', { preHandler: autenticar }, async (request, reply) => {
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
servidor.delete('/barbeiros/:id', { preHandler: autenticar }, async (request, reply) => {
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
import jwt from '@fastify/jwt'
import bcrypt from 'bcrypt'
import { Pool } from 'pg'

const servidor = Fastify()

servidor.register(cors, { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] })

servidor.register(jwt, {
    secret: 'saep_barbearia_2026',
    sign: { expiresIn: '30m' }
})

const sql = new Pool({
    user: 'postgres',
    password: 'senai',
    host: 'localhost',
    port: 5432,
    database: 'saep_db'
})

async function autenticar(request, reply) {
    try {
        await request.jwtVerify()
    } catch (erro) {
        return reply.status(401).send({ message: 'Sessão expirada ou inválida. Faça login novamente.' })
    }
}

// ---------- LOGIN ----------

servidor.post('/login', async (request, reply) => {
    const body = request.body

    if (!body || !body.cpf || !body.senha) {
        return reply.status(400).send({ message: 'CPF e senha são obrigatórios!' })
    }

    const resultado = await sql.query('SELECT * FROM barbeiro')

    let barbeiro = null
    for (const item of resultado.rows) {
        if (await bcrypt.compare(body.cpf, item.cpf)) {
            barbeiro = item
            break
        }
    }

    if (!barbeiro || !(await bcrypt.compare(body.senha, barbeiro.senha))) {
        return reply.status(401).send({ message: 'Usuário ou senha inválidos!' })
    }

    const token = servidor.jwt.sign({ id: barbeiro.id, nome: barbeiro.nome })
    const expira = servidor.jwt.decode(token).exp * 1000

    reply.status(200).send({
        message: 'Login realizado com sucesso!',
        token: token,
        expira: expira,
        usuario: { id: barbeiro.id, nome: barbeiro.nome }
    })
})

// ---------- BARBEIROS ----------

servidor.get('/barbeiros', { preHandler: autenticar }, async (request, reply) => {
    const busca = request.query.busca

    if (busca) {
        const barbeiros = await sql.query(
            'SELECT id, nome FROM barbeiro WHERE nome ILIKE $1 ORDER BY id',
            [`%${busca}%`]
        )
        return reply.send(barbeiros.rows)
    }

    const barbeiros = await sql.query('SELECT id, nome FROM barbeiro ORDER BY id')
    reply.send(barbeiros.rows)
})

servidor.post('/barbeiros', { preHandler: autenticar }, async (request, reply) => {
    const body = request.body

    const cpfHash = await bcrypt.hash(body.cpf, 10)
    const senhaHash = await bcrypt.hash(body.senha, 10)

    await sql.query(
        'INSERT INTO barbeiro (nome, cpf, senha) VALUES ($1, $2, $3)',
        [body.nome, cpfHash, senhaHash]
    )

    reply.status(201).send({ message: 'Barbeiro cadastrado!' })
})

servidor.put('/barbeiros/:id', { preHandler: autenticar }, async (request, reply) => {
    const body = request.body
    const id = request.params.id

    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [id])
    if (barbeiro.rows.length === 0) {
        return reply.status(404).send({ message: 'Barbeiro não existe!' })
    }

    await sql.query('UPDATE barbeiro SET nome = $2 WHERE id = $1', [id, body.nome])

    if (body.cpf) {
        const cpfHash = await bcrypt.hash(body.cpf, 10)
        await sql.query('UPDATE barbeiro SET cpf = $2 WHERE id = $1', [id, cpfHash])
    }
    if (body.senha) {
        const senhaHash = await bcrypt.hash(body.senha, 10)
        await sql.query('UPDATE barbeiro SET senha = $2 WHERE id = $1', [id, senhaHash])
    }

    reply.status(200).send({ message: `Barbeiro ${body.nome} alterado!` })
})

servidor.delete('/barbeiros/:id', { preHandler: autenticar }, async (request, reply) => {
    const id = request.params.id
    await sql.query('DELETE FROM barbeiro WHERE id = $1', [id])
    reply.status(200).send({ message: 'Barbeiro deletado!' })
})

// ---------- CLIENTES ----------

servidor.get('/clientes', { preHandler: autenticar }, async (request, reply) => {
    const clientes = await sql.query(`
        SELECT cliente.*, barbeiro.nome AS barbeiro_nome
        FROM cliente
        INNER JOIN barbeiro ON cliente.barbeiro_id = barbeiro.id
        ORDER BY cliente.id
    `)
    reply.send(clientes.rows)
})

servidor.post('/clientes', { preHandler: autenticar }, async (request, reply) => {
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

servidor.put('/clientes/:id', { preHandler: autenticar }, async (request, reply) => {
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

servidor.delete('/clientes/:id', { preHandler: autenticar }, async (request, reply) => {
    const id = request.params.id
    await sql.query('DELETE FROM cliente WHERE id = $1', [id])
    reply.status(200).send({ message: 'Cliente deletado!' })
})

// ---------- AGENDAMENTOS ----------

servidor.get('/agendamentos', { preHandler: autenticar }, async (request, reply) => {
    const agendamentos = await sql.query(`
        SELECT
            agendamento.id,
            agendamento.data_hora,
            TO_CHAR(agendamento.data_hora, 'DD/MM/YYYY HH24:MI') AS data_formatada,
            barbeiro.id AS barbeiro_id,
            barbeiro.nome AS barbeiro_nome,
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

servidor.post('/agendamentos', { preHandler: autenticar }, async (request, reply) => {
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

servidor.put('/agendamentos/:id', { preHandler: autenticar }, async (request, reply) => {
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

servidor.delete('/agendamentos/:id', { preHandler: autenticar }, async (request, reply) => {
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
| `autenticar is not defined` | a função `autenticar` está escrita depois das rotas |
| 401 em todas as rotas | falta o cabeçalho `Authorization: Bearer <token>` ou o token expirou |
| login sempre 401 com dados certos | cpf ou senha do banco em texto puro (sem hash), ou CPF digitado diferente do original |
| `Illegal arguments: string, undefined` | `bcrypt.compare` ou `bcrypt.hash` recebeu um campo vazio |
| 500 | erro no SQL; a mensagem aparece no terminal do `npm start` |
| `request.body` é `undefined` | faltou `Content-Type: application/json` na requisição |
