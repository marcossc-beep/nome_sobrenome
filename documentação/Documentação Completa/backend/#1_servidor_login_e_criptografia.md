# Servidor, criptografia (bcrypt), login e sessão (JWT)

```js
//
// Este arquivo monta o começo do server.js: o projeto, a conexão com o banco, o login e as rotas de barbeiro.
// Os próximos arquivos (#2 e #3) só acrescentam rotas. No fim do #3 está o server.js completo.
//
// ATENÇÃO: cada combinação de método + endpoint só pode existir UMA vez no server.js.
// Dois servidor.get('/barbeiros', ...) fazem a API parar com o erro:
//     Method 'GET' already declared for route '/barbeiros'
```

## Rodando a API

```js
// No terminal do VS Code, na pasta do projeto:  npm start
// A API reinicia sozinha sempre que você salva o server.js.
```

## O problema que a criptografia resolve

```js
Se a senha e o CPF ficam escritos em texto puro no banco, qualquer pessoa que acessar o banco lê tudo.
A LGPD diz que dados pessoais precisam ficar protegidos.
Usamos duas ferramentas, as duas na API (o banco só guarda o resultado):
- bcrypt: transforma a senha e o CPF em um "embaralhado" que não volta mais (hash).
- JWT: um "crachá" digital que o servidor entrega no login e que tem prazo de validade.
```

## bcrypt: o que é hash

```js
- Criptografia comum: vai e volta (criptografa e descriptografa com uma chave).
- Hash (bcrypt): só vai. Depois que vira hash NÃO existe como voltar ao texto original.
- Salt: texto aleatório misturado antes do hash. Duas pessoas com a senha "123" ficam com hashes diferentes.
- O número 10 em bcrypt.hash(texto, 10) é o custo (quantas rodadas). 10 é o padrão.

Como fica salvo no banco (60 caracteres, por isso as colunas cpf e senha são VARCHAR(255)):

    $2b$10$Q3x9...

Se o hash não volta, como o login confere a senha?
O bcrypt pega a senha digitada, aplica o mesmo processo e compara com o hash do banco:

    const senhaValida = await bcrypt.compare(body.senha, barbeiro.senha)   // true ou false

Consequência: o CPF salvo com hash NÃO pode ser mostrado de volta na tela.
Por isso as listagens de barbeiro não trazem as colunas cpf e senha.
Os 3 barbeiros do saep_db.sql já entram com hash (veja o passo 6 do #0_SQL.md).
```

## JWT: o crachá com validade

```js
Depois do login o servidor devolve um token. Em toda requisição seguinte o front mostra esse token.
Um token tem 3 partes separadas por ponto: cabeçalho . dados . assinatura
- dados (payload): o que guardamos dentro, como id e nome. NUNCA a senha.
- assinatura: garante que ninguém alterou o token.
- exp: o horário em que o token vence. É isso que dá expiração à sessão.

Aqui a chave secreta fica direto no código (não precisa de .env nem de variável de ambiente).
```

## Passo 1: imports, cors, JWT e conexão com o banco

```js
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import bcrypt from 'bcrypt'
import { Pool } from 'pg'

const servidor = Fastify()

// O cors libera o front (páginas da pasta FRONT) a chamar a API. PUT e DELETE precisam estar na lista.
servidor.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
})

servidor.register(jwt, {
    secret: 'saep_barbearia_2026',
    sign: { expiresIn: '30m' }
})

const sql = new Pool({
    user: 'postgres',      // usuário do Postgres da sua máquina
    password: 'senai',     // senha do Postgres da sua máquina
    host: 'localhost',
    port: 5432,
    database: 'saep_db'    // o banco criado no #0_SQL.md
})

// expiresIn: '30m' = o token vale 30 minutos. Depois disso a API responde 401.
// Para ver a expiração funcionando, troque para '1m', faça login, espere 1 minuto e chame uma rota protegida.
// sql.query('SQL com $1, $2...', [valor1, valor2]) roda o SQL no banco. Os $ evitam SQL injection.
```

## Passo 2: a função autenticar (porteiro das rotas)

```js
async function autenticar(request, reply) {
    try {
        await request.jwtVerify()
    } catch (erro) {
        return reply.status(401).send({ message: 'Sessão expirada ou inválida. Faça login novamente.' })
    }
}

// jwtVerify lê o header "Authorization: Bearer <token>", confere a assinatura e o prazo.
// Se estiver tudo certo, a rota continua. Se não, responde 401.
//
// Para proteger uma rota basta colocar { preHandler: autenticar } antes da função:
//
//     servidor.get('/barbeiros', { preHandler: autenticar }, async (request, reply) => { ... })
//
// Todas as rotas de barbeiro, cliente e agendamento levam o preHandler. A rota /login NÃO leva.
// A função autenticar precisa estar escrita ANTES das rotas que a usam.
```

## Passo 3: rota POST /login (cpf e senha)

```js
// Quem faz login é o BARBEIRO (cpf e senha da tabela barbeiro).
// Regras do login:
// - 400 quando faltar cpf ou senha.
// - 401 quando o CPF não existir OU a senha estiver errada, com a MESMA mensagem nos dois casos
//   (assim ninguém descobre quais CPFs existem no sistema).
// - Se estiver certo: gerar o token e devolver também o nome do barbeiro.
//
// ATENÇÃO: o CPF do barbeiro está criptografado. O bcrypt gera um hash diferente a cada vez,
// então NÃO dá para fazer WHERE cpf = '111.222.333-44'. O login lê os barbeiros e compara o CPF digitado
// com o hash de cada um usando bcrypt.compare, até achar o barbeiro certo.

servidor.post('/login', async (request, reply) => {
    const body = request.body

    if (!body || !body.cpf || !body.senha) {
        return reply.status(400).send({ message: 'CPF e senha são obrigatórios!' })
    }

    const resultado = await sql.query('SELECT * FROM barbeiro')

    // procura o barbeiro cujo CPF criptografado bate com o CPF digitado
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

    // exp vem em segundos dentro do token, o front usa em milissegundos
    const expira = servidor.jwt.decode(token).exp * 1000

    return reply.status(200).send({
        message: 'Login realizado com sucesso!',
        token: token,
        expira: expira,
        usuario: { id: barbeiro.id, nome: barbeiro.nome }
    })
})

// A resposta leva 3 coisas que o front guarda: token, expira (quando vence) e usuario (o barbeiro logado, com o nome).
// O nome "usuario" na resposta é só o nome da chave: quem está logado é o barbeiro.
```

## Passo 4: cadastrar, editar e excluir barbeiro (com bcrypt)

```js
// O POST e o PUT usam bcrypt.hash antes de gravar.
// No PUT, o CPF e a senha só são trocados se vierem preenchidos, porque na tela de edição
// o usuário não vê o valor antigo (ele está em hash).
// A listagem GET /barbeiros (com busca) está em #2_busca_e_JOIN.md.

servidor.post('/barbeiros', { preHandler: autenticar }, async (request, reply) => {
    const body = request.body

    // LGPD: CPF e senha são salvos criptografados (hash bcrypt)
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

    // CPF e senha só mudam se forem enviados (e continuam criptografados)
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
```

## Passo 5: listen (última coisa do server.js)

```js
// Fica SEMPRE no final do server.js. As rotas dos próximos arquivos entram ACIMA dele.

servidor.listen({ port: 6767 }).then(() => console.log('API da barbearia rodando em http://localhost:6767'))
```

## Testando no referencias.http

```http
@token = COLE_AQUI_O_TOKEN_DA_RESPOSTA_DO_LOGIN

### Login certo
POST http://localhost:6767/login
Content-Type: application/json

{
    "cpf": "111.222.333-44",
    "senha": "senha123"
}

### Login com senha errada (esperado: 401)
POST http://localhost:6767/login
Content-Type: application/json

{
    "cpf": "111.222.333-44",
    "senha": "errada"
}

### Login sem dados (esperado: 400)
POST http://localhost:6767/login
Content-Type: application/json

{}

### Cadastrar barbeiro SEM token (esperado: 401)
POST http://localhost:6767/barbeiros
Content-Type: application/json

{
    "nome": "Thiago Pente",
    "cpf": "777.888.999-00",
    "senha": "senha000"
}

### Cadastrar barbeiro COM token (confira no pgAdmin que cpf e senha ficaram em hash)
POST http://localhost:6767/barbeiros
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "nome": "Thiago Pente",
    "cpf": "777.888.999-00",
    "senha": "senha000"
}
```

## Erros comuns

```js
- "Illegal arguments: string, undefined" no bcrypt.compare: o body veio sem cpf ou sem senha, ou a coluna
  do barbeiro está vazia. Confira o JSON do .http e o SELECT no pgAdmin.
- Login sempre dá 401 mesmo com a senha certa: o CPF ou a senha do barbeiro no banco estão em texto puro.
  Rode o saep_db.sql do #0_SQL.md, que já traz os hashes. O CPF do login tem que ser digitado com pontos e traço.
- "autenticar is not defined": a função autenticar precisa estar escrita ANTES das rotas que a usam.
- 401 em tudo: faltou o header Authorization: Bearer <token> no .http, ou o token venceu. Faça login de novo.
- Method 'POST' already declared for route '/barbeiros': a rota foi escrita duas vezes. Apague uma.
- No .http, DELETE e GET não levam Content-Type nem body.
- O CPF do barbeiro não aparece na listagem: é de propósito, ele está em hash.
```
