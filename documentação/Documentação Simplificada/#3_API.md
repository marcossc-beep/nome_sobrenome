# Introdução

```js
API serve para conectar no banco, o que usamos em aula foi a biblioteca do PG para integrar a api com o postgres.
Usamos o PG Admin para gerenciar o postgres criando os bancos de dados e as tabelas no banco.
Todo o código deste arquivo vai no server.js (raiz do projeto). No fim do arquivo está o server.js completo.
```

## Criando o projeto (uma vez só)

```js
// No terminal, dentro da pasta do projeto:
//   npm init -y
//   npm i fastify @fastify/cors pg
//
// No package.json, coloque "type": "module" e o script de start:
//   "type": "module",
//   "scripts": { "start": "node --watch server.js" }
//
// Para rodar a API:  npm start
// (Neste repositório o package.json já está pronto: basta npm install e depois npm start.)
```

## utilização do fastify para gerenciar o servidor e a comunicação com o http.

```js
// Quando vamos construir uma casa não precisamos criar os próprios tijólos nós compramos prontos e usamos.
// O fastify é como a loja onde encontramos os meios para criar a casa sem precisar criar esses meios a cada projeto.

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Pool } from 'pg' // importação da biblioteca de conexão com o postgress

const servidor = Fastify();

// O cors libera o front-end (as páginas da pasta FRONT abertas no navegador) a chamar a API.
// PUT e DELETE precisam estar na lista, senão editar e excluir falham no navegador.
servidor.register(cors, { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] })
```

## Como conectar a API no banco de dados:

```js
const sql = new Pool({
    user: "postgres", // usuario padrão do postgres mas da pra criar outro usuario se quiser
    password: "senai", // senha do banco
    host: "localhost", // ip da sua máquina
    port: 5432,  // porta que o banco está rodando normalmente é 5432
    database: "saep_db" // Nome do banco de dados
})
// OBS: o banco é o saep_db (criado no pgAdmin) e usuário, senha e porta são os do Postgres da sua máquina.
// OBS: Essa variável chamada sql será usada para conectar a api ao banco de dados dessa forma:  
// sql.query( 'aqui vai a query SQL' , [ 'Aqui vão ficar os valores que serão usados dentro da query' ] ) 

// exemplo:

// await sql.query('DELETE FROM barbeiro where id = $1', [id]) 

// $1 é o valor da variável id que está no array de dependencias.

// OUTRO EXEMPLO:

// await sql.query('INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES ($1, $2, $3)', [body.nome, body.cpf, body.barbeiro_id])  

// podem ter outros elementos no array de dependencias 

// $1 vai receber o valor de body.nome,
// $2 vai receber o valor de body.cpf,
// $3 vai receber o valor de body.barbeiro_id

// isso é necessário para evitar SQL injection
```

## REQUISIÇÕES HTTP

```js
// Toda requisição tem um método então GET, POST, PUT, PATCH ou DELETE.
// Toda requisição tem um nome de endpoint por exemplo /barbeiros.
// Quando fazemos requisições alguns métodos podem ter um body também conhecido como payload.
// As requisições tem um header, normalmente usamos o Content-Type: application/json para enviar json no body.
// O método post, put e patch podem ter um body.

// ATENÇÃO: cada combinação de método + endpoint só pode existir UMA vez no server.js.
// Dois servidor.get('/barbeiros', ...) fazem a API parar com o erro:
//   Method 'GET' already declared for route '/barbeiros'
// Por isso cada rota abaixo aparece uma vez só.
```

## LOGIN (POST /login)

```js
// Quem faz login é o barbeiro, com o cpf e a senha que estão na tabela barbeiro.
// O SELECT só encontra o barbeiro se o cpf E a senha baterem.
// Validação em caso de falha no login:
// - 400 quando faltar cpf ou senha;
// - 401 quando o cpf ou a senha estiverem errados (a mensagem aparece na tela de login).

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

    // devolve o barbeiro logado (id e nome): o front guarda e mostra o nome na tela principal
    reply.status(200).send({ message: "Login realizado!", usuario: resultado.rows[0] })
})
```

## GET com busca por termo (query params)

```js
// Quando vamos buscar algo no servidor usamos o metodo get.
// reply é usado para enviar uma resposta personalizada

// Tudo que vem depois do ? na URL chega em request.query:
// GET http://localhost:6767/barbeiros?busca=ana  ->  request.query.busca === 'ana'
// Se não vier nada, request.query.busca é undefined e a rota lista todos.

// O SQL com ILIKE está no #2_SQL.md: ele ignora maiúsculas/minúsculas e o % vale por "qualquer texto antes ou depois".
// A senha não é pedida no SELECT: ela não deve sair da API.

servidor.get('/barbeiros', async (request, reply) => {
    const busca = request.query.busca

    if (busca) {
        const barbeiros = await sql.query(
            'SELECT id, nome, cpf FROM barbeiro WHERE nome ILIKE $1 ORDER BY id',
            [`%${busca}%`]
        )
        return reply.send(barbeiros.rows)
    }

    // barbeiros é uma variável criada que recebe tudo que veio da tabela barbeiro
    // barbeiros.rows é para retornar somente as linhas da tabela
    const barbeiros = await sql.query('SELECT id, nome, cpf FROM barbeiro ORDER BY id')
    reply.send(barbeiros.rows)
})
```

## GET com JOIN (juntando tabelas)

```js
// O SQL do JOIN está no #2_SQL.md. Na API é só colocar o mesmo SQL dentro do sql.query.
// Entre crases ( ` ) o SQL pode ficar em várias linhas. Use AS para dar apelido às colunas.

// Clientes com o nome do barbeiro de cada um
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

// Agendamentos ordenados pela data (ORDER BY), com os dados do barbeiro e do cliente
servidor.get('/agendamentos', async (request, reply) => {
    const agendamentos = await sql.query(`
        SELECT
            agendamento.id,
            agendamento.data_hora,
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

## POST

```js
// request é onde ficam as informações que vieram na requisição como o body

// Cadastrando barbeiros
servidor.post('/barbeiros', async (request, reply) => {
    // pegando as informações que vieram do body da requisição
    const body = request.body

    // insert na tabela através da api de acordo com as informações que vieram do body
    await sql.query(
        'INSERT INTO barbeiro (nome, cpf, senha) VALUES ($1, $2, $3)',
        [body.nome, body.cpf, body.senha]
    )

    reply.status(201).send({ message: "Barbeiro cadastrado!" })
})
```

## POST que depende de outra tabela (chave estrangeira)

```js
// O cliente pertence a um barbeiro (cliente.barbeiro_id). Antes de gravar, conferimos se o barbeiro existe.
// Sem essa conferência, um id que não existe faz o Postgres dar erro e a API responde 500.

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

// Cadastrando um agendamento: a mesma ideia, conferindo as duas chaves estrangeiras (barbeiro_id e cliente_id).
// A data vai no formato 2026-11-21T15:00 (o mesmo que o input datetime-local do HTML devolve).

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

## PUT

```js
// put é usado para alterar algo no servidor então é necessário enviar na requisição o id e o body.

// o id é o que será editado e o body é o que será inserido no lugar.
// normalmente enviamos o id na propria url da requisição por isso :id

// Os números $1, $2, $3... são só a posição de cada valor no array do segundo parâmetro do sql.query.
// Não precisam seguir a ordem das colunas. Aqui o id é sempre o $1 (WHERE id = $1) para ficar fácil de lembrar.
// Na edição mudamos o nome e o cpf. A senha continua a mesma.

servidor.put('/barbeiros/:id', async (request, reply) => {
    const body = request.body;
    const id = request.params.id;

    const barbeiro = await sql.query('SELECT id FROM barbeiro WHERE id = $1', [id])
    if (barbeiro.rows.length === 0) {
        return reply.status(404).send({
            message: "Barbeiro não existe!"
        })
    }

    await sql.query(
        'UPDATE barbeiro SET nome = $2, cpf = $3 WHERE id = $1',
        [id, body.nome, body.cpf]
    )
    reply.status(200).send({message: `Barbeiro ${body.nome} alterado!`})
})
```

## PUT que altera só um campo (ex: só a data)

```js
// resultado.rowCount diz quantas linhas o UPDATE alterou. Se foi zero, o id não existe (404).
// Sempre use WHERE no UPDATE. Sem o WHERE, todas as linhas da tabela mudam.
// A data vai no formato 2026-11-25T09:00 (o mesmo que o input datetime-local do HTML devolve).

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

## DELETE

```js
// é necessário enviar para o servidor o id de qual registro será deletado.
// normalmente enviamos o id na propria url da requisição por isso :id

servidor.delete('/barbeiros/:id', async (request, reply) => {
    const id = request.params.id
    await sql.query('DELETE FROM barbeiro WHERE id = $1', [id])
    reply.status(200).send({ message: 'Barbeiro deletado!' })
})

// Por causa do ON DELETE CASCADE, os clientes e agendamentos desse barbeiro também são apagados.
```

## Listen

```js
// é necessário definir a porta que a api vai rodar no caso 6767
// Esse código normalmente fica no final do arquivo server.js 

servidor.listen({   
    port: 6767
}).then(() => console.log('API da barbearia rodando em http://localhost:6767'))
```

## server.js completo

```js
// Tudo o que está acima, junto e na ordem. Cada rota aparece uma vez só.

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

servidor.listen({
    port: 6767
}).then(() => console.log('API da barbearia rodando em http://localhost:6767'))
```

## Erros comuns

```js
- Method 'GET' already declared for route '/barbeiros': a mesma rota foi escrita duas vezes. Apague uma.
- "Failed to fetch" no navegador: a API não está rodando (npm start) ou faltou o cors.
- Editar e excluir funcionam no REST Client mas não no navegador: faltou PUT e DELETE em methods no cors.
- password authentication failed for user "postgres": a senha do Pool é diferente da senha do Postgres da máquina.
- relation "barbeiro" does not exist: o saep_db.sql não foi rodado no banco saep_db.
- Login sempre dá "CPF ou senha inválidos!": digite o CPF igual ao do INSERT, com pontos e traço.
```

> Os testes de cada rota (REST Client) estão em **#4_referencias.md** e as telas em **#5_FRONT.md**.
