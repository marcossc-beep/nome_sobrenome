# Introdução a Banco de Dados Relacional

```sql
Um banco de dados relacional é organizado em tabelas conectadas entre si por chaves (IDs).
Para entender como as informações ficam guardadas:

- Tabela: É como uma aba de planilha (ex: Tabela "barbeiro", Tabela "cliente", Tabela "agendamento").
- Colunas (Campos): Definem o tipo de informação salva (ex: nome, cpf, data_hora).
- Linhas (Registros/Tuplas): São os dados cadastrados (ex: Linha 1 possui o barbeiro "Carlos Silva", cpf "111.222.333-44").

O SQL (Structured Query Language) é a linguagem que usamos para criar as tabelas, inserir, atualizar, consultar e deletar registros no PostgreSQL via PGAdmin.
```

## Tipos de Dados Mais Utilizados

```sql
- SERIAL: Cria um número inteiro sequencial automático (1, 2, 3...) a cada cadastro. Usado para a Chave Primária (id).
- VARCHAR(255): Texto com limite fixo de caracteres. Ideal para nomes, CPF e senhas.
- INT: Números inteiros sem casas decimais (ex: chaves estrangeiras).
- TIMESTAMP: Armazena data e hora juntas (ex: 2026-11-20 14:00:00).
```

## Regras e Restrições (Constraints)

```sql
- PRIMARY KEY: Identificador único da linha. Não pode se repetir nem ser nulo.
- NOT NULL: Torna o preenchimento da coluna obrigatório.
- REFERENCES tabela(id): Cria a Chave Estrangeira (Foreign Key / FK), vinculando o registro atual ao ID de outra tabela.
- ON DELETE CASCADE: Se o registro pai for deletado, todos os registros filhos ligados a ele serão apagados automaticamente.
```

## Antes de criar as tabelas: criar o banco

```sql
No pgAdmin, crie o banco e abra o Query Tool DENTRO dele (botão direito no banco > Query Tool). Todos os comandos abaixo rodam ali.

    CREATE DATABASE saep_db;
```

## Quem depende de quem (pense nisso antes do CREATE TABLE)

```sql
    barbeiro  ---<  cliente       (cada cliente é atendido por um barbeiro; um barbeiro tem vários clientes)
    barbeiro  ---<  agendamento   (cada agendamento é com um barbeiro)
    cliente   ---<  agendamento   (cada agendamento é de um cliente)

- A tabela do lado "muitos" leva a chave estrangeira (cliente leva barbeiro_id).
- O agendamento liga as duas e por isso leva DUAS chaves estrangeiras (barbeiro_id e cliente_id).
- Crie primeiro quem não depende de ninguém (barbeiro), depois cliente e por último agendamento.
- O barbeiro é quem faz login no sistema, por isso a tabela dele tem cpf e senha.
```

## Criação de Tabelas (DDL)

```sql
O script deve seguir a ordem correta de criação (as tabelas base primeiro, e depois as tabelas que possuem Chave Estrangeira).

-- 1. Tabela Base: BARBEIRO (Não depende de nenhuma outra tabela).

CREATE TABLE barbeiro (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL
);


-- 2. Tabela Secundária: CLIENTE (cada cliente pertence a um barbeiro)

CREATE TABLE cliente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(255) NOT NULL,
    barbeiro_id INT NOT NULL REFERENCES barbeiro(id) ON DELETE CASCADE
);

-- 3. Tabela Principal/Relacionamento: AGENDAMENTO (Vincula Barbeiro e Cliente em uma data)

CREATE TABLE agendamento (
    id SERIAL PRIMARY KEY,
    data_hora TIMESTAMP NOT NULL,
    barbeiro_id INT NOT NULL REFERENCES barbeiro(id) ON DELETE CASCADE,
    cliente_id INT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE
);

// Como ler uma chave estrangeira:   barbeiro_id INT NOT NULL REFERENCES barbeiro(id)
//   "a coluna barbeiro_id é um número obrigatório que precisa existir na coluna id da tabela barbeiro".
```

## População Inicial do Banco (exemplo com 3 registros por tabela)

```sql
É obrigatório inserir no mínimo 3 registros em TODAS as tabelas criadas no script `.sql`, respeitando a ordem das chaves estrangeiras.
- A lista de colunas e os valores precisam estar na mesma ordem e na mesma quantidade.
- Toda coluna NOT NULL precisa receber valor (o id não, ele é automático).
- O nome da tabela é o mesmo do CREATE TABLE (agendamento, não "agendamentos").

-- Inserindo 3 Barbeiros (os ids saem sozinhos: 1, 2 e 3)
-- O cpf e a senha daqui são os que você usa para entrar no sistema (ex: 111.222.333-44 e senha123).

INSERT INTO barbeiro (nome, cpf, senha) VALUES
('Carlos Silva', '111.222.333-44', 'senha123'),
('Ana Souza', '222.333.444-55', 'senha456'),
('Marcos Oliveira', '333.444.555-66', 'senha789');

-- Inserindo 3 Clientes (vinculados aos IDs de barbeiro 3, 2 e 1)

INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES
('Pedro Santos', '444.555.666-77', 3),
('Juliana Costa', '555.666.777-88', 2),
('Rafael Lima', '666.777.888-99', 1);

-- Inserindo 3 Agendamentos (barbeiro e cliente de cada um, com datas diferentes e fora de ordem)

INSERT INTO agendamento (data_hora, barbeiro_id, cliente_id) VALUES
('2026-11-20 14:00:00', 1, 1),
('2026-11-18 10:30:00', 2, 2),
('2026-11-19 16:00:00', 3, 3);

-- Conferindo: cada consulta deve mostrar 3 linhas

SELECT * FROM barbeiro;
SELECT * FROM cliente;
SELECT * FROM agendamento;

// Dica: datas fora de ordem ajudam a ver o ORDER BY funcionando.
// Dica: barbeiro_id e cliente_id precisam existir (1, 2 ou 3 aqui). Um 9 daria erro de chave estrangeira.
```

## Consultando dados (SELECT)

```sql
-- Buscar todos os campos de todos os barbeiros
SELECT * FROM barbeiro;

-- Buscar apenas algumas colunas (a senha fica de fora)
SELECT id, nome, cpf FROM barbeiro;

-- Filtrar busca por ID
SELECT * FROM barbeiro WHERE id = 1;

-- Conferir login: só traz o barbeiro se o cpf E a senha baterem (é o SQL da rota de login)
SELECT id, nome FROM barbeiro WHERE cpf = '111.222.333-44' AND senha = 'senha123';

-- Busca por termo (ILIKE ignora maiúsculas/minúsculas e o % vale por "qualquer texto")
-- Este é o padrão SQL utilizado na rota GET com filtro da API:
SELECT id, nome, cpf FROM barbeiro WHERE nome ILIKE '%ana%' ORDER BY id ASC;

-- Ordenar pela data (ASC = mais antiga primeiro)
SELECT * FROM agendamento ORDER BY data_hora ASC;
```

## Consultas com Junção de Tabelas (INNER JOIN)

```sql
O INNER JOIN serve para relacionar e exibir na mesma consulta dados que estão divididos em tabelas diferentes através da Chave Estrangeira.

// 1) JOIN Simples entre 2 Tabelas (Cliente + Barbeiro Responsável):

SELECT
    cliente.id,
    cliente.nome,
    cliente.cpf,
    barbeiro.nome AS barbeiro_nome
FROM cliente
INNER JOIN barbeiro ON cliente.barbeiro_id = barbeiro.id
ORDER BY cliente.id;


// 2) JOIN Triplo entre 3 Tabelas (Agendamento + Barbeiro + Cliente), ordenado por data, com os dados dos dois:

SELECT
    agendamento.id,
    agendamento.data_hora,
    barbeiro.id AS barbeiro_id,
    barbeiro.nome AS barbeiro_nome,
    barbeiro.cpf AS barbeiro_cpf,
    cliente.id AS cliente_id,
    cliente.nome AS cliente_nome,
    cliente.cpf AS cliente_cpf
FROM agendamento
INNER JOIN barbeiro ON agendamento.barbeiro_id = barbeiro.id
INNER JOIN cliente ON agendamento.cliente_id = cliente.id
ORDER BY agendamento.data_hora ASC;

// OBS: o AS dá um apelido à coluna. Sem ele, barbeiro.nome e cliente.nome viram duas colunas "nome" e se confundem.
// Escreva sempre tabela.coluna (agendamento.id, barbeiro.nome), senão o banco reclama de "id ambíguo".
```

## Alterando e apagando dados (UPDATE e DELETE)

```sql
// 1. UPDATE (Atualizar / Alterar dados)
// ATENÇÃO: Nunca execute UPDATE sem a cláusula WHERE! Se esquecer o WHERE, alterará a tabela toda.

-- Atualizando só a data de um agendamento
UPDATE agendamento SET data_hora = '2026-11-25 09:00:00' WHERE id = 1;

-- Atualizando dados de um barbeiro pelo ID
UPDATE barbeiro SET nome = 'Carlos Silva Souza', cpf = '111.222.333-44' WHERE id = 1;


// 2. DELETE (Deletar / Remover dados)
// ATENÇÃO: Nunca execute DELETE sem a cláusula WHERE!

-- Deletando um registro específico pelo ID
DELETE FROM barbeiro WHERE id = 3;

-- OBS: Por causa do ON DELETE CASCADE, os clientes e os agendamentos ligados a este barbeiro_id serão excluídos automaticamente.
-- Sem o CASCADE, o banco recusaria o DELETE de um barbeiro que tem clientes e agendamentos (erro de chave estrangeira).
```

## O arquivo saep_db.sql completo

```sql
-- Este é o conteúdo do saep_db.sql (raiz do projeto). Rode inteiro no Query Tool, DENTRO do banco saep_db.
-- O DROP da primeira linha apaga as tabelas antigas: assim o script pode ser rodado de novo quantas vezes precisar.

DROP TABLE IF EXISTS agendamento, cliente, barbeiro;

CREATE TABLE barbeiro (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL
);

CREATE TABLE cliente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(255) NOT NULL,
    barbeiro_id INT NOT NULL REFERENCES barbeiro(id) ON DELETE CASCADE
);

CREATE TABLE agendamento (
    id SERIAL PRIMARY KEY,
    data_hora TIMESTAMP NOT NULL,
    barbeiro_id INT NOT NULL REFERENCES barbeiro(id) ON DELETE CASCADE,
    cliente_id INT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE
);

INSERT INTO barbeiro (nome, cpf, senha) VALUES
('Carlos Silva', '111.222.333-44', 'senha123'),
('Ana Souza', '222.333.444-55', 'senha456'),
('Marcos Oliveira', '333.444.555-66', 'senha789');

INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES
('Pedro Santos', '444.555.666-77', 3),
('Juliana Costa', '555.666.777-88', 2),
('Rafael Lima', '666.777.888-99', 1);

INSERT INTO agendamento (data_hora, barbeiro_id, cliente_id) VALUES
('2026-11-20 14:00:00', 1, 1),
('2026-11-18 10:30:00', 2, 2),
('2026-11-19 16:00:00', 3, 3);
```

## Gerando o DER no pgAdmin (der.png)

```sql
1. No pgAdmin, depois de criar as tabelas, clique com o botão direito no banco (saep_db).
2. Escolha "ERD For Database" (em algumas versões o nome é "Generate ERD").
3. Confira se as 3 tabelas aparecem e se as setas ligam: cliente > barbeiro, agendamento > barbeiro e agendamento > cliente.
4. Na barra do diagrama use o ícone de imagem ("Download image") e salve como PNG.
5. Renomeie para der.png e coloque na raiz do projeto.
```

## Conferência final

```sql
[ ] o saep_db.sql roda inteiro, do zero, sem erro
[ ] cada relacionamento tem sua chave estrangeira (REFERENCES)
[ ] as 3 tabelas têm pelo menos 3 registros
[ ] der.png na raiz, com as 3 tabelas e as ligações
```

## Erros comuns

```sql
- relation "agendamentos" does not exist: o nome da tabela no INSERT é diferente do CREATE TABLE (plural a mais ou a menos).
- null value in column "senha" violates not-null constraint: faltou a coluna senha no INSERT (ou o valor).
- insert or update on table "cliente" violates foreign key constraint: o barbeiro_id (ou cliente_id) apontado não existe.
- relation "barbeiro" already exists: o script foi rodado de novo sem o DROP da primeira linha.
- column "id" is ambiguous: no JOIN, escreva tabela.coluna.
- As tabelas foram criadas no banco errado: confira qual banco está selecionado antes de abrir o Query Tool.
```
