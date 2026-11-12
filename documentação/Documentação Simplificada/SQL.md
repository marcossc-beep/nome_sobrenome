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
- VARCHAR(255): Texto com limite fixo de caracteres. Ideal para nomes, CPF, senhas e telefones.
- INT: Números inteiros sem casas decimais (ex: chaves estrangeiras).
- TIMESTAMP: Armazena data e hora juntas (ex: 2026-11-20 14:00:00).

OBS: use VARCHAR(255) em cpf e senha. Quando forem criptografados (bcrypt), o valor guardado vira um hash de 60 caracteres e não cabe em VARCHAR(20).
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

-- Buscar apenas id e nome (cpf e senha ficam de fora: vão estar criptografados)
SELECT id, nome FROM barbeiro;

-- Filtrar busca por ID
SELECT * FROM barbeiro WHERE id = 1;

-- Busca por termo (ILIKE ignora maiúsculas/minúsculas e o % vale por "qualquer texto")
-- Este é o padrão SQL utilizado na rota GET com filtro da API:
SELECT id, nome FROM barbeiro WHERE nome ILIKE '%ana%' ORDER BY id ASC;

-- Ordenar pela data (ASC = mais antiga primeiro)
SELECT * FROM agendamento ORDER BY data_hora ASC;
```

## Consultas com Junção de Tabelas (INNER JOIN)

```sql
O INNER JOIN serve para relacionar e exibir na mesma consulta dados que estão divididos em tabelas diferentes através da Chave Estrangeira.

// 1) JOIN Simples entre 2 Tabelas (Cliente + Barbeiro Responsável):

SELECT
    cliente.id AS id_cliente,
    cliente.nome AS nome_cliente,
    cliente.cpf AS cpf_cliente,
    barbeiro.nome AS barbeiro_responsavel
FROM cliente
INNER JOIN barbeiro ON cliente.barbeiro_id = barbeiro.id;


// 2) JOIN Triplo entre 3 Tabelas (Agendamento + Barbeiro + Cliente), ordenado por data:

SELECT
    agendamento.id AS id_agendamento,
    agendamento.data_hora,
    barbeiro.nome AS barbeiro_nome,
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
UPDATE barbeiro SET nome = 'Carlos Silva Souza', senha = 'novasenha123' WHERE id = 1;


// 2. DELETE (Deletar / Remover dados)
// ATENÇÃO: Nunca execute DELETE sem a cláusula WHERE!

-- Deletando um registro específico pelo ID
DELETE FROM barbeiro WHERE id = 3;

-- OBS: Por causa do ON DELETE CASCADE, os clientes e os agendamentos ligados a este barbeiro_id serão excluídos automaticamente.
-- Sem o CASCADE, o banco recusaria o DELETE de um barbeiro que tem clientes e agendamentos (erro de chave estrangeira).
```

## Criptografando CPF e senha direto no SQL (LGPD)

```sql
-- A LGPD pede que dados pessoais fiquem protegidos. Coloque estas linhas no FIM do saep_db.sql:
-- a extensão pgcrypto transforma o cpf e a senha em um hash (o mesmo tipo do bcrypt, gen_salt('bf')).
-- O CREATE EXTENSION também libera o crypt() que a API usa no cadastro e na edição (veja o POST e o PUT do API.md).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE barbeiro SET cpf = crypt(cpf, gen_salt('bf')), senha = crypt(senha, gen_salt('bf'));

-- Rode UMA vez só (se rodar de novo vira hash do hash).
-- Para refazer do zero, apague as tabelas e rode o script inteiro de novo:
DROP TABLE IF EXISTS agendamento, cliente, barbeiro;
```
