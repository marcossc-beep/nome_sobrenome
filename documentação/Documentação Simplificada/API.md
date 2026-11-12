# Introdução

```js
API serve para conectar no banco, o que usamos em aula foi a biblioteca do PG para integrar a api com o postgres.
Usamos o PG Admin para gerenciar o postgres criando os bancos de dados e as tabelas no banco.
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
```

## utilização do fastify para gerenciar o servidor e a comunicação com o http.

```js
// Quando vamos construir uma casa não precisamos criar os próprios tijólos nós compramos prontos e usamos.
// O fastify é como a loja onde encontramos os meios para criar a casa sem precisar criar esses meios a cada projeto.

import Fastify from 'fastify'
import cors from '@fastify/cors'

const servidor = Fastify();

// O cors libera o front-end (index.html aberto no navegador) a chamar a API.
servidor.register(cors, { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] })
```

## Como conectar a API no banco de dados:

```js
import { Pool } from 'pg' // importação da biblioteca de conexão com o postgress

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
```

## GET

```js
// Quando vamos buscar algo no servidor usamos o metodo get o endpoint abaixo retorna todos os registros da tabela.

// reply é usado para enviar uma resposta personalizada

// onde está '/clientes' é o nome do endpoint precisa estar igual na documentação
// por exemplo GET http://localhost:6767/clientes 
servidor.get('/clientes', async (request, reply) => {

    // cliente é o nome da tabela nesse exemplo
    const clientes = await sql.query('select * from cliente')
    
    // clientes é uma variável criada que recebe tudo que veio da tabela cliente
    // clientes.rows é para retornar somente as linhas da tabela
    reply.send(clientes.rows)
})
```

## GET com busca por termo (query params)

```js
// Tudo que vem depois do ? na URL chega em request.query:
// GET http://localhost:6767/barbeiros?busca=ana  ->  request.query.busca === 'ana'
// Se não vier nada, request.query.busca é undefined e a rota lista todos.

// O SQL com ILIKE está no SQL.md: ele ignora maiúsculas/minúsculas e o % vale por "qualquer texto antes ou depois".
// Repare que o cpf e a senha não são pedidos no SELECT: estão criptografados e não devem sair da API.

servidor.get('/barbeiros', async (request, reply) => {
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

## GET com JOIN (juntando tabelas)

```js
// O SQL do JOIN está no SQL.md. Na API é só colocar o mesmo SQL dentro do sql.query.
// Entre crases ( ` ) o SQL pode ficar em várias linhas. Use AS para dar apelido às colunas
// e ORDER BY para ordenar (aqui, pela data do agendamento).

servidor.get('/agendamentos', async (request, reply) => {
    const agendamentos = await sql.query(`
        SELECT
            agendamento.id,
            agendamento.data_hora,
            barbeiro.nome AS barbeiro_nome,
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

    // LGPD: crypt(..., gen_salt('bf')) grava o cpf e a senha criptografados (precisa do pgcrypto, veja o fim do SQL.md)
    const resultado = await sql.query(
        "INSERT INTO barbeiro (nome, cpf, senha) VALUES ($1, crypt($2, gen_salt('bf')), crypt($3, gen_salt('bf')))",
        [body.nome, body.cpf, body.senha]
    )

    reply.status(201).send({ message: "barbeiro cadastrado!" })
})

// Confira no pgAdmin (SELECT * FROM barbeiro): o cpf e a senha do novo barbeiro aparecem como $2a$06$...
// Repare que a query está entre aspas duplas, porque o 'bf' dentro dela usa aspas simples.
```

## POST que depende de outra tabela (chave estrangeira)

```js
// O cliente pertence a um barbeiro (cliente.barbeiro_id). Antes de gravar, conferimos se o barbeiro existe.
// Sem essa conferência, um id que não existe faz o Postgres dar erro e a API responde 500.
// O agendamento tem duas chaves estrangeiras (barbeiro_id e cliente_id): é a mesma ideia, conferindo as duas.

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

// Cadastrando um agendamento: a mesma ideia, conferindo as duas chaves estrangeiras.
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

servidor.put('/barbeiros/:id', async (request, reply) => {
    const body = request.body;
    const id = request.params.id;

    const barbeiro = await sql.query('select * from barbeiro where id = $1', [id])
    if (barbeiro.rows.length === 0) {
        return reply.status(404).send({
            message: "Barbeiro não existe!"
        })
    }

    // cpf e senha continuam criptografados na edição (mesmo crypt do cadastro)
    await sql.query(
        "UPDATE barbeiro SET nome = $2, cpf = crypt($3, gen_salt('bf')), senha = crypt($4, gen_salt('bf')) WHERE id = $1",
        [id, body.nome, body.cpf, body.senha]
    )
    reply.status(200).send({message: `barbeiro ${body.nome} alterado!`})
})

// O PUT de cliente é igual, trocando a tabela e as colunas (nome, cpf, barbeiro_id).
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
    const resultado = await sql.query('DELETE FROM barbeiro where id = $1', [id]) 
    console.log(resultado);    
    reply.status(200).send({message:'Barbeiro Deletado!'})
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

> Os testes de cada rota (REST Client) estão em **referencias.md**.
