# Front-end: HTML, JavaScript, fetch e localStorage

Referência: https://developer.mozilla.org/pt-BR/

Exemplos: telas da barbearia consumindo a API em `http://localhost:6767` (com CORS liberado e rotas protegidas por token).

## Páginas

| Página | Função |
|---|---|
| `index.html` | login |
| `principal.html` | nome do usuário logado, acesso às telas e sair |
| `barbeiros.html` | listar, buscar, cadastrar, editar e excluir |
| `clientes.html` | cadastrar cliente associado a um barbeiro |
| `agendamentos.html` | listar por data, cadastrar e atualizar a data |

Abertura: Live Server (`03_vscode_rest_client.md`).

## Elementos de formulário

```html
<input type="text" id="nome">
<input type="password" id="senha">
<input type="datetime-local" id="data_hora">   <!-- valor: '2026-12-20T14:30' -->

<select id="barbeiro_id">
    <option value="">selecione o barbeiro</option>
    <option value="1">Carlos Silva</option>   <!-- value = id enviado; texto = o que aparece -->
</select>

<button onclick="cadastrar()">cadastrar</button>
<a href="barbeiros.html">barbeiros</a>
<div id="lista"></div>
```

### Tipos de input

| `type` | O que o `.value` devolve |
|---|---|
| `text` | o texto digitado |
| `password` | o texto digitado (a tela mostra pontos) |
| `number` | o número **como texto** (`'3'`); use `Number(...)` para contas |
| `email` | o texto; o navegador confere o formato só dentro de um `<form>` |
| `date` | `'2026-12-20'` |
| `datetime-local` | `'2026-12-20T14:30'` (sem fuso: é o formato que a API grava) |

Todo `.value` é texto. Campo vazio devolve `''` (texto vazio), não `null`.

### select

O `.value` do `<select>` é o `value` da `<option>` escolhida (texto). O texto que aparece na tela é outra coisa: `<option value="1">Carlos Silva</option>` mostra "Carlos Silva" e devolve `'1'`.

## DOM

```js
document.getElementById('nome').value          // texto digitado
document.getElementById('nome').value = ''     // limpa o campo
lista.innerHTML = ''                           // apaga o conteúdo
lista.innerHTML += `<p>${barbeiro.nome}</p>`   // acrescenta HTML
```

| Comando | Efeito |
|---|---|
| `array.forEach((item, i) => { ... })` | repete para cada item; `i` é a posição |
| `` `texto ${variavel}` `` | texto com variáveis (entre crases) |
| `alert('mensagem')` | aviso |
| `prompt('pergunta', 'valor inicial')` | caixa de texto; devolve o que foi digitado |
| `confirm('Deseja excluir?')` | `true` ou `false` |
| `window.location.href = 'principal.html'` | muda de página |

### innerHTML e textContent

| Propriedade | Efeito |
|---|---|
| `elemento.innerHTML = '<b>Ana</b>'` | o texto é lido como HTML: aparece **Ana** em negrito |
| `elemento.textContent = '<b>Ana</b>'` | o texto aparece exatamente como está, com os sinais `<b>` |

`innerHTML` é o que permite montar a lista com botões. Para mostrar só um texto (uma mensagem, um nome), `textContent` é suficiente.

### Encontrando elementos

| Comando | Encontra |
|---|---|
| `document.getElementById('lista')` | o elemento com `id="lista"` (um só; o id não se repete na página) |
| `document.querySelector('#lista')` | o primeiro elemento que combina com o seletor CSS (`#id`, `.classe`, `tag`) |
| `document.querySelectorAll('button')` | todos os que combinam, numa lista |

`getElementById` devolve `null` quando o id não existe na página: o erro aparece depois, como `Cannot read properties of null (reading 'value')`.

### Eventos

`onclick="cadastrar()"` no HTML chama a função quando o botão é clicado. A função precisa existir no `<script>` da página com o mesmo nome. Outros eventos no mesmo formato: `onchange` (valor do campo ou do select mudou), `oninput` (a cada tecla), `onsubmit` (envio de formulário).

## fetch

```js
// GET com token
const resposta = await fetch('http://localhost:6767/barbeiros', {
    headers: { 'Authorization': 'Bearer ' + token }
})
const barbeiros = await resposta.json()

// POST / PUT com token e corpo JSON
const resposta = await fetch('http://localhost:6767/barbeiros', {
    method: 'POST',
    body: JSON.stringify(barbeiro),
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    }
})
const dados = await resposta.json()   // { message: '...' }
```

| Propriedade | Conteúdo |
|---|---|
| `resposta.ok` | `true` para status 200 a 299 |
| `resposta.status` | código HTTP (200, 401...) |
| `await resposta.json()` | corpo da resposta convertido em objeto |

`await` só funciona dentro de função `async`. `fetch` só lança erro em falha de rede: respostas 400, 401 e 500 chegam normalmente e são conferidas pelo `status`.

### Opções do fetch

`fetch(url, opções)` envia uma requisição e devolve uma *promise* com a resposta.

| Opção | Padrão | Uso |
|---|---|---|
| `method` | `'GET'` | `'POST'`, `'PUT'`, `'DELETE'` |
| `headers` | nenhum | objeto com os cabeçalhos: `Content-Type` quando há corpo, `Authorization` nas rotas protegidas |
| `body` | nenhum | **texto**: o objeto passa por `JSON.stringify` antes |

- GET e DELETE não levam `body` nem `Content-Type`. Um `Content-Type: application/json` sem corpo faz a API responder 400 (`Body cannot be empty...`).
- `body: barbeiro` (sem o `JSON.stringify`) envia o texto `[object Object]`, e a API recusa.

### Lendo a resposta

| Método | Devolve |
|---|---|
| `await resposta.json()` | o corpo convertido em objeto ou array |
| `await resposta.text()` | o corpo como texto puro |

O corpo só pode ser lido uma vez: chamar `.json()` duas vezes na mesma resposta dá erro (`body stream already read`). Guarde o resultado numa variável.

### async e await

- `async` antes de `function` permite usar `await` dentro dela. Uma função `async` sempre devolve uma *promise*.
- `await` espera a *promise* terminar e entrega o valor. Sem `await`, `fetch(...)` devolve a *promise* e não a resposta: `resposta.json is not a function`.

### Falha de rede (try/catch)

Se a API estiver desligada, o `fetch` lança um erro (`Failed to fetch`) e o resto da função não executa. O `try/catch` permite avisar o usuário:

```js
async function visualizar() {
    try {
        const resposta = await fetch('http://localhost:6767/barbeiros', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        const barbeiros = await resposta.json()
        // ... monta a lista
    } catch (erro) {
        alert('não foi possível falar com a API: ' + erro.message)
    }
}
```

### Conferindo o status

O `fetch` não lança erro em 400, 401, 404 ou 500: a resposta chega normalmente. Quem decide é o código:

```js
if (resposta.ok) {                    // 200 a 299
    alert(dados.message)
} else if (resposta.status === 401) { // token ausente ou vencido
    sair()
} else {
    alert(dados.message)              // 400, 404: a mensagem da API explica
}
```

### Texto da busca na URL

Um termo com espaço, acento ou `&` precisa ser codificado para ir na URL. `encodeURIComponent` faz isso (`'ana souza'` vira `'ana%20souza'`), e a API recebe o texto original em `request.query.busca`:

```js
const resposta = await fetch(`http://localhost:6767/barbeiros?busca=${encodeURIComponent(busca)}`, { ... })
```

## localStorage

Guarda texto no navegador, mesmo depois de recarregar a página.

| Comando | Efeito |
|---|---|
| `localStorage.setItem('chave', valor)` | guarda |
| `localStorage.getItem('chave')` | lê (`null` se não existe) |
| `localStorage.removeItem('chave')` | apaga |
| `JSON.stringify(objeto)` / `JSON.parse(texto)` | objeto → texto / texto → objeto |
| `Date.now()` | horário atual em milissegundos |

- Guarda só **texto**: um número volta como texto (`'1795000000000'`, por isso o `Number(...)` no `expira`) e um objeto precisa de `JSON.stringify` para entrar e de `JSON.parse` para sair.
- É separado por **origem** (protocolo + endereço + porta). `http://127.0.0.1:5500` e `http://localhost:5500` são origens diferentes: o que foi guardado em uma não aparece na outra. Abra as páginas sempre pelo mesmo endereço do Live Server.
- `sessionStorage` tem os mesmos comandos, mas apaga tudo ao fechar a aba.

## Sessão

O login guarda o `token`, o `usuario` e o `expira` (horário de expiração do token, vindo da API). As outras páginas conferem no começo do `<script>`:

```js
let usuario = JSON.parse(localStorage.getItem('usuario'))   // { id, nome } do login
let token = localStorage.getItem('token')                    // enviado no cabeçalho Authorization
let expira = Number(localStorage.getItem('expira'))          // milissegundos

if (token === null || Date.now() > expira) {   // sem login ou token vencido
    alert('sessão expirada, faça login novamente')
    sair()
}

function sair() {
    localStorage.removeItem('token')           // apaga a sessão
    localStorage.removeItem('usuario')
    localStorage.removeItem('expira')
    window.location.href = 'index.html'        // volta para o login
}
```

A conferência no front é para a **tela**: evita mostrar uma página que não vai conseguir carregar nada. Quem garante a segurança é a API, com o `jwtVerify` em cada rota: mesmo que alguém pule a conferência do front, a API responde 401 sem um token válido.

## index.html (login)

```html
<meta charset="UTF-8"> <!-- acentos corretos -->
<h1>LOGIN</h1>
<input type="text" placeholder="digite o cpf" id="cpf"> <!-- o id é usado no getElementById -->
<input type="password" placeholder="digite a senha" id="senha"> <!-- password esconde o texto -->
<button onclick="entrar()">entrar</button> <!-- onclick chama a função ao clicar -->
<p id="mensagem"></p> <!-- mensagem de falha no login -->
<script>
    async function entrar() {
        let cpf = document.getElementById('cpf').value       // .value lê o que foi digitado
        let senha = document.getElementById('senha').value

        if (cpf === '' || senha === '') {                    // validação no front: campos vazios
            document.getElementById('mensagem').innerHTML = 'preencha o cpf e a senha'
        } else {
            const resposta = await fetch('http://localhost:6767/login', {
                method: 'POST',
                body: JSON.stringify({ cpf, senha }),        // { cpf, senha } = { cpf: cpf, senha: senha }
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const dados = await resposta.json()              // { message, token, expira, usuario }

            if (resposta.status === 200) {
                localStorage.setItem('token', dados.token)
                localStorage.setItem('expira', dados.expira)
                localStorage.setItem('usuario', JSON.stringify(dados.usuario))   // objeto vira texto
                window.location.href = 'principal.html'      // redireciona
            } else {
                document.getElementById('mensagem').innerHTML = dados.message   // mensagem da API (401)
            }
        }
    }
</script>
```

## principal.html

```html
<meta charset="UTF-8">
<h1>PRINCIPAL</h1>
<p>usuário: <b id="nome"></b></p> <!-- recebe o nome do usuário logado -->
<a href="barbeiros.html">barbeiros</a> <!-- acesso às outras telas -->
<a href="clientes.html">clientes</a>
<a href="agendamentos.html">agendamentos</a>
<button onclick="sair()">sair</button>
<script>
    // sessão (ver seção Sessão)
    let usuario = JSON.parse(localStorage.getItem('usuario'))
    let token = localStorage.getItem('token')
    let expira = Number(localStorage.getItem('expira'))

    if (token === null || Date.now() > expira) {
        alert('sessão expirada, faça login novamente')
        sair()
    } else {
        document.getElementById('nome').innerHTML = usuario.nome   // nome guardado no login
    }

    function sair() {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        localStorage.removeItem('expira')
        window.location.href = 'index.html'
    }
</script>
```

## barbeiros.html

```html
<meta charset="UTF-8">
<h1>BARBEIROS</h1>
<a href="principal.html">voltar</a>
<button onclick="sair()">sair</button>
<br><br>
<input type="text" placeholder="digite o nome" id="nome">
<input type="text" placeholder="digite o cpf" id="cpf">
<input type="password" placeholder="digite a senha" id="senha">
<button onclick="cadastrar()">cadastrar</button>
<br><br>
<input type="text" placeholder="buscar por nome" id="busca"> <!-- termo da busca -->
<button onclick="visualizar()">buscar</button>
<div id="lista"></div> <!-- a lista é montada aqui -->
<script>
    // sessão (ver seção Sessão)
    let usuario = JSON.parse(localStorage.getItem('usuario'))
    let token = localStorage.getItem('token')
    let expira = Number(localStorage.getItem('expira'))

    if (token === null || Date.now() > expira) {
        alert('sessão expirada, faça login novamente')
        sair()
    }

    function sair() {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        localStorage.removeItem('expira')
        window.location.href = 'index.html'
    }

    let _barbeiros = []   // barbeiros que vieram da API (o editar usa)

    async function visualizar() {
        let busca = document.getElementById('busca').value
        const resposta = await fetch(`http://localhost:6767/barbeiros?busca=${busca}`, {   // busca vazia = todos
            headers: { 'Authorization': 'Bearer ' + token }    // token exigido pela rota protegida
        })
        _barbeiros = await resposta.json()

        let lista = document.getElementById('lista')
        lista.innerHTML = ''                             // limpa antes, senão a lista repete

        _barbeiros.forEach((barbeiro, i) => {            // i = posição no array
            lista.innerHTML += `nome: ${barbeiro.nome} <br>
                <button onclick="deletar(${barbeiro.id})">
                    deletar
                </button>
                <button onclick="editar(${i})">
                    editar
                </button>
                <br><br>
            `                                            // += soma este HTML ao que já existe
        })
    }

    async function cadastrar() {
        let barbeiro = {                                 // campos que a API espera
            nome: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
            senha: document.getElementById('senha').value
        }

        const resposta = await fetch('http://localhost:6767/barbeiros', {
            method: 'POST',
            body: JSON.stringify(barbeiro),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        })
        const dados = await resposta.json()
        alert(dados.message)                             // mensagem da API
        visualizar()                                     // recarrega a lista
    }

    async function editar(i) {
        let novoNome = prompt('digite o novo nome', _barbeiros[i].nome)        // caixa já com o valor atual
        let novoCpf = prompt('digite o novo cpf (vazio mantém o atual)')       // cpf e senha são hash: não voltam para a tela
        let novaSenha = prompt('digite a nova senha (vazio mantém a atual)')

        const resposta = await fetch(`http://localhost:6767/barbeiros/${_barbeiros[i].id}`, {   // id do banco na URL
            method: 'PUT',
            body: JSON.stringify({ nome: novoNome, cpf: novoCpf, senha: novaSenha }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        })
        const dados = await resposta.json()
        alert(dados.message)
        visualizar()
    }

    async function deletar(id) {
        const resposta = await fetch(`http://localhost:6767/barbeiros/${id}`, {
            method: 'DELETE',                            // DELETE não tem body
            headers: { 'Authorization': 'Bearer ' + token }
        })
        const dados = await resposta.json()
        alert(dados.message)
        visualizar()
    }

    visualizar()   // lista ao abrir a página
</script>
```

## clientes.html

```html
<meta charset="UTF-8">
<h1>CLIENTES</h1>
<a href="principal.html">voltar</a>
<button onclick="sair()">sair</button>
<br><br>
<input type="text" placeholder="digite o nome" id="nome">
<input type="text" placeholder="digite o cpf" id="cpf">
<select id="barbeiro_id"> <!-- mostra o nome, envia o id -->
    <option value="">selecione o barbeiro</option> <!-- value vazio = nada escolhido -->
</select>
<button onclick="cadastrar()">cadastrar</button>
<div id="lista"></div>
<script>
    // sessão (ver seção Sessão)
    let usuario = JSON.parse(localStorage.getItem('usuario'))
    let token = localStorage.getItem('token')
    let expira = Number(localStorage.getItem('expira'))

    if (token === null || Date.now() > expira) {
        alert('sessão expirada, faça login novamente')
        sair()
    }

    function sair() {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        localStorage.removeItem('expira')
        window.location.href = 'index.html'
    }

    async function carregarBarbeiros() {
        const resposta = await fetch('http://localhost:6767/barbeiros', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        const barbeiros = await resposta.json()

        barbeiros.forEach((barbeiro) => {
            document.getElementById('barbeiro_id').innerHTML += `
                <option value="${barbeiro.id}">${barbeiro.nome}</option>
            `                                            // uma option por barbeiro
        })
    }

    async function visualizar() {
        const resposta = await fetch('http://localhost:6767/clientes', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        const clientes = await resposta.json()

        let lista = document.getElementById('lista')
        lista.innerHTML = ''

        clientes.forEach((cliente) => {
            lista.innerHTML += `nome: ${cliente.nome} - cpf: ${cliente.cpf} - barbeiro: ${cliente.barbeiro_nome} <br><br>`   // barbeiro_nome vem do JOIN
        })
    }

    async function cadastrar() {
        let cliente = {
            nome: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
            barbeiro_id: document.getElementById('barbeiro_id').value   // value da option escolhida
        }

        if (cliente.barbeiro_id === '') {                // nenhum barbeiro escolhido
            alert('selecione o barbeiro')
        } else {
            const resposta = await fetch('http://localhost:6767/clientes', {
                method: 'POST',
                body: JSON.stringify(cliente),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            })
            const dados = await resposta.json()
            alert(dados.message)
            visualizar()
        }
    }

    carregarBarbeiros()   // preenche o select
    visualizar()
</script>
```

## agendamentos.html

```html
<meta charset="UTF-8">
<h1>AGENDAMENTOS</h1>
<a href="principal.html">voltar</a>
<button onclick="sair()">sair</button>
<br><br>
<input type="datetime-local" id="data_hora"> <!-- devolve '2026-12-20T14:30', sem fuso -->
<select id="barbeiro_id">
    <option value="">selecione o barbeiro</option>
</select>
<select id="cliente_id">
    <option value="">selecione o cliente</option>
</select>
<button onclick="cadastrar()">agendar</button>
<div id="lista"></div>
<script>
    // sessão (ver seção Sessão)
    let usuario = JSON.parse(localStorage.getItem('usuario'))
    let token = localStorage.getItem('token')
    let expira = Number(localStorage.getItem('expira'))

    if (token === null || Date.now() > expira) {
        alert('sessão expirada, faça login novamente')
        sair()
    }

    function sair() {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        localStorage.removeItem('expira')
        window.location.href = 'index.html'
    }

    async function carregarSelects() {
        const rBarbeiros = await fetch('http://localhost:6767/barbeiros', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        const rClientes = await fetch('http://localhost:6767/clientes', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        const barbeiros = await rBarbeiros.json()
        const clientes = await rClientes.json()

        barbeiros.forEach((barbeiro) => {
            document.getElementById('barbeiro_id').innerHTML += `<option value="${barbeiro.id}">${barbeiro.nome}</option>`
        })
        clientes.forEach((cliente) => {
            document.getElementById('cliente_id').innerHTML += `<option value="${cliente.id}">${cliente.nome}</option>`
        })
    }

    async function visualizar() {
        const resposta = await fetch('http://localhost:6767/agendamentos', {   // já vem ordenado por data
            headers: { 'Authorization': 'Bearer ' + token }
        })
        const agendamentos = await resposta.json()

        let lista = document.getElementById('lista')
        lista.innerHTML = ''

        agendamentos.forEach((ag) => {
            lista.innerHTML += `data: ${ag.data_formatada} <br>
                barbeiro: ${ag.barbeiro_nome} <br>
                cliente: ${ag.cliente_nome} - cpf: ${ag.cliente_cpf} <br>
                <button onclick="alterarData(${ag.id})">
                    alterar data
                </button>
                <br><br>
            `                                            // data_formatada: horário de Brasília (fuso em 02_node_fastify.md)
        })
    }

    async function cadastrar() {
        let agendamento = {
            data_hora: document.getElementById('data_hora').value,
            barbeiro_id: document.getElementById('barbeiro_id').value,
            cliente_id: document.getElementById('cliente_id').value
        }

        const resposta = await fetch('http://localhost:6767/agendamentos', {
            method: 'POST',
            body: JSON.stringify(agendamento),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        })
        const dados = await resposta.json()
        alert(dados.message)
        visualizar()                                     // o novo agendamento entra na lista, na posição da data
    }

    async function alterarData(id) {
        let novaData = prompt('digite a nova data (ano-mês-dia hora:minuto)', '2026-11-25 09:00')   // sem fuso

        const resposta = await fetch(`http://localhost:6767/agendamentos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ data_hora: novaData }),   // só a data vai no body
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        })
        const dados = await resposta.json()
        alert(dados.message)
        visualizar()                                     // a lista volta reordenada
    }

    carregarSelects()
    visualizar()
</script>
```

## Ferramentas do navegador (F12)

| Aba | Uso |
|---|---|
| Console | erros de JavaScript |
| Network | requisições feitas pela página, com status e resposta |
| Application > Local Storage | dados guardados (token, expira, usuario) |

| Sintoma | Causa |
|---|---|
| `blocked by CORS policy` | CORS não liberado na API, ou o método não está em `methods` |
| `Failed to fetch` | a API não está rodando ou o endereço/porta está errado |
| `undefined` na lista | o nome do campo é diferente do que a API devolve (ver em Network) |
| lista vazia e 401 em Network | token ausente no `headers` ou token vencido |
| volta sempre para o login | o token expirou, ou `expira` não foi salvo no login |
| acentos trocados por símbolos | falta `<meta charset="UTF-8">` |
| `Cannot read properties of null (reading 'value')` | o `id` do `getElementById` não existe no HTML (nome diferente) |
| `x is not defined` ao clicar | a função do `onclick` não existe ou tem outro nome |
| `resposta.json is not a function` | faltou `await` antes do `fetch` |
| `[object Object]` chegando na API | faltou `JSON.stringify` no `body` |
