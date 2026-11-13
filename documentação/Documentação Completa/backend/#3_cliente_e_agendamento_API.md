# API de cliente e de agendamento: cadastrar com chave estrangeira, editar e atualizar a data

```js
//
// As telas que usam estas rotas estão em ../frontend/#3_cliente_dropdown.md e ../frontend/#4_agendamentos.md.
// As rotas deste arquivo entram no server.js ABAIXO das rotas do #2 e ACIMA do listen.
// Elas usam { preHandler: autenticar } (função do #1_servidor_login_e_criptografia.md).
// No fim deste arquivo está o server.js completo (#1 + #2 + #3), para conferir.
```

## Cliente: a ideia

```js
Ao cadastrar um novo cliente, ele deve ser associado a um barbeiro.
No banco isso é a chave estrangeira cliente.barbeiro_id (NOT NULL: todo cliente tem barbeiro).
O front manda o barbeiro_id no corpo do POST e a API confere se esse barbeiro existe antes de gravar.
Sem a conferência, um barbeiro_id inexistente estoura erro de chave estrangeira no Postgres e a API responde 500.
```

## Cliente: POST, PUT e DELETE

```js
servidor.post('/clientes', { preHandler: autenticar }, async (request, reply) => {
    const body = request.body

    // antes de gravar, confere se o barbeiro existe
    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [body.barbeiro_id])
    if (barbeiro.rows.length === 0) {
        return reply.status(400).send({ message: 'Barbeiro informado não existe!' })
    }

    await sql.query(
        'INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES ($1, $2, $3)',
        [body.nome, body.cpf, body.barbeiro_id]
    )

    reply.status(201).send({ message: 'cliente cadastrado!' })
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

    reply.status(200).send({ message: `cliente ${body.nome} alterado!` })
})

servidor.delete('/clientes/:id', { preHandler: autenticar }, async (request, reply) => {
    const id = request.params.id
    await sql.query('DELETE FROM cliente WHERE id = $1', [id])
    reply.status(200).send({ message: 'Cliente Deletado!' })
})

// A listagem GET /clientes (com JOIN, para trazer o nome do barbeiro) está em #2_busca_e_JOIN.md.

### Testes no referencias.http

POST http://localhost:6767/clientes
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "nome": "Pedro Henrique",
    "cpf": "999.888.777-66",
    "barbeiro_id": 1
}

### Barbeiro que não existe (esperado: 400)
POST http://localhost:6767/clientes
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "nome": "Teste",
    "cpf": "000.000.000-00",
    "barbeiro_id": 999
}
```

## Agendamento: como a data é guardada e enviada

```js
- No banco a coluna é TIMESTAMP (data e hora juntas): 2026-11-18 14:30:00.
- Front e API trocam datas no formato ISO: 2026-11-18T14:30 (o T separa a data da hora).
- O Postgres aceita esse formato direto. Não precisa converter.
```

## Agendamento: POST, PUT (só a data) e DELETE

```js
// O agendamento tem DUAS chaves estrangeiras (barbeiro_id e cliente_id): a API confere as duas antes de gravar.
// O GET /agendamentos (JOIN triplo e ORDER BY data_hora) está em #2_busca_e_JOIN.md.

servidor.post('/agendamentos', { preHandler: autenticar }, async (request, reply) => {
    const body = request.body

    // duas chaves estrangeiras: confere as duas antes de gravar
    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [body.barbeiro_id])
    if (barbeiro.rows.length === 0) {
        return reply.status(400).send({ message: 'Barbeiro informado não existe!' })
    }

    const cliente = await sql.query('SELECT id FROM cliente WHERE id = $1', [body.cliente_id])
    if (cliente.rows.length === 0) {
        return reply.status(400).send({ message: 'Cliente informado não existe!' })
    }

    await sql.query(
        'INSERT INTO agendamento (data_hora, barbeiro_id, cliente_id) VALUES ($1, $2, $3)',
        [body.data_hora, body.barbeiro_id, body.cliente_id]
    )

    reply.status(201).send({ message: 'agendamento cadastrado!' })
})

// Atualiza SÓ a data do agendamento
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
    reply.status(200).send({ message: 'Agendamento Deletado!' })
})

// resultado.rowCount diz quantas linhas o UPDATE alterou. Se foi zero, o id não existe (404).
// Sempre use WHERE no UPDATE. Sem o WHERE, TODAS as linhas da tabela mudam de data.

### Testes no referencias.http

POST http://localhost:6767/agendamentos
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "data_hora": "2026-11-21T15:00",
    "barbeiro_id": 1,
    "cliente_id": 1
}

### Atualizar a data do agendamento 1 (depois rode o GET e veja a ordem mudar)
PUT http://localhost:6767/agendamentos/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "data_hora": "2026-11-17T08:30"
}
```

## Erros comuns

```js
- "Barbeiro informado não existe!" (400): o barbeiro_id enviado não está na tabela barbeiro. Confira com SELECT * FROM barbeiro.
- "violates foreign key constraint" (500): faltou a conferência antes do INSERT, ou o cliente_id/barbeiro_id não existe.
- 401 em tudo: faltou o header Authorization: Bearer <token> no .http, ou o token venceu. Faça login de novo.
- Atualizou a data e TODOS os agendamentos mudaram: faltou o WHERE no UPDATE.
- "Agendamento não existe!" (404): o id que está na URL do PUT não existe.
- A data mudou de horário (algumas horas a mais ou a menos): o JavaScript converteu o fuso. Envie a data como veio do input
  (2026-11-17T08:30) e deixe o Postgres guardar como TIMESTAMP, sem timezone.
```

## server.js completo (#1 + #2 + #3)

```js
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import bcrypt from 'bcrypt'
import { Pool } from 'pg'

const servidor = Fastify()

servidor.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
})

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

// ---------- LOGIN (#1) ----------

servidor.post('/login', async (request, reply) => {
    const body = request.body

    if (!body || !body.cpf || !body.senha) {
        return reply.status(400).send({ message: 'CPF e senha são obrigatórios!' })
    }

    const resultado = await sql.query('SELECT * FROM barbeiro')

    let barbeiro = null
    for (const item of resultado.rows) {
        const cpfConfere = await bcrypt.compare(body.cpf, item.cpf)
        if (cpfConfere) {
            barbeiro = item
            break
        }
    }

    if (!barbeiro) {
        return reply.status(401).send({ message: 'Usuário ou senha inválidos!' })
    }

    const senhaValida = await bcrypt.compare(body.senha, barbeiro.senha)

    if (!senhaValida) {
        return reply.status(401).send({ message: 'Usuário ou senha inválidos!' })
    }

    const token = servidor.jwt.sign({ id: barbeiro.id, nome: barbeiro.nome })
    const expira = servidor.jwt.decode(token).exp * 1000

    return reply.status(200).send({
        message: 'Login realizado com sucesso!',
        token: token,
        expira: expira,
        usuario: { id: barbeiro.id, nome: barbeiro.nome }
    })
})

// ---------- BARBEIROS (#2 e #1) ----------

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

    reply.status(201).send({ message: 'barbeiro cadastrado!' })
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

    reply.status(200).send({ message: `barbeiro ${body.nome} alterado!` })
})

servidor.delete('/barbeiros/:id', { preHandler: autenticar }, async (request, reply) => {
    const id = request.params.id
    await sql.query('DELETE FROM barbeiro WHERE id = $1', [id])
    reply.status(200).send({ message: 'Barbeiro Deletado!' })
})

// ---------- CLIENTES (#2 e #3) ----------

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

    reply.status(201).send({ message: 'cliente cadastrado!' })
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

    reply.status(200).send({ message: `cliente ${body.nome} alterado!` })
})

servidor.delete('/clientes/:id', { preHandler: autenticar }, async (request, reply) => {
    const id = request.params.id
    await sql.query('DELETE FROM cliente WHERE id = $1', [id])
    reply.status(200).send({ message: 'Cliente Deletado!' })
})

// ---------- AGENDAMENTOS (#2 e #3) ----------

servidor.get('/agendamentos', { preHandler: autenticar }, async (request, reply) => {
    const agendamentos = await sql.query(`
        SELECT
            agendamento.id,
            agendamento.data_hora,
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
    if (barbeiro.rows.length === 0) {
        return reply.status(400).send({ message: 'Barbeiro informado não existe!' })
    }

    const cliente = await sql.query('SELECT id FROM cliente WHERE id = $1', [body.cliente_id])
    if (cliente.rows.length === 0) {
        return reply.status(400).send({ message: 'Cliente informado não existe!' })
    }

    await sql.query(
        'INSERT INTO agendamento (data_hora, barbeiro_id, cliente_id) VALUES ($1, $2, $3)',
        [body.data_hora, body.barbeiro_id, body.cliente_id]
    )

    reply.status(201).send({ message: 'agendamento cadastrado!' })
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
    reply.status(200).send({ message: 'Agendamento Deletado!' })
})

// ---------- LISTEN ----------

servidor.listen({ port: 6767 }).then(() => console.log('API da barbearia rodando em http://localhost:6767'))
```
