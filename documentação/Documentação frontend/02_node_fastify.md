# Node.js, Fastify, pg, bcrypt e JWT (API)

Referências:
- Node.js: https://nodejs.org/docs/latest/api/
- Fastify: https://fastify.dev/docs/latest/
- @fastify/cors: https://github.com/fastify/fastify-cors
- @fastify/jwt: https://github.com/fastify/fastify-jwt
- bcrypt: https://github.com/kelektiv/node.bcrypt.js
- node-postgres (pg): https://node-postgres.com/

Exemplos: API da barbearia (arquivo `server.js`, porta 6767, banco `saep_db`).

## Conceitos

Uma **API** recebe pedidos HTTP (requisições), executa alguma ação (normalmente um SQL no banco) e devolve uma resposta, quase sempre em JSON.

Toda requisição tem:
- **método**: o tipo de ação. `GET` consulta, `POST` cria, `PUT` altera, `DELETE` apaga;
- **caminho** (rota ou endpoint): o endereço depois da porta, como `/barbeiros`;
- **corpo** (body), só em `POST` e `PUT`: os dados enviados, em JSON.

| Biblioteca | Função |
|---|---|
| `fastify` | cria o servidor HTTP e as rotas |
| `@fastify/cors` | libera páginas abertas no navegador a chamarem a API |
| `pg` | conecta no PostgreSQL e executa SQL |
| `bcrypt` | gera e confere hash (CPF e senha) |
| `@fastify/jwt` | gera e confere o token de sessão |

## Execução

| Comando (terminal do VS Code) | Efeito |
|---|---|
| `npm start` | inicia a API; reinicia sozinha a cada vez que o `server.js` é salvo |
| Ctrl + C | para a API |

O projeto já traz as bibliotecas na pasta `node_modules` e o `package.json` com `"type": "module"` (necessário para usar `import`).

## Estrutura do server.js

O arquivo é lido de cima para baixo. A ordem dos blocos:

1. `import` das bibliotecas;
2. criação do servidor (`Fastify()`) e `register` dos plugins (cors e jwt);
3. conexão com o banco (`Pool`);
4. função `autenticar` (antes das rotas que a usam);
5. rotas;
6. `listen`, que liga o servidor na porta.

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
    host: 'localhost',     // o banco está na própria máquina
    port: 5432,            // porta do Postgres
    database: 'saep_db'    // nome do banco
})

// ... função autenticar e rotas ...

servidor.listen({ port: 6767 }).then(() => console.log('API rodando em http://localhost:6767'))
```

- `origin: '*'` aceita chamadas de qualquer página. Um método fora de `methods` é bloqueado pelo navegador (o REST Client não passa por essa regra).
- Os dados do `Pool` são os do Postgres da máquina; `password authentication failed` ou `ECONNREFUSED` indicam senha ou porta diferentes.
- Cada `register` aparece uma única vez no arquivo.

## bcrypt

Gera um **hash**: um texto embaralhado de 60 caracteres que não volta ao original. Para conferir uma senha, o texto digitado é comparado com o hash guardado.

```js
const hash = await bcrypt.hash('senha123', 10)          // '$2b$10$...' (10 = custo: quantas rodadas)
const igual = await bcrypt.compare('senha123', hash)    // true
```

O `hash` mistura um valor aleatório (salt) a cada chamada: o mesmo texto gera hashes diferentes. Por isso não existe `WHERE cpf = hash` — os registros são lidos e conferidos um a um com `compare`.

## JWT

Um token JWT é um texto assinado pelo servidor, entregue no login. O front envia o token em toda requisição seguinte, no cabeçalho `Authorization: Bearer <token>`. O token tem prazo de validade (`exp`); vencido, deixa de ser aceito. É isso que cria a sessão com tempo de expiração.

| Função | Uso |
|---|---|
| `servidor.jwt.sign(payload)` | gera um token com os dados do `payload` (id e nome; nunca a senha) |
| `servidor.jwt.decode(token)` | lê o conteúdo do token |
| `await request.jwtVerify()` | confere o token do cabeçalho `Authorization`; lança erro se for inválido ou expirado |
| `request.user` | dados do token depois do `jwtVerify()` |

`expiresIn`: `'30s'`, `'10m'`, `'1h'`, `'7d'`. O campo `exp` do token é o momento em que ele vence, em **segundos** desde 01/01/1970; `Date.now()` do JavaScript usa milissegundos, por isso `exp * 1000`.

## Rotas protegidas (preHandler)

`preHandler` é uma função que roda antes da rota. Se ela responder (com `reply`), a rota não executa. A função `autenticar` tenta verificar o token e, se falhar, responde 401.

```js
async function autenticar(request, reply) {
    try {
        await request.jwtVerify()
    } catch (erro) {
        return reply.status(401).send({ message: 'Sessão expirada ou inválida. Faça login novamente.' })
    }
}
```

- `try` executa o bloco; se algo lançar erro, o `catch` executa no lugar.
- A rota protegida recebe um objeto `{ preHandler: autenticar }` entre o caminho e a função:

```js
servidor.get('/barbeiros', { preHandler: autenticar }, async (request, reply) => { ... })
```

Todas as rotas levam o `preHandler`, menos o `/login` (quem ainda não tem token precisa conseguir entrar). A função precisa estar escrita antes das rotas que a usam.

## Rotas

Uma rota é criada com o método do servidor de mesmo nome (`get`, `post`, `put`, `delete`), o caminho e uma função `async` que recebe `request` (o pedido) e `reply` (a resposta).

```js
servidor.get('/caminho', { preHandler: autenticar }, async (request, reply) => {
    // código da rota
    reply.send(resposta)
})
```

- `async` permite usar `await` dentro da função. `await` espera o banco responder antes de seguir para a próxima linha.
- Cada combinação de método + caminho existe uma única vez no arquivo. Uma rota repetida impede a API de iniciar: `Method 'GET' already declared for route '/barbeiros'`. O mesmo caminho com métodos diferentes (`GET /barbeiros` e `POST /barbeiros`) são rotas diferentes.

## Request: de onde vêm os dados

| Propriedade | Conteúdo | Exemplo |
|---|---|---|
| `request.params` | partes da URL marcadas com `:` no caminho | rota `/barbeiros/:id`, URL `/barbeiros/2` → `request.params.id` vale `'2'` |
| `request.query` | parâmetros depois do `?` na URL | URL `/barbeiros?busca=ana` → `request.query.busca` vale `'ana'` |
| `request.body` | JSON enviado no corpo (POST e PUT) | `{ "nome": "Ana" }` → `request.body.nome` vale `'Ana'` |

Parâmetro que não veio na requisição vale `undefined`.

## Reply: a resposta

`reply.send(objeto)` devolve o objeto em JSON com status 200. `reply.status(código)` troca o status antes do `send`.

```js
reply.send(barbeiros.rows)                                   // 200 com a lista
reply.status(201).send({ message: 'Barbeiro cadastrado!' })   // 201 com uma mensagem
return reply.status(404).send({ message: 'Barbeiro não existe!' })
```

`return` antes do `reply` encerra a função ali: o código abaixo não executa. É o que se usa nas validações.

| Código | Significado |
|---|---|
| 200 | OK |
| 201 | criado |
| 400 | dado faltando ou inválido |
| 401 | não autorizado (login inválido, token ausente ou expirado) |
| 404 | não encontrado |
| 500 | erro no servidor (mensagem no terminal do `npm start`) |

## sql.query

`sql.query(textoSQL, valores)` executa o SQL no banco e devolve um resultado:

```js
const resultado = await sql.query('SELECT * FROM barbeiro')
resultado.rows        // array com as linhas (cada linha é um objeto { id, nome, ... })
resultado.rowCount    // quantidade de linhas retornadas ou alteradas
```

Valores vindos do usuário não são colados no texto do SQL. No lugar de cada valor vai um marcador `$1`, `$2`, `$3`..., e os valores vão em um array no segundo argumento: `$1` recebe o primeiro item do array, `$2` o segundo, e assim por diante. A biblioteca envia os valores separados do comando, o que impede SQL injection.

```js
await sql.query('SELECT * FROM barbeiro WHERE id = $1', [id])
await sql.query('UPDATE barbeiro SET nome = $2 WHERE id = $1', [id, body.nome])
```

A ordem dos `$n` no texto não precisa seguir a ordem das colunas; vale a posição no array.

## Login com bcrypt e JWT

O CPF guardado é hash, então o barbeiro é encontrado lendo todos e comparando o CPF digitado com o hash de cada um (`for...of` percorre o array; `break` para no primeiro que bater). Depois, a senha digitada é comparada com o hash da senha.

- 400 quando faltar CPF ou senha.
- 401 com a mesma mensagem quando o CPF não existe ou a senha está errada: assim a resposta não revela quais CPFs estão cadastrados.
- Com tudo certo, gera o token e devolve também o usuário e o horário de expiração em milissegundos (o front usa para encerrar a sessão).

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

A mesma rota lista tudo ou filtra, conforme a URL tenha ou não o `?busca=`.

- `if (busca)` é verdadeiro quando veio um termo (texto vazio e `undefined` contam como falso).
- O termo entra no `ILIKE` com `%` dos dois lados ("contém"). Os `%` ficam no **valor** (`` `%${busca}%` ``), não no texto do SQL.
- `` `...${variavel}...` `` (crase) monta um texto com o valor da variável dentro.
- O SELECT lista só `id` e `nome`: CPF e senha são hash e não saem da API.

```js
// GET /barbeiros              -> lista todos
// GET /barbeiros?busca=ana    -> lista só os que contêm "ana" no nome
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

Busca em mais de uma coluna com o mesmo termo: o mesmo `$1` pode aparecer duas vezes.

```js
sql.query('SELECT * FROM cliente WHERE nome ILIKE $1 OR cpf ILIKE $1', [`%${busca}%`])
```

## GET com JOIN

O SQL do JOIN (ver `01_postgresql.md`) entra inteiro no `sql.query`. Entre crases, o texto pode ocupar várias linhas.

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

Cada objeto da lista tem as colunas do cliente e o `barbeiro_nome` (o nome do apelido `AS`).

## GET com JOIN de três tabelas, ordenado por data

Listagem com os dados do barbeiro (sem CPF e senha, que são hash) e do cliente de cada agendamento. Os apelidos (`barbeiro_nome`, `cliente_cpf`...) viram os nomes dos campos no JSON.

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

Ordenação só pelo dia, pelo mês ou pelo ano: troca-se a linha do `ORDER BY` pelas formas da tabela de ordenação do `01_postgresql.md`, por exemplo `ORDER BY EXTRACT(MONTH FROM agendamento.data_hora), agendamento.data_hora`.

> **Fuso horário.** A coluna `TIMESTAMP` não guarda fuso. A biblioteca `pg` lê a data como horário local e o JSON a envia em UTC: `20/11/2026 14:00` no banco chega como `"data_hora": "2026-11-20T17:00:00.000Z"` (3 horas a mais, com `Z` no fim). O valor no banco está certo; muda só a exibição. O `TO_CHAR` do SELECT entrega a `data_formatada` (`"20/11/2026 14:00"`) já no horário de Brasília. No JavaScript, `new Date(data_hora).toLocaleString('pt-BR')` faz a mesma conversão.

## POST: cadastrar com criptografia

Os campos chegam em `request.body` e entram no INSERT, cada um no seu `$n`. O CPF e a senha passam antes pelo `bcrypt.hash`: o que vai para o banco é o hash. O status 201 indica que algo foi criado.

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

Antes de gravar, um SELECT confere se o registro referenciado existe. `rows.length === 0` significa que não existe: a rota responde 400 e para. Sem essa conferência, o banco recusa o INSERT (chave estrangeira) e a API responde 500.

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

Com duas chaves estrangeiras, as duas são conferidas. `||` (ou) junta as condições: basta uma faltar para responder 400.

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

## PUT: editar

O `id` de quem será alterado vem na URL (`:id` → `request.params.id`) e os dados novos vêm no corpo. Um SELECT confere se o id existe (404 quando não existe) e o UPDATE grava. O `WHERE id = $1` garante que só essa linha muda.

No barbeiro, o CPF e a senha atuais são hash e não aparecem na tela. Por isso eles só mudam quando chegam preenchidos (`if (body.cpf)`), e entram de novo como hash.

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

PUT de uma tabela com chave estrangeira junta as duas conferências: o registro editado existe (404) e o registro referenciado existe (400).

```js
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
```

## PUT de um campo só, usando rowCount

Quando só um campo muda, o próprio UPDATE informa se o id existia: `rowCount` é a quantidade de linhas alteradas. Zero significa que nenhuma linha tinha aquele id.

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

O id vem na URL; DELETE não tem corpo.

```js
servidor.delete('/barbeiros/:id', { preHandler: autenticar }, async (request, reply) => {
    const id = request.params.id
    await sql.query('DELETE FROM barbeiro WHERE id = $1', [id])
    reply.status(200).send({ message: 'Barbeiro deletado!' })
})
```

Com `ON DELETE CASCADE`, os clientes e agendamentos do barbeiro também são apagados. Para as outras tabelas, muda só o caminho (`/clientes/:id`, `/agendamentos/:id`) e o nome da tabela no SQL.

## Erros comuns

| Sintoma | Causa |
|---|---|
| `Method 'GET' already declared for route '/x'` | a mesma rota foi escrita duas vezes |
| `EADDRINUSE` | já tem uma API rodando na porta; feche o outro terminal |
| `password authentication failed` | usuário ou senha do Postgres errados no `Pool` |
| `connect ECONNREFUSED 127.0.0.1:5432` | porta do `Pool` diferente da porta do Postgres |
| `database "x" does not exist` | nome do banco errado no `Pool` |
| `x is not defined` | variável ou função usada antes de ser criada, ou nome escrito diferente |
| `autenticar is not defined` | a função `autenticar` está escrita depois das rotas |
| 401 em todas as rotas | falta o cabeçalho `Authorization: Bearer <token>` ou o token expirou |
| `Illegal arguments: string, undefined` | `bcrypt.compare` ou `bcrypt.hash` recebeu um campo vazio |
| 404 `Route GET:/x not found` | caminho ou método diferente do definido na rota |
| 500 | erro no SQL; a mensagem aparece no terminal do `npm start` |
| `request.body` é `undefined` | faltou `Content-Type: application/json` na requisição |
| login sempre 401 com dados certos | CPF ou senha do banco em texto puro (sem hash), ou CPF digitado diferente do original |
