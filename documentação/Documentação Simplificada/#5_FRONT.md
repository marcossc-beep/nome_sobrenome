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

Os comentários explicam cada comando na primeira vez em que ele aparece; nas páginas seguintes, só o que é novo.

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
let usuario = JSON.parse(localStorage.getItem('usuario'))   // usuário salvo no login (null se não houver)
let expira = Number(localStorage.getItem('expira'))         // horário de expiração, convertido para número

if (usuario === null || Date.now() > expira) {   // sem login ou sessão vencida
    alert('sessão expirada, faça login novamente')
    sair()
}

function sair() {
    localStorage.removeItem('usuario')           // apaga a sessão
    localStorage.removeItem('expira')
    window.location.href = 'index.html'          // volta para o login
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
<meta charset="UTF-8"> <!-- acentos corretos -->
<h1>LOGIN</h1>
<input type="text" placeholder="digite o cpf" id="cpf"> <!-- o id é usado no getElementById -->
<input type="password" placeholder="digite a senha" id="senha"> <!-- password esconde o texto -->
<button onclick="entrar()">entrar</button> <!-- onclick chama a função ao clicar -->
<p id="mensagem"></p> <!-- onde aparece a mensagem de erro -->
<script>
    async function entrar() {
        let cpf = document.getElementById('cpf').value       // .value lê o que foi digitado
        let senha = document.getElementById('senha').value

        if (cpf === '' || senha === '') {                    // validação no front: campos vazios
            document.getElementById('mensagem').innerHTML = 'preencha o cpf e a senha'   // escreve na tela
        } else {
            const resposta = await fetch('http://localhost:6767/login', {
                method: 'POST',
                body: JSON.stringify({ cpf, senha }),        // { cpf, senha } = { cpf: cpf, senha: senha }
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const dados = await resposta.json()              // { message, usuario }

            if (resposta.status === 200) {                   // login aceito
                localStorage.setItem('usuario', JSON.stringify(dados.usuario))     // guarda { id, nome } como texto
                localStorage.setItem('expira', Date.now() + 30 * 60 * 1000)       // agora + 30 minutos
                window.location.href = 'principal.html'      // redireciona
            } else {
                document.getElementById('mensagem').innerHTML = dados.message     // mensagem da API (401)
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
<a href="barbeiros.html">barbeiros</a> <!-- links para as outras telas -->
<a href="clientes.html">clientes</a>
<a href="agendamentos.html">agendamentos</a>
<button onclick="sair()">sair</button>
<script>
    // sessão (ver Sessão)
    let usuario = JSON.parse(localStorage.getItem('usuario'))
    let expira = Number(localStorage.getItem('expira'))

    if (usuario === null || Date.now() > expira) {
        alert('sessão expirada, faça login novamente')
        sair()
    } else {
        document.getElementById('nome').innerHTML = usuario.nome   // mostra o nome guardado no login
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
<input type="text" placeholder="buscar por nome" id="busca"> <!-- termo da busca -->
<button onclick="visualizar()">buscar</button>
<div id="lista"></div> <!-- a lista de barbeiros é montada aqui -->
<script>
    // sessão (ver Sessão)
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

    let _barbeiros = []   // barbeiros que vieram da API (o editar usa)

    async function visualizar() {
        let busca = document.getElementById('busca').value
        const resposta = await fetch(`http://localhost:6767/barbeiros?busca=${busca}`)   // busca vazia = todos
        _barbeiros = await resposta.json()

        let lista = document.getElementById('lista')
        lista.innerHTML = ''                             // limpa antes, senão a lista repete

        _barbeiros.forEach((barbeiro, i) => {            // repete para cada barbeiro; i = posição no array
            lista.innerHTML += `nome: ${barbeiro.nome} - cpf: ${barbeiro.cpf} <br>
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
        let barbeiro = {                                 // objeto com os campos que a API espera
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
        alert(dados.message)                             // mensagem da API
        visualizar()                                     // recarrega a lista
    }

    async function editar(i) {
        let novoNome = prompt('digite o novo nome', _barbeiros[i].nome)   // prompt abre uma caixa já com o valor atual
        let novoCpf = prompt('digite o novo cpf', _barbeiros[i].cpf)

        const resposta = await fetch(`http://localhost:6767/barbeiros/${_barbeiros[i].id}`, {   // id do banco na URL
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
            method: 'DELETE'                             // DELETE não tem body
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
<select id="barbeiro_id"> <!-- lista de escolha: mostra o nome, envia o id -->
    <option value="">selecione o barbeiro</option> <!-- value vazio = nada escolhido -->
</select>
<button onclick="cadastrar()">cadastrar</button>
<div id="lista"></div>
<script>
    // sessão (ver Sessão)
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
            `                                            // uma option por barbeiro: value = id, texto = nome
        })
    }

    async function visualizar() {
        const resposta = await fetch('http://localhost:6767/clientes')
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
            barbeiro_id: document.getElementById('barbeiro_id').value   // value da option escolhida (id do barbeiro)
        }

        if (cliente.barbeiro_id === '') {                // nenhum barbeiro escolhido
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
<div id="lista"></div>
<script>
    // sessão (ver Sessão)
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
        const resposta = await fetch('http://localhost:6767/agendamentos')   // já vem ordenado por data
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
            `                                            // data_formatada: horário de Brasília (ver OBS de fuso no #3_API.md)
        })
    }

    async function alterarData(id) {
        let novaData = prompt('digite a nova data (ano-mês-dia hora:minuto)', '2026-11-25 09:00')   // formato aceito pelo TIMESTAMP

        const resposta = await fetch(`http://localhost:6767/agendamentos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ data_hora: novaData }),   // só a data vai no body
            headers: {
                'Content-Type': 'application/json'
            }
        })
        const dados = await resposta.json()
        alert(dados.message)
        visualizar()                                     // a lista volta reordenada
    }

    visualizar()
</script>
```
