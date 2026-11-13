# Front-end: as telas do sistema

```js
// O front são as páginas HTML da pasta FRONT. Elas conversam com a API (server.js) pelo fetch.
// A API precisa estar rodando (npm start) e o cors liberado (já está no server.js do #3_API.md).
//
// Para abrir: clique com o botão direito no FRONT/index.html > "Open with Live Server".
// Para ver erros: F12 > aba Console. Para ver as chamadas à API: F12 > aba Network.
//
// Páginas (pasta FRONT):
//
//     scripts.js         funções que TODAS as páginas usam (sessão, sair, fetch)
//     index.html         login
//     principal.html     tela principal (nome do usuário, links e sair)
//     barbeiros.html     listar, buscar, cadastrar, editar e excluir barbeiro
//     clientes.html      cadastrar cliente escolhendo o barbeiro (select)
//     agendamentos.html  listar por data e atualizar a data
//     styles.css         aparência (opcional)
//
// Cada arquivo abaixo está completo: crie o arquivo com o nome indicado e escreva o código inteiro.
```

## Como funciona a sessão

```js
// Depois do login, o navegador guarda no localStorage (uma "gaveta" do navegador que não some ao recarregar):
//   usuario  -> o barbeiro logado ({ id, nome }), para mostrar o nome na tela principal
//   expira   -> o horário em que a sessão acaba (agora + 30 minutos)
//
// Toda página chama protegerPagina() no começo: se não tem usuário ou o horário passou,
// apaga a sessão e volta para o login. O botão Sair faz a mesma limpeza.
//
// localStorage.setItem('chave', valor)   guarda
// localStorage.getItem('chave')          lê (ou null se não existe)
// localStorage.removeItem('chave')       apaga
// JSON.stringify(objeto) / JSON.parse(texto): o localStorage só guarda texto.
```

## FRONT/scripts.js

```js
const API = 'http://localhost:6767'

// A sessão dura 30 minutos depois do login (30 min x 60 s x 1000 ms)
const TEMPO_SESSAO = 30 * 60 * 1000

// Guarda o usuário logado e o horário em que a sessão expira
function salvarSessao(usuario) {
    localStorage.setItem('usuario', JSON.stringify(usuario))
    localStorage.setItem('expira', Date.now() + TEMPO_SESSAO)
}

// Usuário logado salvo no navegador (ou null)
function pegarUsuario() {
    return JSON.parse(localStorage.getItem('usuario'))
}

// A sessão é válida se existe usuário e o horário de expiração ainda não passou
function sessaoValida() {
    const expira = Number(localStorage.getItem('expira'))
    return pegarUsuario() && Date.now() < expira
}

// Sai do sistema: apaga a sessão e volta para o login
function sair(mensagem) {
    localStorage.removeItem('usuario')
    localStorage.removeItem('expira')
    if (mensagem) alert(mensagem)
    window.location.href = 'index.html'
}

// Colocar no começo de toda página que precisa de login
function protegerPagina() {
    if (!sessaoValida()) {
        sair('Sessão expirada. Faça login novamente.')
    }
}

// fetch para a API: api('/barbeiros') faz um GET; api('/barbeiros', 'POST', objeto) manda o objeto no body
async function api(caminho, metodo = 'GET', corpo) {
    const opcoes = { method: metodo }

    if (corpo) {
        opcoes.headers = { 'Content-Type': 'application/json' }
        opcoes.body = JSON.stringify(corpo)
    }

    const resposta = await fetch(API + caminho, opcoes)
    return resposta.json()
}

// Mostra a data do banco no formato brasileiro (20/11/2026, 14:00)
function formatarData(data) {
    return new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
```

## FRONT/index.html (login)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Barbearia - Login</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Barbearia - Login</h1>

    <input type="text" placeholder="cpf" id="cpf">
    <input type="password" placeholder="senha" id="senha">
    <button onclick="entrar()">entrar</button>

    <!-- Mensagem de falha no login aparece aqui -->
    <p id="mensagem" class="erro"></p>

    <script src="scripts.js"></script>
    <script>
        // Se já está logado e a sessão não expirou, vai direto para a principal
        if (sessaoValida()) {
            window.location.href = 'principal.html'
        }

        async function entrar() {
            const cpf = document.getElementById('cpf').value
            const senha = document.getElementById('senha').value
            const mensagem = document.getElementById('mensagem')

            // Validação no front: campos vazios
            if (!cpf || !senha) {
                mensagem.textContent = 'Preencha CPF e senha!'
                return
            }

            const resposta = await fetch(`${API}/login`, {
                method: 'POST',
                body: JSON.stringify({ cpf, senha }),
                headers: { 'Content-Type': 'application/json' }
            })
            const dados = await resposta.json()

            // Validação vinda da API: cpf ou senha errados (status 401)
            if (!resposta.ok) {
                mensagem.textContent = dados.message
                return
            }

            salvarSessao(dados.usuario)
            window.location.href = 'principal.html'
        }
    </script>
</body>
</html>
```

```js
// - O login usa o fetch direto (e não a função api) para conseguir ler o resposta.ok (false quando a API responde 401).
// - Teste: campos vazios, senha errada (aparece "CPF ou senha inválidos!") e o login certo (111.222.333-44 e senha123).
// - No F12 > Application > Local Storage aparecem o usuario e o expira.
```

## FRONT/principal.html

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Barbearia - Principal</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <strong>Barbearia</strong>
        <span>Usuário: <b id="nomeUsuario"></b></span>
        <button onclick="sair()">Sair</button>
    </header>

    <h1>Bem-vindo!</h1>

    <!-- Acesso às demais funcionalidades -->
    <nav class="menu">
        <a href="barbeiros.html">Barbeiros</a>
        <a href="clientes.html">Clientes</a>
        <a href="agendamentos.html">Agendamentos</a>
    </nav>

    <script src="scripts.js"></script>
    <script>
        protegerPagina()

        // O nome vem do usuário guardado no login
        document.getElementById('nomeUsuario').textContent = pegarUsuario().nome
    </script>
</body>
</html>
```

```js
// Para ver a sessão expirando: no scripts.js troque 30 * 60 * 1000 por 60 * 1000 (1 minuto),
// faça login, espere 1 minuto e recarregue a principal. Ela volta para o login. Depois volte para 30 minutos.
```

## FRONT/barbeiros.html (listar, buscar, cadastrar, editar e excluir)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Barbearia - Barbeiros</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <a href="principal.html">Principal</a>
        <a href="clientes.html">Clientes</a>
        <a href="agendamentos.html">Agendamentos</a>
        <button onclick="sair()">Sair</button>
    </header>

    <h1>Barbeiros</h1>

    <h3 id="titulo">Cadastrar barbeiro</h3>

    <!-- O id fica escondido: é preenchido só quando clica em editar -->
    <input type="hidden" id="id">
    <input type="text" placeholder="nome" id="nome">
    <input type="text" placeholder="cpf" id="cpf">
    <input type="password" placeholder="senha" id="senha">

    <button onclick="cadastrar()" id="botaoCadastrar">cadastrar</button>
    <button onclick="salvarEdicao()" id="botaoEditar" style="display: none">salvar alterações</button>
    <button onclick="limpar()">cancelar</button>

    <h3>Buscar</h3>
    <input type="text" placeholder="buscar por nome" id="termo">
    <button onclick="buscar()">buscar</button>
    <button onclick="limparBusca()">limpar busca</button>

    <div id="lista"></div>

    <script src="scripts.js"></script>
    <script>
        protegerPagina()

        // Guarda a lista que veio da API (o editar procura o barbeiro aqui)
        let barbeiros = []

        // LISTAR (com busca opcional): GET /barbeiros ou GET /barbeiros?busca=termo
        async function carregar(busca) {
            const caminho = busca ? `/barbeiros?busca=${encodeURIComponent(busca)}` : '/barbeiros'
            barbeiros = await api(caminho)

            const lista = document.getElementById('lista')
            lista.innerHTML = ''

            barbeiros.forEach((barbeiro) => {
                lista.innerHTML += `
                <div class="item">
                    <b>${barbeiro.nome}</b> <br>
                    cpf: ${barbeiro.cpf} <br>
                    <button onclick="editar(${barbeiro.id})">editar</button>
                    <button onclick="excluir(${barbeiro.id})">excluir</button>
                </div>`
            })
        }

        // CADASTRAR: POST /barbeiros
        async function cadastrar() {
            const barbeiro = {
                nome: document.getElementById('nome').value,
                cpf: document.getElementById('cpf').value,
                senha: document.getElementById('senha').value
            }

            if (!barbeiro.nome || !barbeiro.cpf || !barbeiro.senha) {
                alert('Preencha nome, cpf e senha!')
                return
            }

            const dados = await api('/barbeiros', 'POST', barbeiro)
            alert(dados.message)
            limpar()
            carregar()
        }

        // EXCLUIR: DELETE /barbeiros/id
        async function excluir(id) {
            if (!confirm('Deseja excluir este barbeiro?')) return

            const dados = await api(`/barbeiros/${id}`, 'DELETE')
            alert(dados.message)
            carregar()
        }

        // EDITAR (1ª parte): joga os dados do barbeiro clicado nos campos
        function editar(id) {
            const barbeiro = barbeiros.find((b) => b.id === id)

            document.getElementById('id').value = barbeiro.id
            document.getElementById('nome').value = barbeiro.nome
            document.getElementById('cpf').value = barbeiro.cpf
            document.getElementById('senha').style.display = 'none'   // a senha não muda na edição

            document.getElementById('titulo').textContent = 'Editar barbeiro'
            document.getElementById('botaoCadastrar').style.display = 'none'
            document.getElementById('botaoEditar').style.display = 'inline'
        }

        // EDITAR (2ª parte): PUT /barbeiros/id
        async function salvarEdicao() {
            const id = document.getElementById('id').value
            const barbeiro = {
                nome: document.getElementById('nome').value,
                cpf: document.getElementById('cpf').value
            }

            const dados = await api(`/barbeiros/${id}`, 'PUT', barbeiro)
            alert(dados.message)
            limpar()
            carregar()
        }

        // Volta a tela para o modo cadastrar (também é o botão cancelar)
        function limpar() {
            document.getElementById('id').value = ''
            document.getElementById('nome').value = ''
            document.getElementById('cpf').value = ''
            document.getElementById('senha').value = ''
            document.getElementById('senha').style.display = 'inline'

            document.getElementById('titulo').textContent = 'Cadastrar barbeiro'
            document.getElementById('botaoCadastrar').style.display = 'inline'
            document.getElementById('botaoEditar').style.display = 'none'
        }

        // BUSCAR: lê o termo e lista só quem combina
        function buscar() {
            carregar(document.getElementById('termo').value)
        }

        function limparBusca() {
            document.getElementById('termo').value = ''
            carregar()
        }

        carregar()
    </script>
</body>
</html>
```

```js
// - lista.innerHTML = '' limpa a lista antes do forEach. Sem isso, cada recarga repete os itens.
// - Depois de cadastrar, editar ou excluir, chamamos carregar() de novo para a lista mostrar o que mudou.
// - Teste da busca: digite "ana" e clique em buscar; só a Ana Souza aparece. Clique em limpar busca.
// - Excluir um barbeiro apaga junto os clientes e agendamentos dele (ON DELETE CASCADE).
```

## FRONT/clientes.html (cadastrar cliente associado a um barbeiro)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Barbearia - Clientes</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <a href="principal.html">Principal</a>
        <a href="barbeiros.html">Barbeiros</a>
        <a href="agendamentos.html">Agendamentos</a>
        <button onclick="sair()">Sair</button>
    </header>

    <h1>Clientes</h1>

    <h3>Cadastrar cliente</h3>

    <input type="text" placeholder="nome" id="nome">
    <input type="text" placeholder="cpf" id="cpf">

    <!-- O cliente precisa ser associado a um barbeiro: o texto é o nome e o value é o id -->
    <select id="barbeiro_id">
        <option value="">selecione o barbeiro...</option>
    </select>

    <button onclick="cadastrar()">cadastrar</button>

    <div id="lista"></div>

    <script src="scripts.js"></script>
    <script>
        protegerPagina()

        // Preenche o select com os barbeiros do banco (GET /barbeiros)
        async function carregarBarbeiros() {
            const barbeiros = await api('/barbeiros')
            const select = document.getElementById('barbeiro_id')

            barbeiros.forEach((barbeiro) => {
                select.innerHTML += `<option value="${barbeiro.id}">${barbeiro.nome}</option>`
            })
        }

        // Lista os clientes com o nome do barbeiro (GET /clientes, que tem o JOIN)
        async function carregarClientes() {
            const clientes = await api('/clientes')
            const lista = document.getElementById('lista')
            lista.innerHTML = ''

            clientes.forEach((cliente) => {
                lista.innerHTML += `
                <div class="item">
                    <b>${cliente.nome}</b> <br>
                    cpf: ${cliente.cpf} <br>
                    barbeiro: ${cliente.barbeiro_nome}
                </div>`
            })
        }

        // CADASTRAR: POST /clientes com o barbeiro_id escolhido no select
        async function cadastrar() {
            const cliente = {
                nome: document.getElementById('nome').value,
                cpf: document.getElementById('cpf').value,
                barbeiro_id: document.getElementById('barbeiro_id').value
            }

            if (!cliente.barbeiro_id) {
                alert('Selecione um barbeiro!')
                return
            }

            const dados = await api('/clientes', 'POST', cliente)
            alert(dados.message)

            document.getElementById('nome').value = ''
            document.getElementById('cpf').value = ''
            document.getElementById('barbeiro_id').value = ''
            carregarClientes()
        }

        carregarBarbeiros()
        carregarClientes()
    </script>
</body>
</html>
```

```js
// - O usuário escolhe o NOME do barbeiro, mas o que vai para a API é o id (value da option).
// - Teste: cadastre sem escolher o barbeiro (deve avisar) e depois escolhendo. O cliente aparece com o nome do barbeiro.
```

## FRONT/agendamentos.html (listar por data e atualizar a data)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Barbearia - Agendamentos</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <a href="principal.html">Principal</a>
        <a href="barbeiros.html">Barbeiros</a>
        <a href="clientes.html">Clientes</a>
        <button onclick="sair()">Sair</button>
    </header>

    <h1>Agendamentos</h1>

    <!-- Listagem ordenada por data com os dados do barbeiro e do cliente -->
    <div id="lista"></div>

    <script src="scripts.js"></script>
    <script>
        protegerPagina()

        // LISTAR: GET /agendamentos (a API já devolve ordenado por data)
        async function carregarAgendamentos() {
            const agendamentos = await api('/agendamentos')
            const lista = document.getElementById('lista')
            lista.innerHTML = ''

            agendamentos.forEach((ag) => {
                lista.innerHTML += `
                <div class="item">
                    <b>${formatarData(ag.data_hora)}</b> <br>
                    barbeiro: ${ag.barbeiro_nome} - cpf ${ag.barbeiro_cpf} <br>
                    cliente: ${ag.cliente_nome} - cpf ${ag.cliente_cpf} <br>
                    <input type="datetime-local" id="data-${ag.id}">
                    <button onclick="atualizarData(${ag.id})">atualizar data</button>
                </div>`
            })
        }

        // ATUALIZAR A DATA: PUT /agendamentos/id levando só a data nova
        async function atualizarData(id) {
            const novaData = document.getElementById(`data-${id}`).value

            if (!novaData) {
                alert('Escolha a nova data!')
                return
            }

            const dados = await api(`/agendamentos/${id}`, 'PUT', { data_hora: novaData })
            alert(dados.message)
            carregarAgendamentos()
        }

        carregarAgendamentos()
    </script>
</body>
</html>
```

```js
// - Cada agendamento tem seu próprio campo de data (id="data-1", "data-2"...). O botão sabe qual campo ler pelo id.
// - O input datetime-local devolve a data no formato 2026-11-17T08:30, que o Postgres aceita direto.
// - Teste: escolha uma data bem antiga em um agendamento e clique em atualizar data. Ele sobe para o topo da lista.
```

## FRONT/styles.css (opcional, só aparência)

```css
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0 24px 24px;
    background: #f4f1ec;
    color: #222;
}

header {
    background: #1f1f1f;
    color: #fff;
    padding: 12px 24px;
    margin: 0 -24px 16px;
    display: flex;
    gap: 16px;
    align-items: center;
}

header a {
    color: #f0c27b;
    text-decoration: none;
}

header button {
    margin-left: auto;
}

input, select, button {
    padding: 8px;
    margin: 4px 0;
    font-size: 15px;
}

.item {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
    line-height: 1.7;
}

.erro {
    color: #c0392b;
    font-weight: bold;
}

.menu a {
    display: inline-block;
    background: #1f1f1f;
    color: #f0c27b;
    padding: 24px 32px;
    margin: 8px 8px 8px 0;
    border-radius: 8px;
    text-decoration: none;
}
```

## Conferência final

```text
[ ] login certo leva para a principal; campos vazios e senha errada mostram mensagem
[ ] a sessão expira (teste com 1 minuto) e volta para o login
[ ] a principal mostra o nome do usuário, os links e o botão Sair
[ ] barbeiros: lista, exclui, busca por nome, cadastra e edita (e o banco guarda)
[ ] clientes: cadastra escolhendo o barbeiro no select
[ ] agendamentos: lista em ordem de data e atualiza a data
```

## Erros comuns

```text
- A tela não faz nada: F12 > Console. Quase sempre é erro de digitação ou o scripts.js não carregou.
- "Failed to fetch": a API não está rodando ou faltou o cors no server.js.
- Editar e excluir não funcionam só no navegador: faltou PUT e DELETE em methods no cors.
- Aparece "undefined" na lista: o nome do campo é diferente do que a API devolve (confira no F12 > Network).
- A lista repete os itens: faltou lista.innerHTML = '' antes do forEach.
- O select fica vazio: faltou chamar carregarBarbeiros() no fim do script.
- "Cannot read properties of null (reading 'nome')" na principal: não há usuário logado. Faça login de novo.
```
