# Front-end (HTML + JavaScript + fetch)

Páginas da pasta `FRONT`, abertas pelo Live Server (botão direito no `index.html` > **Open with Live Server**).
Cada página tem os campos (`input` com `id`), os botões (`onclick`), uma `div` para a lista e o `<script>` com as funções que chamam a API pelo `fetch`.

| Página | Função |
|---|---|
| `index.html` | login |
| `principal.html` | nome do usuário logado, acesso às telas e sair |
| `barbeiros.html` | listar, buscar, cadastrar, editar e excluir |
| `clientes.html` | cadastrar cliente associado a um barbeiro |
| `agendamentos.html` | listar por data e atualizar a data |

## fetch

```js
// GET: busca dados
const resposta = await fetch('http://localhost:6767/barbeiros')
const barbeiros = await resposta.json()

// POST / PUT: envia um objeto no body
const resposta = await fetch('http://localhost:6767/barbeiros', {
    method: 'POST',
    body: JSON.stringify(barbeiro),
    headers: {
        'Content-Type': 'application/json'
    }
})
const dados = await resposta.json()   // { message: '...' }

// DELETE: só a URL com o id
await fetch(`http://localhost:6767/barbeiros/${id}`, { method: 'DELETE' })
```

- `await` só funciona dentro de função `async`.
- `JSON.stringify` transforma o objeto em texto para o body; `resposta.json()` transforma a resposta em objeto.
- `resposta.status` traz o código HTTP (200, 401...).

## Sessão

O login guarda no `localStorage` o usuário e o horário em que a sessão expira (30 minutos). As outras páginas conferem os dois no começo do `<script>`:

```js
let usuario = JSON.parse(localStorage.getItem('usuario'))
let expira = Number(localStorage.getItem('expira'))

if (usuario === null || Date.now() > expira) {
    alert('sessão expirada, faça login novamente')
    sair()
}

function sair() {
    localStorage.removeItem('usuario')
    localStorage.removeItem('expira')
    window.location.href = 'index.html'
}
```

| Comando | Efeito |
|---|---|
| `localStorage.setItem('chave', valor)` | guarda |
| `localStorage.getItem('chave')` | lê (`null` se não existe) |
| `localStorage.removeItem('chave')` | apaga |
| `Date.now()` | horário atual em milissegundos |
| `30 * 60 * 1000` | 30 minutos em milissegundos |

## index.html (login)

```html
<meta charset="UTF-8">
<h1>LOGIN</h1>
<input type="text" placeholder="digite o cpf" id="cpf">
<input type="password" placeholder="digite a senha" id="senha">
<button onclick="entrar()">entrar</button>
<p id="mensagem"></p>
<script>
    async function entrar() {
        let cpf = document.getElementById('cpf').value
        let senha = document.getElementById('senha').value

        if (cpf === '' || senha === '') {
            document.getElementById('mensagem').innerHTML = 'preencha o cpf e a senha'
        } else {
            const resposta = await fetch('http://localhost:6767/login', {
                method: 'POST',
                body: JSON.stringify({ cpf, senha }),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const dados = await resposta.json()

            if (resposta.status === 200) {
                localStorage.setItem('usuario', JSON.stringify(dados.usuario))
                localStorage.setItem('expira', Date.now() + 30 * 60 * 1000)
                window.location.href = 'principal.html'
            } else {
                document.getElementById('mensagem').innerHTML = dados.message
            }
        }
    }
</script>
```

Falha no login: campos vazios (validação no front) ou `CPF ou senha inválidos!` (mensagem da API, status 401).

## principal.html

```html
<meta charset="UTF-8">
<h1>PRINCIPAL</h1>
<p>usuário: <b id="nome"></b></p>
<a href="barbeiros.html">barbeiros</a>
<a href="clientes.html">clientes</a>
<a href="agendamentos.html">agendamentos</a>
<button onclick="sair()">sair</button>
<script>
    let usuario = JSON.parse(localStorage.getItem('usuario'))
    let expira = Number(localStorage.getItem('expira'))

    if (usuario === null || Date.now() > expira) {
        alert('sessão expirada, faça login novamente')
        sair()
    } else {
        document.getElementById('nome').innerHTML = usuario.nome
    }

    function sair() {
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
<input type="text" placeholder="buscar por nome" id="busca">
<button onclick="visualizar()">buscar</button>
<div id="lista"></div>
<script>
    let usuario = JSON.parse(localStorage.getItem('usuario'))
    let expira = Number(localStorage.getItem('expira'))

    if (usuario === null || Date.now() > expira) {
        alert('sessão expirada, faça login novamente')
        sair()
    }

    function sair() {
        localStorage.removeItem('usuario')
        localStorage.removeItem('expira')
        window.location.href = 'index.html'
    }

    let _barbeiros = []

    async function visualizar() {
        let busca = document.getElementById('busca').value
        const resposta = await fetch(`http://localhost:6767/barbeiros?busca=${busca}`)
        _barbeiros = await resposta.json()

        let lista = document.getElementById('lista')
        lista.innerHTML = ''

        _barbeiros.forEach((barbeiro, i) => {
            lista.innerHTML += `nome: ${barbeiro.nome} - cpf: ${barbeiro.cpf} <br>
                <button onclick="deletar(${barbeiro.id})">
                    deletar
                </button>
                <button onclick="editar(${i})">
                    editar
                </button>
                <br><br>
            `
        })
    }

    async function cadastrar() {
        let barbeiro = {
            nome: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
            senha: document.getElementById('senha').value
        }

        const resposta = await fetch('http://localhost:6767/barbeiros', {
            method: 'POST',
            body: JSON.stringify(barbeiro),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        const dados = await resposta.json()
        alert(dados.message)
        visualizar()
    }

    async function editar(i) {
        let novoNome = prompt('digite o novo nome', _barbeiros[i].nome)
        let novoCpf = prompt('digite o novo cpf', _barbeiros[i].cpf)

        const resposta = await fetch(`http://localhost:6767/barbeiros/${_barbeiros[i].id}`, {
            method: 'PUT',
            body: JSON.stringify({ nome: novoNome, cpf: novoCpf }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        const dados = await resposta.json()
        alert(dados.message)
        visualizar()
    }

    async function deletar(id) {
        const resposta = await fetch(`http://localhost:6767/barbeiros/${id}`, {
            method: 'DELETE'
        })
        const dados = await resposta.json()
        alert(dados.message)
        visualizar()
    }

    visualizar()
</script>
```

- Busca vazia: `?busca=` sem termo, a API lista todos.
- `deletar` recebe o `id` do banco; `editar` recebe a posição `i` na lista `_barbeiros`, de onde vêm o nome e o cpf atuais para o `prompt`.

## clientes.html

O `<select>` mostra o nome do barbeiro e envia o `id` dele (`value`) como `barbeiro_id`.

```html
<meta charset="UTF-8">
<h1>CLIENTES</h1>
<a href="principal.html">voltar</a>
<button onclick="sair()">sair</button>
<br><br>
<input type="text" placeholder="digite o nome" id="nome">
<input type="text" placeholder="digite o cpf" id="cpf">
<select id="barbeiro_id">
    <option value="">selecione o barbeiro</option>
</select>
<button onclick="cadastrar()">cadastrar</button>
<div id="lista"></div>
<script>
    let usuario = JSON.parse(localStorage.getItem('usuario'))
    let expira = Number(localStorage.getItem('expira'))

    if (usuario === null || Date.now() > expira) {
        alert('sessão expirada, faça login novamente')
        sair()
    }

    function sair() {
        localStorage.removeItem('usuario')
        localStorage.removeItem('expira')
        window.location.href = 'index.html'
    }

    async function carregarBarbeiros() {
        const resposta = await fetch('http://localhost:6767/barbeiros')
        const barbeiros = await resposta.json()

        barbeiros.forEach((barbeiro) => {
            document.getElementById('barbeiro_id').innerHTML += `
                <option value="${barbeiro.id}">${barbeiro.nome}</option>
            `
        })
    }

    async function visualizar() {
        const resposta = await fetch('http://localhost:6767/clientes')
        const clientes = await resposta.json()

        let lista = document.getElementById('lista')
        lista.innerHTML = ''

        clientes.forEach((cliente) => {
            lista.innerHTML += `nome: ${cliente.nome} - cpf: ${cliente.cpf} - barbeiro: ${cliente.barbeiro_nome} <br><br>`
        })
    }

    async function cadastrar() {
        let cliente = {
            nome: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
            barbeiro_id: document.getElementById('barbeiro_id').value
        }

        if (cliente.barbeiro_id === '') {
            alert('selecione o barbeiro')
        } else {
            const resposta = await fetch('http://localhost:6767/clientes', {
                method: 'POST',
                body: JSON.stringify(cliente),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const dados = await resposta.json()
            alert(dados.message)
            visualizar()
        }
    }

    carregarBarbeiros()
    visualizar()
</script>
```

## agendamentos.html

```html
<meta charset="UTF-8">
<h1>AGENDAMENTOS</h1>
<a href="principal.html">voltar</a>
<button onclick="sair()">sair</button>
<div id="lista"></div>
<script>
    let usuario = JSON.parse(localStorage.getItem('usuario'))
    let expira = Number(localStorage.getItem('expira'))

    if (usuario === null || Date.now() > expira) {
        alert('sessão expirada, faça login novamente')
        sair()
    }

    function sair() {
        localStorage.removeItem('usuario')
        localStorage.removeItem('expira')
        window.location.href = 'index.html'
    }

    async function visualizar() {
        const resposta = await fetch('http://localhost:6767/agendamentos')
        const agendamentos = await resposta.json()

        let lista = document.getElementById('lista')
        lista.innerHTML = ''

        agendamentos.forEach((ag) => {
            lista.innerHTML += `data: ${ag.data_formatada} <br>
                barbeiro: ${ag.barbeiro_nome} - cpf: ${ag.barbeiro_cpf} <br>
                cliente: ${ag.cliente_nome} - cpf: ${ag.cliente_cpf} <br>
                <button onclick="alterarData(${ag.id})">
                    alterar data
                </button>
                <br><br>
            `
        })
    }

    async function alterarData(id) {
        let novaData = prompt('digite a nova data (ano-mês-dia hora:minuto)', '2026-11-25 09:00')

        const resposta = await fetch(`http://localhost:6767/agendamentos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ data_hora: novaData }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        const dados = await resposta.json()
        alert(dados.message)
        visualizar()
    }

    visualizar()
</script>
```

- A lista exibe `ag.data_formatada` e não `ag.data_hora`: o `data_hora` chega em UTC, com 3 horas a mais (ver a OBS de fuso horário no GET /agendamentos do `#3_API.md`).
- A nova data vai sem fuso (`2026-11-25 09:00`), no mesmo formato aceito pelo `TIMESTAMP`.
