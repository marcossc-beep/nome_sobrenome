# VS Code, REST Client e Markdown PDF

Referências:
- VS Code: https://code.visualstudio.com/docs
- REST Client: https://marketplace.visualstudio.com/items?itemName=humao.rest-client
- Markdown PDF: https://marketplace.visualstudio.com/items?itemName=yzane.markdown-pdf

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

O login também é um POST, com cpf e senha no corpo.

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

Uma requisição para cada endpoint documentado em `02_node_fastify.md`, na mesma ordem e com os mesmos recursos. Cada uma é escrita e enviada separadamente, conferindo a resposta antes de passar para a próxima: assim um erro aparece no endpoint em que ele está.

- Os ids usados (1, 2, 3) são os dos registros do `saep_db.sql`.
- O DELETE apaga o registro de verdade: rode por último ou use um id criado no POST.
- O título depois do `###` é livre; serve para achar a requisição no arquivo.

#### Autenticação

##### POST /login

Envia o CPF e a senha de um barbeiro do `saep_db.sql`. É um POST porque leva dados no corpo; o `Content-Type` avisa a API que o corpo é JSON.

```http
### Login
POST http://localhost:6767/login
Content-Type: application/json

{
    "cpf": "111.222.333-44",
    "senha": "senha123"
}
```

Resposta esperada: `200` com `message` e `usuario` (`id` e `nome`). Com a senha trocada: `401`. Sem o CPF: `400`.

#### Barbeiros

##### GET /barbeiros

Lista os barbeiros. GET não tem corpo nem `Content-Type`: só a linha do método e da URL.

```http
### Listar barbeiros
GET http://localhost:6767/barbeiros
```

Resposta esperada: `200` com um array de barbeiros, ordenados pelo id. Confira se aparecem os três do `saep_db.sql`.

##### GET /barbeiros?busca=

A mesma rota com a query `busca`: o texto depois do `?` chega na API em `request.query.busca`. Escreva a URL anterior e acrescente `?busca=` e um pedaço de um nome cadastrado.

```http
### Buscar barbeiros com "ana" no nome
GET http://localhost:6767/barbeiros?busca=ana
```

Resposta esperada: `200` só com os barbeiros que têm "ana" no nome (maiúscula ou minúscula). Um termo que ninguém tem devolve `[]`.

##### POST /barbeiros

Cadastra um barbeiro. Cabeçalho `Content-Type`, **linha em branco** e o corpo com as chaves que a rota lê em `request.body` (`nome`, `cpf`, `senha`).

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

Resposta esperada: `201` com a `message`. Envie o GET de novo: o barbeiro novo aparece com o próximo id.

##### PUT /barbeiros/:id

Altera um barbeiro. O id vai no fim da URL (troca o `:id` da rota pelo número) e o corpo leva os dados novos.

```http
### Editar o barbeiro 1
PUT http://localhost:6767/barbeiros/1
Content-Type: application/json

{
    "nome": "Carlos Silva Souza",
    "cpf": "111.222.333-44"
}
```

Resposta esperada: `200` com a `message`. Com um id que não existe (`/barbeiros/99`): `404`.

##### DELETE /barbeiros/:id

Exclui um barbeiro. Como o GET, não tem corpo nem `Content-Type`; o id vai na URL.

```http
### Excluir o barbeiro 3
DELETE http://localhost:6767/barbeiros/3
```

Resposta esperada: `200` com a `message`. Pelo `ON DELETE CASCADE`, os clientes e agendamentos do barbeiro 3 somem junto: confira com o GET de clientes e de agendamentos.

#### Clientes

##### GET /clientes

Lista os clientes. A rota faz um JOIN com `barbeiro`, então cada cliente vem com o nome do barbeiro dele.

```http
### Listar clientes
GET http://localhost:6767/clientes
```

Resposta esperada: `200` com um array; cada cliente tem `barbeiro_id` e `barbeiro_nome`.

##### POST /clientes

Cadastra um cliente. A chave estrangeira `barbeiro_id` vai como **número**, com o id de um barbeiro que existe.

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

Resposta esperada: `201`. Com `"barbeiro_id": 99` (barbeiro que não existe): `400`.

##### PUT /clientes/:id

Altera um cliente, inclusive o barbeiro dele. O corpo leva todos os campos editáveis.

```http
### Editar o cliente 1
PUT http://localhost:6767/clientes/1
Content-Type: application/json

{
    "nome": "Pedro Santos",
    "cpf": "444.555.666-77",
    "barbeiro_id": 2
}
```

Resposta esperada: `200`. No GET de clientes, o `barbeiro_nome` do cliente 1 muda. Id inexistente: `404`; `barbeiro_id` inexistente: `400`.

##### DELETE /clientes/:id

Exclui um cliente pelo id da URL.

```http
### Excluir o cliente 3
DELETE http://localhost:6767/clientes/3
```

Resposta esperada: `200`. Enviando de novo o mesmo DELETE: `404` (o cliente já não existe).

#### Agendamentos

##### GET /agendamentos

Lista os agendamentos com os dados do barbeiro e do cliente (JOIN de três tabelas), já ordenados pela data.

```http
### Listar agendamentos
GET http://localhost:6767/agendamentos
```

Resposta esperada: `200` com o array na ordem das datas, não dos ids. Veja a observação de fuso horário no fim desta página.

##### POST /agendamentos

Cadastra um agendamento. A data vai como texto no formato `AAAA-MM-DDTHH:MM`, sem fuso; os dois ids, como números.

```http
### Cadastrar agendamento
POST http://localhost:6767/agendamentos
Content-Type: application/json

{
    "data_hora": "2026-12-20T14:30",
    "barbeiro_id": 1,
    "cliente_id": 2
}
```

Resposta esperada: `201`. No GET, o novo agendamento entra na posição da data dele. Barbeiro ou cliente inexistente: `400`.

##### PUT /agendamentos/:id

Muda só a data de um agendamento: o corpo leva apenas `data_hora`.

```http
### Atualizar a data do agendamento 1
PUT http://localhost:6767/agendamentos/1
Content-Type: application/json

{
    "data_hora": "2026-12-01T09:00"
}
```

Resposta esperada: `200`. No GET, o agendamento 1 muda de posição. Id inexistente: `404`.

##### DELETE /agendamentos/:id

Exclui um agendamento. Nenhuma outra tabela aponta para ele, então só essa linha some.

```http
### Excluir o agendamento 3
DELETE http://localhost:6767/agendamentos/3
```

Resposta esperada: `200`; id inexistente: `404`.

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

Requisições com dados errados confirmam as validações da API: login com senha errada (401), cadastro com `barbeiro_id` que não existe (400), PUT em um id que não existe (404).

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
