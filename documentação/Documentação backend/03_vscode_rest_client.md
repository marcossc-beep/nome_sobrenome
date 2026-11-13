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

### Variáveis

`@nome = valor` define uma variável no arquivo; `{{nome}}` usa o valor. Evita repetir o endereço da API em todas as requisições.

```http
@base = http://localhost:6767

### Listar barbeiros
GET {{base}}/barbeiros
```

### GET (consultar)

Só método e URL. Sem cabeçalho e sem corpo.

```http
### Listar agendamentos
GET {{base}}/agendamentos
```

Parâmetros de busca vão na própria URL, depois do `?` (`request.query` na API):

```http
### Buscar barbeiros com "ana" no nome
GET {{base}}/barbeiros?busca=ana
```

### POST (cadastrar)

Leva o cabeçalho `Content-Type: application/json`, uma linha em branco e o corpo. Os nomes das chaves do JSON são os que a API lê em `request.body`.

```http
### Cadastrar barbeiro
POST {{base}}/barbeiros
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
POST {{base}}/clientes
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
PUT {{base}}/agendamentos/1
Content-Type: application/json

{
    "data_hora": "2026-12-01T09:00"
}
```

### DELETE (excluir)

O id vai no fim da URL. Sem cabeçalho e sem corpo.

```http
### Excluir barbeiro 3
DELETE {{base}}/barbeiros/3
```

### Testando os casos de erro

Requisições com dados errados confirmam as validações da API: login com senha errada (401), cadastro com `barbeiro_id` que não existe (400), PUT em um id que não existe (404).

```http
### Login com senha errada (esperado: 401)
POST {{base}}/login
Content-Type: application/json

{
    "cpf": "111.222.333-44",
    "senha": "errada"
}
```

> **Fuso horário.** No GET de agendamentos, o campo `data_hora` aparece em UTC, com 3 horas a mais e `Z` no fim (`"2026-12-01T12:00:00.000Z"` para uma data gravada como 09:00). O horário de Brasília está na `data_formatada` (`"01/12/2026 09:00"`). Detalhes em `02_node_fastify.md`, seção GET com JOIN de três tabelas.

| Problema | Causa |
|---|---|
| não aparece o Send Request | falta o `###` antes da requisição, ou o arquivo não termina em `.http` |
| `Connection is being rejected` | a API não está rodando |
| `request.body` vazio na API | falta a linha em branco antes do corpo, ou o `Content-Type` |
| 400 `Body is not valid JSON` | JSON inválido: aspas simples, vírgula sobrando ou faltando |
