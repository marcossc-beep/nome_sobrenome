// Quando vamos construir uma casa não precisamos criar os próprios tijólos nós compramos prontos e usamos.
// O fastify é como a loja onde encontramos os meios para criar a casa sem precisar criar esses meios a cada projeto.

import Fastify from 'fastify'
const servidor = Fastify();

import { Pool } from 'pg' // importação da biblioteca de conexão com o postgress

const sql = new Pool({
    user: "postgres", // usuario padrão do postgres mas da pra criar outro usuario se quiser
    password: "12345", // senha do banco
    host: "localhost", // ip da sua máquina
    port: 5433,  // porta que o banco está rodando normalmente é 5432
    database: "saep_db" // Nome do banco de dados
})

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

servidor.get('/clientes', async (request, reply) => {
    const busca = request.query.busca

    if (busca) {
        const clientes = await sql.query(
            'SELECT id, nome, cpf FROM cliente WHERE nome ILIKE $1 ORDER BY id',
            [`%${busca}%`]
        )
        return reply.send(clientes.rows)
    }

    const clientes = await sql.query('SELECT id, nome, cpf FROM cliente ORDER BY id')
    reply.send(clientes.rows)
})


// request é onde ficam as informações que vieram na requisição como o body

// Cadastrando barbeiros
servidor.post('/barbeiros', async (request, reply) => {
    // pegando as informações que vieram do body da requisição
    const body = request.body

    // insert na tabela através da api de acordo com as informações que vieram do body

    const resultado = await sql.query(
        'INSERT INTO barbeiro (nome, cpf, senha) VALUES ($1, $2, $3)',
        [body.nome, body.cpf, body.senha]
    )

    reply.status(201).send({ message: "barbeiro cadastrado!" })
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

servidor.listen({   
    port: 6767
})