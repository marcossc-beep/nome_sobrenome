# Introdução

```js
API serve para conectar no banco, o que usamos em aula foi a biblioteca do PG para integrar a api com o postgres.
Usamos o PG Admin para gerenciar o postgres criando os bancos de dados e as tabelas no banco.
```

## utilização do fastify para gerenciar o servidor e a comunicação com o http.

```js
// Quando vamos construir uma casa não precisamos criar os próprios tijólos nós compramos prontos e usamos.
// O fastify é como a loja onde encontramos os meios para criar a casa sem precisar criar esses meios a cada projeto.

import Fastify from 'fastify'
const servidor = Fastify();
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

// await sql.query('DELETE FROM usuario where id = $1', [id]) 

// $1 é o valor da variável id que está no array de dependencias.

// OUTRO EXEMPLO:

// await sql.query('INSERT INTO usuario (nome, cpf, senha) VALUES ($1, $2, $3)', [body.nome, body.cpf, body.senha])  

// podem ter outros elementos no array de dependencias 

// $1 vai receber o valor de body.nome,
// $2 vai receber o valor de body.cpf,
// $3 vai receber o valor de body.senha

// isso é necessário para evitar SQL injection
```

## REQUISIÇÕES HTTP

```js
// Toda requisição tem um método então GET, POST, PUT, PATCH ou DELETE.
// Toda requisição tem um nome de endpoint por exemplo /login.
// Quando fazemos requisições alguns métodos podem ter um body também conhecido como payload.
// As requisições tem um header, normalmente usamos o Content-Type: application/json para enviar json no body.
// O método post, put e patch podem ter um body.
```

## GET

```js
// Quando vamos buscar algo no servidor usamos o metodo get o endpoint abaixo retorna todos os registros da tabela.

// reply é usado para enviar uma resposta personalizada

// onde está '/usuarios' é o nome do endpoint precisa estar igual na documentação
// por exemplo GET http://localhost:6767/usuarios 
servidor.get('/usuarios', async (request, reply) => {

    // usuario é o nome da tabela nesse exemplo
    const usuarios = await sql.query('select * from usuario')
    
    // usuarios é uma variável criada que recebe tudo que veio da tabela usuario
    // usuarios.rows é para retornar somente as linhas da tabela
    reply.send(usuarios.rows)
})
```

## GET com busca por termo (query params)

```js
// Tudo que vem depois do ? na URL chega em request.query:
// GET http://localhost:6767/usuarios?busca=ana  ->  request.query.busca === 'ana'
// Se não vier nada, request.query.busca é undefined e a rota lista todos.

// Use este GET no lugar do GET simples de cima (duas rotas iguais dão erro no Fastify).
// O SQL com ILIKE está no SQL.md: ele ignora maiúsculas/minúsculas e o % vale por "qualquer texto antes ou depois".
// Repare que a senha não é pedida no SELECT: não devolvemos o que não precisa aparecer.

servidor.get('/usuarios', async (request, reply) => {
    const busca = request.query.busca

    if (busca) {
        const usuarios = await sql.query(
            'SELECT id, nome, cpf FROM usuario WHERE nome ILIKE $1 ORDER BY id',
            [`%${busca}%`]
        )
        return reply.send(usuarios.rows)
    }

    const usuarios = await sql.query('SELECT id, nome, cpf FROM usuario ORDER BY id')
    reply.send(usuarios.rows)
})
```

## GET com JOIN (juntando tabelas)

```js
// O SQL do JOIN está no SQL.md. Na API é só colocar o mesmo SQL dentro do sql.query.
// Entre crases ( ` ) o SQL pode ficar em várias linhas. Use AS para dar apelido às colunas
// e ORDER BY para ordenar (aqui, pela data da reunião).

servidor.get('/reunioes', async (request, reply) => {
    const reunioes = await sql.query(`
        SELECT
            reuniao.id,
            reuniao.data_hora,
            usuario.nome AS organizador,
            sala.nome AS sala_reservada,
            sala.bloco
        FROM reuniao
        INNER JOIN usuario ON reuniao.usuario_id = usuario.id
        INNER JOIN sala ON reuniao.sala_id = sala.id
        ORDER BY reuniao.data_hora ASC
    `)
    reply.send(reunioes.rows)
})
```

## POST

```js
// request é onde ficam as informações que vieram na requisição como o body

// Cadastrando usuarrios
servidor.post('/usuarios', async (request, reply) => {
    // pegando as informações que vieram do body da requisição
    const body = request.body

    // insert na tabela através da api de acordo com as informações que vieram do body

    const resultado = await sql.query(
        'INSERT INTO usuario (nome, cpf, senha) VALUES ($1, $2, $3)',
        [body.nome, body.cpf, body.senha]
    )

    reply.status(201).send({ message: "usuario cadastrado!" })
})
```

## POST que depende de outra tabela (chave estrangeira)

```js
// A sala pertence a um usuário (sala.usuario_id). Antes de gravar, conferimos se o usuário existe.
// Sem essa conferência, um id que não existe faz o Postgres dar erro e a API responde 500.
// A reunião tem duas chaves estrangeiras (usuario_id e sala_id): é a mesma ideia, conferindo as duas.

servidor.post('/salas', async (request, reply) => {
    const body = request.body

    const usuario = await sql.query('SELECT id FROM usuario WHERE id = $1', [body.usuario_id])
    if (usuario.rows.length === 0) {
        return reply.status(400).send({ message: "Usuário informado não existe!" })
    }

    await sql.query(
        'INSERT INTO sala (nome, bloco, usuario_id) VALUES ($1, $2, $3)',
        [body.nome, body.bloco, body.usuario_id]
    )

    reply.status(201).send({ message: "Sala cadastrada!" })
})
```

## PUT

```js
// put é usado para alterar algo no servidor então é necessário enviar na requisição o id e o body.

// o id é o que será editado e o body é o que será inserido no lugar.
// normalmente enviamos o id na propria url da requisição por isso :id

// Os números $1, $2, $3... são só a posição de cada valor no array do segundo parâmetro do sql.query.
// Não precisam seguir a ordem das colunas. Aqui o id é sempre o $1 (WHERE id = $1) para ficar fácil de lembrar.

servidor.put('/usuarios/:id', async (request, reply) => {
    const body = request.body;
    const id = request.params.id;

    const usuario = await sql.query('select * from usuario where id = $1', [id])  
    if (usuario.rows.length === 0) {
        return reply.status(400).send({
            message: "Usuário não existe!"
        })
    }

    const resultado = await sql.query('UPDATE usuario SET nome = $2, cpf = $3, senha = $4 WHERE id = $1', [id, body.nome, body.cpf, body.senha])      
    reply.status(201).send({message: `usuario ${body.nome} alterado!`})          
})
```

## PUT que altera só um campo (ex: só a data)

```js
// resultado.rowCount diz quantas linhas o UPDATE alterou. Se foi zero, o id não existe (404).
// Sempre use WHERE no UPDATE. Sem o WHERE, todas as linhas da tabela mudam.
// A data vai no formato 2026-12-20T09:00 (o mesmo que o input datetime-local do HTML devolve).

servidor.put('/reunioes/:id', async (request, reply) => {
    const body = request.body
    const id = request.params.id

    const resultado = await sql.query(
        'UPDATE reuniao SET data_hora = $2 WHERE id = $1',
        [id, body.data_hora]
    )

    if (resultado.rowCount === 0) {
        return reply.status(404).send({ message: "Reunião não existe!" })
    }

    reply.status(200).send({ message: "Data da reunião atualizada!" })
})
```

## DELETE

```js
// é necessário enviar para o servidor o id de qual registro será deletado.
// normalmente enviamos o id na propria url da requisição por isso :id

servidor.delete('/usuarios/:id', async (request, reply) => {
    const id = request.params.id
    const resultado = await sql.query('DELETE FROM usuario where id = $1', [id]) 
    console.log(resultado);    
    reply.status(200).send({message:'Usuário Deletado!'})
})
```

## Listen

```js
// é necessário definir a porta que a api vai rodar no caso 6767
// Esse código normalmente fica no final do arquivo server.js 

servidor.listen({   
    port: 6767
})
```

> Os testes de cada rota (REST Client) estão em **referencias.md**.
