# Node.js, Fastify e pg (API)

Referências:
- Node.js: https://nodejs.org/docs/latest/api/
- Fastify: https://fastify.dev/docs/latest/
- @fastify/cors: https://github.com/fastify/fastify-cors
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

### Métodos HTTP

| Método | Uso | Tem corpo | Seguro | Idempotente |
|---|---|---|---|---|
| `GET` | consultar | não | sim | sim |
| `POST` | criar | sim | não | não |
| `PUT` | alterar um registro existente | sim | não | sim |
| `DELETE` | apagar | não | não | sim |

- **Seguro**: não altera nada no servidor. Um GET pode ser repetido à vontade.
- **Idempotente**: repetir a mesma requisição deixa o banco no mesmo estado que uma vez só. Dois `DELETE /barbeiros/3` apagam o barbeiro 3 uma vez; dois `POST /barbeiros` cadastram dois barbeiros.

### Como é uma requisição e uma resposta

O que trafega entre o REST Client (ou a página) e a API é texto, neste formato:

```http
POST /barbeiros HTTP/1.1
Host: localhost:6767
Content-Type: application/json

{"nome": "Thiago Pente", "cpf": "777.888.999-00", "senha": "senha000"}
```

```http
HTTP/1.1 201 Created
content-type: application/json; charset=utf-8

{"message": "Barbeiro cadastrado!"}
```

| Parte | Requisição | Resposta |
|---|---|---|
| 1ª linha | método, caminho e versão do HTTP | versão, código de status e o nome dele |
| cabeçalhos | informações sobre o pedido (`Content-Type` diz que o corpo é JSON) | informações sobre a resposta |
| linha em branco | separa os cabeçalhos do corpo | separa os cabeçalhos do corpo |
| corpo | os dados enviados (POST e PUT) | os dados devolvidos |

### JSON

Formato de texto usado no corpo das requisições e das respostas.

- Objeto entre `{ }`, lista entre `[ ]`.
- Chaves e textos **sempre entre aspas duplas**: `"nome": "Ana"`. Números e `true`/`false`/`null` sem aspas: `"barbeiro_id": 1`.
- Itens separados por vírgula, **sem vírgula depois do último**.
- No JavaScript, `JSON.stringify(objeto)` transforma objeto em texto JSON e `JSON.parse(texto)` faz o contrário. O Fastify faz as duas conversões sozinho: `request.body` já chega como objeto e `reply.send(objeto)` já sai como JSON.

## Execução

| Comando (terminal do VS Code) | Efeito |
|---|---|
| `npm start` | inicia a API; reinicia sozinha a cada vez que o `server.js` é salvo |
| Ctrl + C | para a API |

O projeto já traz as bibliotecas na pasta `node_modules` e o `package.json` com `"type": "module"` (necessário para usar `import`).

## Estrutura do server.js

O arquivo é lido de cima para baixo. A ordem dos blocos:

1. `import` das bibliotecas;
2. criação do servidor (`Fastify()`) e `register` dos plugins (cors);
3. conexão com o banco (`Pool`);
4. rotas;
5. `listen`, que liga o servidor na porta.

```js
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Pool } from 'pg'

const servidor = Fastify()

servidor.register(cors, { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] })

const sql = new Pool({
    user: 'postgres',      // usuário do Postgres
    password: 'senai',     // senha do Postgres
    host: 'localhost',     // o banco está na própria máquina
    port: 5432,            // porta do Postgres
    database: 'saep_db'    // nome do banco
})

// ... rotas ...

servidor.listen({ port: 6767 }).then(() => console.log('API rodando em http://localhost:6767'))
```

- `origin: '*'` aceita chamadas de qualquer página. Um método fora de `methods` é bloqueado pelo navegador (o REST Client não passa por essa regra).
- Os dados do `Pool` são os do Postgres da máquina; `password authentication failed` ou `ECONNREFUSED` indicam senha ou porta diferentes.

### Fastify(): opções

`Fastify()` aceita um objeto de opções. A mais útil para estudar é o `logger`, que escreve no terminal cada requisição recebida e cada resposta (método, caminho, status e tempo):

```js
const servidor = Fastify({ logger: true })
```

### register

`servidor.register(plugin, opções)` acrescenta um recurso ao servidor (no projeto, o CORS). Cada plugin é registrado uma vez, antes das rotas.

### listen

`servidor.listen({ port, host })` liga o servidor e devolve uma *promise*: o `.then(...)` executa quando ele já está aceitando requisições.

| Opção | Padrão | Efeito |
|---|---|---|
| `port` | 0 (uma porta qualquer) | a porta da API; no projeto, 6767 |
| `host` | `'localhost'` | só aceita chamadas do próprio computador; `'0.0.0.0'` aceita de outros computadores da rede |

### Opções do @fastify/cors

O navegador bloqueia uma página que chama uma API em outro endereço (outra porta já conta como outro endereço: `127.0.0.1:5500` do Live Server e `localhost:6767` da API). O plugin de CORS responde ao navegador quais páginas e métodos são liberados.

| Opção | Padrão | No projeto |
|---|---|---|
| `origin` | `'*'` (qualquer página) | `'*'` |
| `methods` | `GET,HEAD,POST` | `['GET', 'POST', 'PUT', 'DELETE']`: sem listar, PUT e DELETE são bloqueados no navegador |
| `allowedHeaders` | os cabeçalhos que a página pedir | não precisa mudar (o `Content-Type` passa) |

Antes de um PUT, de um DELETE ou de um POST com JSON, o navegador manda sozinho uma requisição `OPTIONS` (*preflight*) perguntando se pode; o plugin responde. Ela aparece na aba Network do navegador e não precisa de rota.

### Opções do Pool (pg)

| Opção | Valor |
|---|---|
| `user`, `password` | usuário e senha do Postgres |
| `host`, `port` | onde o Postgres está (`localhost`, `5432`) |
| `database` | nome do banco |
| `max` | quantidade máxima de conexões abertas ao mesmo tempo (padrão: 10) |

O `Pool` mantém conexões abertas e reaproveita: cada `sql.query` pega uma conexão livre, executa e devolve. Por isso o `Pool` é criado uma vez só, no começo do arquivo.

## Rotas

Uma rota é criada com o método do servidor de mesmo nome (`get`, `post`, `put`, `delete`), o caminho e uma função `async` que recebe `request` (o pedido) e `reply` (a resposta).

```js
servidor.get('/caminho', async (request, reply) => {
    // código da rota
    reply.send(resposta)
})
```

- `async` permite usar `await` dentro da função. `await` espera o banco responder antes de seguir para a próxima linha.
- Cada combinação de método + caminho existe uma única vez no arquivo. Uma rota repetida impede a API de iniciar: `Method 'GET' already declared for route '/barbeiros'`. O mesmo caminho com métodos diferentes (`GET /barbeiros` e `POST /barbeiros`) são rotas diferentes.

### Formas de declarar uma rota

Todos os métodos HTTP têm a sua forma curta, com o mesmo formato `(caminho, [opções], função)`:

| Declaração | Método |
|---|---|
| `servidor.get(caminho, função)` | GET |
| `servidor.post(caminho, função)` | POST |
| `servidor.put(caminho, função)` | PUT |
| `servidor.delete(caminho, função)` | DELETE |
| `servidor.patch(caminho, função)` | PATCH (alterar só parte do registro) |

A forma completa, equivalente, usa um objeto:

```js
servidor.route({
    method: 'GET',
    url: '/barbeiros',
    handler: async (request, reply) => {
        // código da rota
    }
})
```

### Caminhos com parâmetro

- `:nome` no caminho marca um pedaço variável: `/barbeiros/:id` atende `/barbeiros/1`, `/barbeiros/2`...
- `/barbeiros` e `/barbeiros/:id` são caminhos diferentes: o primeiro é a lista, o segundo um registro só.
- Um caminho pode ter mais de um parâmetro: `/barbeiros/:id/clientes/:clienteId`.

### return ou reply.send

Numa função `async`, a documentação do Fastify aceita duas formas de responder:

```js
servidor.get('/barbeiros', async (request, reply) => {
    const barbeiros = await sql.query('SELECT id, nome FROM barbeiro')
    return barbeiros.rows                       // o valor devolvido vira a resposta (200)
})

servidor.get('/barbeiros', async (request, reply) => {
    const barbeiros = await sql.query('SELECT id, nome FROM barbeiro')
    return reply.send(barbeiros.rows)           // forma recomendada com reply.send
})
```

O `reply.send(...)` na última linha, sem `return`, também funciona porque nada roda depois dele. Duas respostas na mesma requisição dão o erro `Reply was already sent`: por isso as validações usam `return reply.status(...).send(...)`.

## Request: de onde vêm os dados

| Propriedade | Conteúdo | Exemplo |
|---|---|---|
| `request.params` | partes da URL marcadas com `:` no caminho | rota `/barbeiros/:id`, URL `/barbeiros/2` → `request.params.id` vale `'2'` |
| `request.query` | parâmetros depois do `?` na URL | URL `/barbeiros?busca=ana` → `request.query.busca` vale `'ana'` |
| `request.body` | JSON enviado no corpo (POST e PUT) | `{ "nome": "Ana" }` → `request.body.nome` vale `'Ana'` |

Parâmetro que não veio na requisição vale `undefined`.

Outras propriedades do `request`:

| Propriedade | Conteúdo |
|---|---|
| `request.headers` | os cabeçalhos, com nomes em minúsculas (`request.headers['content-type']`) |
| `request.method` | o método (`'GET'`, `'POST'`...) |
| `request.url` | o caminho com a query (`'/barbeiros?busca=ana'`) |

- `params` e `query` sempre chegam como **texto**: `request.params.id` vale `'2'`, não `2`. No `sql.query` isso não atrapalha (o Postgres converte para a coluna `INT`); numa conta no JavaScript, converta com `Number(request.params.id)`.
- O `request.body` só é preenchido quando a requisição tem o cabeçalho `Content-Type: application/json`. Sem ele, o corpo é ignorado.
- Com `Content-Type: application/json` e corpo vazio, o Fastify responde 400 sozinho: `Body cannot be empty when content-type is set to 'application/json'`. Com JSON mal escrito: `Body is not valid JSON but content-type is set to 'application/json'`. Nos dois casos a rota nem executa.

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
| 204 | deu certo e não há nada para devolver (resposta sem corpo) |
| 400 | dado faltando ou inválido |
| 401 | não autorizado (login inválido) |
| 404 | não encontrado |
| 409 | conflito com o que já existe (ex.: CPF já cadastrado) |
| 500 | erro no servidor (mensagem no terminal do `npm start`) |

Os códigos seguem faixas: 2xx deu certo, 4xx o erro foi de quem pediu (dado faltando, id que não existe), 5xx o erro foi do servidor.

### Métodos do reply

| Método | Efeito |
|---|---|
| `reply.status(n)` ou `reply.code(n)` | define o código da resposta (padrão: 200) |
| `reply.header('nome', 'valor')` | acrescenta um cabeçalho à resposta |
| `reply.send(dado)` | envia a resposta. Objeto ou array saem como JSON (`content-type: application/json; charset=utf-8`); texto sai como texto puro |

Os métodos podem ser encadeados: `reply.status(201).header('x-total', '3').send({ ... })`.

### Erros que o próprio Fastify responde

Quando uma rota lança um erro que ninguém tratou (um SQL errado, por exemplo), o Fastify responde 500 neste formato, e a mensagem completa aparece no terminal:

```json
{ "statusCode": 500, "error": "Internal Server Error", "message": "relation \"barbeiros\" does not exist" }
```

Caminho ou método sem rota:

```json
{ "message": "Route GET:/barbeiro not found", "error": "Not Found", "statusCode": 404 }
```

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

### O objeto de resultado

| Propriedade | Conteúdo |
|---|---|
| `rows` | array com as linhas; cada linha é um objeto com as colunas (ou os apelidos `AS`) como chaves |
| `rowCount` | linhas devolvidas (SELECT) ou afetadas (INSERT, UPDATE, DELETE) |
| `fields` | informações das colunas do resultado (nome e tipo) |
| `command` | o comando executado: `'SELECT'`, `'INSERT'`, `'UPDATE'`, `'DELETE'` |

### Tipos que chegam no JavaScript

| No Postgres | No JavaScript | Exemplo |
|---|---|---|
| `INTEGER`, `SERIAL` | número | `1` |
| `VARCHAR`, `TEXT` | texto | `'Ana Souza'` |
| `BOOLEAN` | `true` / `false` | `true` |
| `TIMESTAMP` | objeto `Date` (no JSON vira texto em UTC) | `"2026-11-20T17:00:00.000Z"` |
| `NUMERIC` | **texto**, para não perder casas decimais | `'35.50'` (use `Number(...)` para fazer contas) |
| `BIGINT`, e o resultado de `COUNT(*)` | **texto** | `'3'` |
| `NULL` | `null` | `null` |

### INSERT com RETURNING

O `RETURNING` (`01_postgresql.md`, seção INSERT) devolve o `id` gerado na própria consulta:

```js
const resultado = await sql.query(
    'INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES ($1, $2, $3) RETURNING id',
    [body.nome, body.cpf, body.barbeiro_id]
)
const novoId = resultado.rows[0].id
reply.status(201).send({ message: 'Cliente cadastrado!', id: novoId })
```

### Erros do banco (try/catch)

Quando o Postgres recusa um comando, o `sql.query` lança um erro, e sem tratamento a API responde 500. O erro tem um `code` padronizado pelo Postgres (SQLSTATE) que identifica o motivo:

| `erro.code` | Significado |
|---|---|
| `'23503'` | chave estrangeira: o id informado não existe na outra tabela |
| `'23505'` | valor repetido em coluna `UNIQUE` ou `PRIMARY KEY` |
| `'23502'` | coluna `NOT NULL` sem valor |
| `'22P02'` | texto onde se espera número (ex.: id `'abc'`) |

```js
try {
    await sql.query(
        'INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES ($1, $2, $3)',
        [body.nome, body.cpf, body.barbeiro_id]
    )
} catch (erro) {
    if (erro.code === '23503') {
        return reply.status(400).send({ message: 'Barbeiro informado não existe!' })
    }
    return reply.status(500).send({ message: 'Erro ao cadastrar.' })
}
```

As rotas deste documento usam o outro caminho, também válido: um `SELECT` antes do `INSERT` confere se o registro existe.

## Endpoints

A API responde sempre em JSON, no endereço `http://localhost:6767`. Os endpoints estão agrupados por recurso (uma tabela do banco); cada recurso tem as operações de listar (`GET`), cadastrar (`POST`), alterar (`PUT`) e excluir (`DELETE`). Cada endpoint mostra o código da rota e, no fim, a referência com o que ele recebe e o que devolve.

Convenção dos caminhos: o recurso no plural (`/barbeiros`) é a coleção; com o id no fim (`/barbeiros/2`) é um registro só. A tabela no SQL continua no singular (`barbeiro`).

## Autenticação

Recurso que confere as credenciais do barbeiro (o usuário do sistema).

### POST /login

O login recebe cpf e senha no corpo e procura um barbeiro com os dois valores (`AND`). Encontrar uma linha significa credenciais certas.

- 400 quando faltar CPF ou senha (`!body.cpf` é verdadeiro quando o campo não veio ou veio vazio).
- 401 quando o SELECT não encontra nenhuma linha.
- A resposta leva só `id` e `nome`: a senha nunca sai da API.

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

`resultado.rows[0]` é a primeira (e única) linha encontrada. Resposta: `{ "message": "Login realizado!", "usuario": { "id": 1, "nome": "Carlos Silva" } }`

**Referência do endpoint**

| Item | Valor |
|---|---|
| Método e caminho | `POST /login` |
| Cabeçalho | `Content-Type: application/json` |
| Corpo | `{ "cpf": "111.222.333-44", "senha": "senha123" }` |
| 200 | `{ message, usuario: { id, nome } }` |
| 400 | CPF ou senha não enviados |
| 401 | nenhum barbeiro com esse CPF e essa senha |

## Barbeiros

Recurso da tabela `barbeiro`. Campos: `id`, `nome`, `cpf`, `senha`; nas listagens, a senha nunca sai da API.

### GET /barbeiros

A mesma rota lista tudo ou filtra, conforme a URL tenha ou não o `?busca=`.

- `if (busca)` é verdadeiro quando veio um termo (texto vazio e `undefined` contam como falso).
- O termo entra no `ILIKE` com `%` dos dois lados ("contém"). Os `%` ficam no **valor** (`` `%${busca}%` ``), não no texto do SQL.
- `` `...${variavel}...` `` (crase) monta um texto com o valor da variável dentro.
- O SELECT lista as colunas uma a uma para a senha não sair da API.

```js
// GET /barbeiros              -> lista todos
// GET /barbeiros?busca=ana    -> lista só os que contêm "ana" no nome
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

Busca em mais de uma coluna com o mesmo termo: o mesmo `$1` pode aparecer duas vezes.

```js
sql.query('SELECT * FROM cliente WHERE nome ILIKE $1 OR cpf ILIKE $1', [`%${busca}%`])
```

**Referência do endpoint**

| Item | Valor |
|---|---|
| Método e caminho | `GET /barbeiros` ou `GET /barbeiros?busca=texto` |
| Query | `busca` (opcional): pedaço do nome; sem ela, lista todos |
| 200 | array de barbeiros, cada um com `id`, `nome`, `cpf`, ordenados pelo id |

Busca sem resultado responde **200 com a lista vazia** (`[]`), não 404: a lista existe, só não tem itens. O 404 fica para quando se pede um registro específico (`/barbeiros/99`) que não existe.

### POST /barbeiros

Os campos chegam em `request.body` e entram no INSERT, cada um no seu `$n`. O status 201 indica que algo foi criado.

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

**Referência do endpoint**

| Item | Valor |
|---|---|
| Método e caminho | `POST /barbeiros` |
| Cabeçalho | `Content-Type: application/json` |
| Corpo | `{ "nome": "...", "cpf": "...", "senha": "..." }` |
| 201 | `{ message }` |
| 500 | um campo obrigatório não veio (`null value in column ... violates not-null constraint`) |

#### Validando os campos obrigatórios

Sem validação, um campo que não veio chega ao `INSERT` como `undefined`, o banco recusa (`NOT NULL`) e a API responde 500. Conferir antes e responder 400 deixa claro para quem chamou o que faltou, como no login:

```js
if (!body.nome || !body.cpf || !body.senha) {
    return reply.status(400).send({ message: 'Preencha nome, CPF e senha!' })
}
```

A validação fica no começo da rota, antes de qualquer `sql.query`.

### PUT /barbeiros/:id

O `id` de quem será alterado vem na URL (`:id` → `request.params.id`) e os dados novos vêm no corpo. Um SELECT confere se o id existe (404 quando não existe) e o UPDATE grava. O `WHERE id = $1` garante que só essa linha muda.

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

**Referência do endpoint**

| Item | Valor |
|---|---|
| Método e caminho | `PUT /barbeiros/:id` |
| Parâmetro | `id` do barbeiro, na URL |
| Corpo | `{ "nome": "...", "cpf": "..." }` |
| 200 | `{ message }` |
| 404 | nenhum barbeiro com esse id |

No PUT o corpo leva **todos** os campos editáveis: um campo que não vier entra como `undefined` no `UPDATE`. Para mudar só parte do registro, o HTTP tem o método `PATCH`.

### DELETE /barbeiros/:id

O id vem na URL; DELETE não tem corpo.

```js
servidor.delete('/barbeiros/:id', async (request, reply) => {
    const id = request.params.id
    await sql.query('DELETE FROM barbeiro WHERE id = $1', [id])
    reply.status(200).send({ message: 'Barbeiro deletado!' })
})
```

Com `ON DELETE CASCADE`, os clientes e agendamentos do barbeiro também são apagados.

**Referência do endpoint**

| Item | Valor |
|---|---|
| Método e caminho | `DELETE /barbeiros/:id` |
| Corpo | nenhum (e sem `Content-Type`) |
| 200 | `{ message }` |

Como está, a rota responde 200 mesmo para um id que não existe (o `DELETE` só não apaga nada). Com o `rowCount`, ela passa a responder 404 nesse caso:

```js
const resultado = await sql.query('DELETE FROM barbeiro WHERE id = $1', [id])
if (resultado.rowCount === 0) {
    return reply.status(404).send({ message: 'Barbeiro não existe!' })
}
```

## Clientes

Recurso da tabela `cliente`. Campos: `id`, `nome`, `cpf`, `barbeiro_id` (chave estrangeira para `barbeiro`).

### GET /clientes

O SQL do JOIN (ver `01_postgresql.md`) entra inteiro no `sql.query`. Entre crases, o texto pode ocupar várias linhas.

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

Cada objeto da lista tem as colunas do cliente e o `barbeiro_nome` (o nome do apelido `AS`).

**Referência do endpoint**

| Item | Valor |
|---|---|
| Método e caminho | `GET /clientes` |
| 200 | array de clientes: `id`, `nome`, `cpf`, `barbeiro_id` e `barbeiro_nome` |

O `barbeiro_id` continua no resultado (vem do `cliente.*`): a tela usa o nome para mostrar e o id quando precisa editar.

### POST /clientes

Antes de gravar, um SELECT confere se o registro referenciado existe. `rows.length === 0` significa que não existe: a rota responde 400 e para. Sem essa conferência, o banco recusa o INSERT (chave estrangeira) e a API responde 500.

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

**Referência do endpoint**

| Item | Valor |
|---|---|
| Método e caminho | `POST /clientes` |
| Corpo | `{ "nome": "...", "cpf": "...", "barbeiro_id": 1 }` |
| 201 | `{ message }` |
| 400 | o `barbeiro_id` não existe |

O `barbeiro_id` pode chegar como número (`1`, do REST Client) ou como texto (`"1"`, do `value` de um `<select>`): o Postgres aceita os dois numa coluna `INT`.

### PUT /clientes/:id

PUT de uma tabela com chave estrangeira junta as duas conferências: o registro editado existe (404) e o registro referenciado existe (400).

```js
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
```

**Referência do endpoint**

| Item | Valor |
|---|---|
| Método e caminho | `PUT /clientes/:id` |
| Corpo | `{ "nome": "...", "cpf": "...", "barbeiro_id": 2 }` |
| 200 | `{ message }` |
| 404 | nenhum cliente com esse id |
| 400 | o `barbeiro_id` novo não existe |

### DELETE /clientes/:id

O id vem na URL; não há corpo. Esta versão já usa o `rowCount` para responder 404 quando o id não existe.

```js
servidor.delete('/clientes/:id', async (request, reply) => {
    const id = request.params.id

    const resultado = await sql.query('DELETE FROM cliente WHERE id = $1', [id])
    if (resultado.rowCount === 0) {
        return reply.status(404).send({ message: 'Cliente não existe!' })
    }

    reply.status(200).send({ message: 'Cliente deletado!' })
})
```

Com `ON DELETE CASCADE` na tabela `agendamento`, os agendamentos do cliente são apagados junto.

**Referência do endpoint**

| Item | Valor |
|---|---|
| Método e caminho | `DELETE /clientes/:id` |
| Corpo | nenhum (e sem `Content-Type`) |
| 200 | `{ message }` |
| 404 | nenhum cliente com esse id |

## Agendamentos

Recurso da tabela `agendamento`. Campos: `id`, `data_hora`, `barbeiro_id` e `cliente_id` (chaves estrangeiras para `barbeiro` e `cliente`).

### GET /agendamentos

Listagem com todos os dados do barbeiro e do cliente de cada agendamento. Os apelidos (`barbeiro_nome`, `cliente_cpf`...) viram os nomes dos campos no JSON.

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

Ordenação só pelo dia, pelo mês ou pelo ano: troca-se a linha do `ORDER BY` pelas formas da tabela de ordenação do `01_postgresql.md`, por exemplo `ORDER BY EXTRACT(MONTH FROM agendamento.data_hora), agendamento.data_hora`.

> **Fuso horário.** A coluna `TIMESTAMP` não guarda fuso. A biblioteca `pg` lê a data como horário local e o JSON a envia em UTC: `20/11/2026 14:00` no banco chega como `"data_hora": "2026-11-20T17:00:00.000Z"` (3 horas a mais, com `Z` no fim). O valor no banco está certo; muda só a exibição. O `TO_CHAR` do SELECT entrega a `data_formatada` (`"20/11/2026 14:00"`) já no horário de Brasília. No JavaScript, `new Date(data_hora).toLocaleString('pt-BR')` faz a mesma conversão.

**Referência do endpoint**

| Item | Valor |
|---|---|
| Método e caminho | `GET /agendamentos` |
| 200 | array ordenado pela data (mais antiga primeiro), cada item com `id`, `data_hora`, `data_formatada`, `barbeiro_id`, `barbeiro_nome`, `barbeiro_cpf`, `cliente_id`, `cliente_nome`, `cliente_cpf` |

### POST /agendamentos

Com duas chaves estrangeiras, as duas são conferidas. `||` (ou) junta as condições: basta uma faltar para responder 400.

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

**Referência do endpoint**

| Item | Valor |
|---|---|
| Método e caminho | `POST /agendamentos` |
| Corpo | `{ "data_hora": "2026-12-20T14:30", "barbeiro_id": 1, "cliente_id": 2 }` |
| 201 | `{ message }` |
| 400 | o `barbeiro_id` ou o `cliente_id` não existe |

### PUT /agendamentos/:id

Quando só um campo muda, o próprio UPDATE informa se o id existia: `rowCount` é a quantidade de linhas alteradas. Zero significa que nenhuma linha tinha aquele id.

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

**Referência do endpoint**

| Item | Valor |
|---|---|
| Método e caminho | `PUT /agendamentos/:id` |
| Corpo | `{ "data_hora": "2026-12-20T09:00" }` |
| 200 | `{ message }` |
| 404 | nenhum agendamento com esse id (`rowCount` 0) |

### DELETE /agendamentos/:id

O id vem na URL; não há corpo. Esta versão já usa o `rowCount` para responder 404 quando o id não existe.

```js
servidor.delete('/agendamentos/:id', async (request, reply) => {
    const id = request.params.id

    const resultado = await sql.query('DELETE FROM agendamento WHERE id = $1', [id])
    if (resultado.rowCount === 0) {
        return reply.status(404).send({ message: 'Agendamento não existe!' })
    }

    reply.status(200).send({ message: 'Agendamento deletado!' })
})
```

Nenhuma tabela aponta para `agendamento`: apagar um agendamento não afeta barbeiros nem clientes.

**Referência do endpoint**

| Item | Valor |
|---|---|
| Método e caminho | `DELETE /agendamentos/:id` |
| Corpo | nenhum (e sem `Content-Type`) |
| 200 | `{ message }` |
| 404 | nenhum agendamento com esse id |

## Erros comuns

| Sintoma | Causa |
|---|---|
| `Method 'GET' already declared for route '/x'` | a mesma rota foi escrita duas vezes |
| `EADDRINUSE` | já tem uma API rodando na porta; feche o outro terminal |
| `password authentication failed` | usuário ou senha do Postgres errados no `Pool` |
| `connect ECONNREFUSED 127.0.0.1:5432` | porta do `Pool` diferente da porta do Postgres |
| `database "x" does not exist` | nome do banco errado no `Pool` |
| `x is not defined` | variável ou função usada antes de ser criada, ou nome escrito diferente |
| 404 `Route GET:/x not found` | caminho ou método diferente do definido na rota |
| 500 | erro no SQL; a mensagem aparece no terminal do `npm start` |
| `request.body` é `undefined` | faltou `Content-Type: application/json` na requisição |
| `Body cannot be empty when content-type is set to 'application/json'` | requisição sem corpo (GET, DELETE) enviada com `Content-Type: application/json` |
| `Body is not valid JSON but content-type is set to 'application/json'` | JSON mal escrito no corpo (aspas simples, vírgula sobrando) |
| `Reply was already sent` | duas respostas na mesma rota: faltou `return` antes de um `reply` |
| 500 `invalid input syntax for type integer` | id que não é número na URL (`/barbeiros/abc`) |
| login sempre 401 com dados certos | CPF digitado diferente do INSERT (pontos e traço) |
