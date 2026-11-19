# VS Code, REST Client, Markdown PDF e Live Server

Referências:
- VS Code: https://code.visualstudio.com/docs
- REST Client: https://marketplace.visualstudio.com/items?itemName=humao.rest-client
- Markdown PDF: https://marketplace.visualstudio.com/items?itemName=yzane.markdown-pdf
- Live Server: https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer

## VS Code

| Atalho | Ação |
|---|---|
| Ctrl + ' | abre o terminal integrado |
| Ctrl + C (no terminal) | para a API |
| Ctrl + P | abre arquivo pelo nome |
| Ctrl + F / Ctrl + H | procura / substitui no arquivo aberto |
| Ctrl + Shift + F | procura em todos os arquivos |
| Ctrl + D | seleciona a próxima ocorrência do texto selecionado (ver abaixo) |
| Ctrl + / | comenta ou descomenta a linha |
| Alt + ↑ / Alt + ↓ | move a linha para cima / para baixo |
| Shift + Alt + ↓ | duplica a linha |
| Shift + Alt + F | formata (organiza a indentação) o arquivo aberto |
| Ctrl + Espaço | mostra sugestões de código |
| F2 | renomeia uma variável ou função em todos os lugares em que ela aparece |
| Ctrl + S | salva; com `npm start` (`node --watch`) a API reinicia sozinha |
| Ctrl + Shift + V | visualização de um arquivo `.md` |

### Ctrl + D (várias seleções)

Com uma palavra selecionada (ou com o cursor em cima dela), cada Ctrl + D seleciona a **próxima** vez em que a mesma palavra aparece no arquivo. Cada seleção ganha um cursor próprio: o que for digitado substitui todas as seleções ao mesmo tempo.

Exemplo: cursor em `barbeiro` + Ctrl + D cinco vezes = as seis primeiras ocorrências de `barbeiro` selecionadas; digitar `cliente` troca as seis de uma vez.

| Combinação | Efeito |
|---|---|
| Ctrl + D | acrescenta a próxima ocorrência |
| Ctrl + K, depois Ctrl + D | pula a ocorrência atual e vai para a próxima |
| Ctrl + U | desfaz a última seleção acrescentada |
| Ctrl + Shift + L | seleciona todas as ocorrências do arquivo de uma vez |
| Esc | volta para um cursor só |

Diferente do Ctrl + H (substituir), o Ctrl + D mostra cada ocorrência antes de trocar, e dá para pular as que não devem mudar.

## Markdown PDF (documentacao.pdf)

O `documentacao.md` da raiz do projeto tem os campos do Anexo 1. Exportação: botão direito dentro do texto > **Markdown PDF: Export (pdf)**. O `documentacao.pdf` é criado na mesma pasta.

## Live Server

Abre as páginas HTML no navegador e recarrega a cada arquivo salvo: botão direito no `index.html` > **Open with Live Server**.

## REST Client

Extensão que envia requisições HTTP escritas em arquivos `.http` (no projeto: `referencias.http`). Serve para testar a API sem tela. A API precisa estar rodando (`npm start`).

### Estrutura de uma requisição

```http
### Título da requisição (opcional)
MÉTODO URL
Cabeçalho: valor

corpo (JSON)
```

| Parte | Regra |
|---|---|
| `###` | separa uma requisição da outra; o texto depois dele é só um título |
| primeira linha | método e URL completa |
| cabeçalhos | logo abaixo da URL, um por linha |
| linha em branco | obrigatória entre os cabeçalhos e o corpo |
| corpo | JSON, só em POST e PUT |

O link **Send Request** aparece acima de cada requisição. A resposta abre em uma aba ao lado: na primeira linha o código HTTP (`HTTP/1.1 200 OK`), depois os cabeçalhos e o corpo.

### Endereço da API

Toda requisição leva a URL completa: protocolo, endereço, porta e caminho.

| Protocolo | Endereço | Porta | Caminho |
|---|---|---|---|
| `http://` | `localhost` | `:6767` | `/barbeiros` |

- `localhost` é o próprio computador; `6767` é a porta do `listen` no `server.js`.
- O caminho é o mesmo da rota (`servidor.get('/barbeiros', ...)` → `/barbeiros`), com a mesma escrita: `/Barbeiros` ou `/barbeiro` dão 404.
- Parâmetro de rota (`:id`) é trocado pelo valor: `/barbeiros/:id` → `http://localhost:6767/barbeiros/2`.

### Linha da requisição

A forma completa da primeira linha tem também a versão do HTTP, que é opcional. Sem o método, o REST Client usa GET:

```http
GET http://localhost:6767/barbeiros HTTP/1.1
```

Uma query longa pode ser quebrada em várias linhas, cada parâmetro começando com `?` ou `&`:

```http
GET http://localhost:6767/barbeiros
    ?busca=ana
```

### Comentários

Linhas que começam com `#` ou `//` são comentários e não são enviadas. O `###` é o separador de requisições, não um comentário.

```http
### Cadastrar barbeiro
# cadastra um barbeiro novo (comentário: não é enviado)
POST http://localhost:6767/barbeiros
```

### GET (consultar)

Só método e URL. Sem cabeçalho e sem corpo.

```http
### Listar agendamentos
GET http://localhost:6767/agendamentos
```

Parâmetros de busca vão na própria URL, depois do `?` (`request.query` na API):

```http
### Buscar barbeiros com "ana" no nome
GET http://localhost:6767/barbeiros?busca=ana
```

### POST (cadastrar)

Leva o cabeçalho `Content-Type: application/json`, uma linha em branco e o corpo. Os nomes das chaves do JSON são os que a API lê em `request.body`.

```http
### Cadastrar barbeiro
POST http://localhost:6767/barbeiros
Content-Type: application/json

{
    "nome": "Thiago Pente",
    "cpf": "777.888.999-00",
    "senha": "senha000"
}
```

Chave estrangeira vai como número, com o id de um registro existente:

```http
### Cadastrar cliente do barbeiro 1
POST http://localhost:6767/clientes
Content-Type: application/json

{
    "nome": "Lucas Ferreira",
    "cpf": "888.999.000-11",
    "barbeiro_id": 1
}
```

O login também é um POST, com cpf e senha no corpo. A resposta traz o `token`.

### Token (rotas protegidas)

As rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`. O token vem na resposta do login. Como ele é um texto muito longo, é guardado uma vez numa **variável** do arquivo e usado nas requisições seguintes: `@token = valor` (sem aspas) define a variável e `{{token}}` é trocado pelo valor na hora do envio. É a única variável do arquivo; o endereço da API continua escrito por extenso em cada requisição. Quando o token expira, as rotas respondem 401 e é preciso fazer login de novo.

```http
@token = cole-aqui-o-token-do-login

### Listar barbeiros (com token)
GET http://localhost:6767/barbeiros
Authorization: Bearer {{token}}
```

Em requisições com corpo, o `Authorization` fica junto dos outros cabeçalhos, antes da linha em branco:

```http
### Cadastrar cliente do barbeiro 1 (com token)
POST http://localhost:6767/clientes
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "nome": "Lucas Ferreira",
    "cpf": "888.999.000-11",
    "barbeiro_id": 1
}
```

Os exemplos de GET, POST, PUT e DELETE desta página mostram a estrutura de cada método; nas rotas protegidas, todos levam também a linha `Authorization`.

A linha `@token = ...` fica no começo do arquivo, fora de qualquer requisição. Depois de um novo login, troca-se só o valor dela.

### PUT (editar)

O id de quem será alterado vai no fim da URL (`request.params.id` na API); os dados novos, no corpo.

```http
### Atualizar a data do agendamento 1
PUT http://localhost:6767/agendamentos/1
Content-Type: application/json

{
    "data_hora": "2026-12-01T09:00"
}
```

### DELETE (excluir)

O id vai no fim da URL. Sem cabeçalho e sem corpo.

```http
### Excluir barbeiro 3
DELETE http://localhost:6767/barbeiros/3
```

### Todos os endpoints

Uma requisição para cada endpoint documentado em `02_node_fastify.md`, na mesma ordem e agrupadas pelo mesmo recurso. Os ids usados (1, 2, 3) são os dos registros do `saep_db.sql`; um DELETE executado apaga o registro, então rode-o por último ou troque o id. Todas, menos o login, levam a linha `Authorization` com o `{{token}}` do login.

#### Autenticação

```http
@token = cole-aqui-o-token-do-login

### Login
POST http://localhost:6767/login
Content-Type: application/json

{
    "cpf": "111.222.333-44",
    "senha": "senha123"
}
```

#### Barbeiros

```http
### Listar barbeiros
GET http://localhost:6767/barbeiros
Authorization: Bearer {{token}}

### Buscar barbeiros com "ana" no nome
GET http://localhost:6767/barbeiros?busca=ana
Authorization: Bearer {{token}}

### Cadastrar barbeiro
POST http://localhost:6767/barbeiros
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "nome": "Thiago Pente",
    "cpf": "777.888.999-00",
    "senha": "senha000"
}

### Editar o barbeiro 1
PUT http://localhost:6767/barbeiros/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "nome": "Carlos Silva Souza",
    "cpf": "111.222.333-44",
    "senha": "senha123"
}

### Excluir o barbeiro 3 (apaga junto os clientes e agendamentos dele)
DELETE http://localhost:6767/barbeiros/3
Authorization: Bearer {{token}}
```

#### Clientes

```http
### Listar clientes (com o nome do barbeiro)
GET http://localhost:6767/clientes
Authorization: Bearer {{token}}

### Cadastrar cliente do barbeiro 1
POST http://localhost:6767/clientes
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "nome": "Lucas Ferreira",
    "cpf": "888.999.000-11",
    "barbeiro_id": 1
}

### Editar o cliente 1 (passa para o barbeiro 2)
PUT http://localhost:6767/clientes/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "nome": "Pedro Santos",
    "cpf": "444.555.666-77",
    "barbeiro_id": 2
}

### Excluir o cliente 3
DELETE http://localhost:6767/clientes/3
Authorization: Bearer {{token}}
```

#### Agendamentos

```http
### Listar agendamentos (ordenados por data)
GET http://localhost:6767/agendamentos
Authorization: Bearer {{token}}

### Cadastrar agendamento
POST http://localhost:6767/agendamentos
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "data_hora": "2026-12-20T14:30",
    "barbeiro_id": 1,
    "cliente_id": 2
}

### Atualizar a data do agendamento 1
PUT http://localhost:6767/agendamentos/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "data_hora": "2026-12-01T09:00"
}

### Excluir o agendamento 3
DELETE http://localhost:6767/agendamentos/3
Authorization: Bearer {{token}}
```

#### Casos de erro de cada recurso

```http
### Barbeiro que não existe (esperado: 404)
PUT http://localhost:6767/barbeiros/99
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "nome": "Carlos Silva Souza",
    "cpf": "111.222.333-44",
    "senha": "senha123"
}

### Cliente com barbeiro que não existe (esperado: 400)
POST http://localhost:6767/clientes
Authorization: Bearer {{token}}
Content-Type: application/json

{
    "nome": "Teste",
    "cpf": "000.000.000-00",
    "barbeiro_id": 99
}

### Agendamento que não existe (esperado: 404)
DELETE http://localhost:6767/agendamentos/99
Authorization: Bearer {{token}}

### Rota protegida sem token (esperado: 401)
GET http://localhost:6767/barbeiros
```

### Atalhos do REST Client

| Atalho | Ação |
|---|---|
| Ctrl + Alt + R | envia a requisição em que está o cursor (o mesmo que clicar em Send Request) |
| Ctrl + Alt + L | envia de novo a última requisição |
| Ctrl + Alt + K | cancela a requisição em andamento |
| Ctrl + Alt + H | histórico das requisições enviadas |

### A aba de resposta

| Parte | O que mostra |
|---|---|
| `HTTP/1.1 201 Created` | código de status e o nome dele |
| `content-type: application/json; charset=utf-8` | o formato do corpo da resposta |
| `content-length` | tamanho do corpo |
| corpo | o JSON devolvido pela API, já formatado |

O ícone de salvar, no canto da aba de resposta, grava a resposta inteira ou só o corpo em um arquivo.

### Corpo vindo de um arquivo

Em vez de escrever o JSON, o corpo pode ser lido de um arquivo com `<` e o caminho:

```http
POST http://localhost:6767/barbeiros
Content-Type: application/json

< ./barbeiro_novo.json
```

### Testando os casos de erro

Requisições com dados errados confirmam as validações da API: login com senha errada (401), rota protegida sem token (401), cadastro com `barbeiro_id` que não existe (400), PUT em um id que não existe (404).

```http
### Login com senha errada (esperado: 401)
POST http://localhost:6767/login
Content-Type: application/json

{
    "cpf": "111.222.333-44",
    "senha": "errada"
}
```

> **Fuso horário.** No GET de agendamentos, o campo `data_hora` aparece em UTC, com 3 horas a mais e `Z` no fim (`"2026-12-01T12:00:00.000Z"` para uma data gravada como 09:00). O horário de Brasília está na `data_formatada` (`"01/12/2026 09:00"`). Detalhes em `02_node_fastify.md`, endpoint GET /agendamentos.

| Problema | Causa |
|---|---|
| não aparece o Send Request | falta o `###` antes da requisição, ou o arquivo não termina em `.http` |
| `Connection is being rejected` | a API não está rodando |
| `request.body` vazio na API | falta a linha em branco antes do corpo, ou o `Content-Type` |
| 400 `Body is not valid JSON` | JSON inválido: aspas simples, vírgula sobrando ou faltando |
| 404 `Route GET:/x not found` | caminho escrito diferente da rota, ou método errado (ex.: GET numa rota que só tem POST) |
| 400 `Body cannot be empty...` | `Content-Type: application/json` numa requisição sem corpo (GET ou DELETE) |
| a resposta demora e não chega | a API travou num erro; olhe o terminal do `npm start` |
