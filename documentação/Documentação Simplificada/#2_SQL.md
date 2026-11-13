# Banco de dados (PostgreSQL)

Banco relacional: os dados ficam em **tabelas** (barbeiro, cliente, agendamento), cada uma com **colunas** (nome, cpf, data_hora) e **registros** (as linhas).
As tabelas se ligam por chaves: a **chave primária** (`id`) identifica o registro e a **chave estrangeira** (`barbeiro_id`) aponta para o `id` de outra tabela.

Ferramenta: pgAdmin > botão direito no banco > **Query Tool**. Execução: F5.

## Tipos de dados

| Tipo | Uso |
|---|---|
| `SERIAL` | inteiro automático (1, 2, 3...), usado no `id` |
| `VARCHAR(255)` | texto (nome, cpf, senha) |
| `INT` | inteiro, usado nas chaves estrangeiras |
| `TIMESTAMP` | data e hora (`2026-11-20 14:00:00`) |

## Restrições

| Restrição | Efeito |
|---|---|
| `PRIMARY KEY` | identificador único da linha, não repete e não pode ser nulo |
| `NOT NULL` | preenchimento obrigatório |
| `REFERENCES tabela(id)` | chave estrangeira: o valor precisa existir no `id` da outra tabela |
| `ON DELETE CASCADE` | ao apagar o registro pai, os registros filhos ligados a ele também são apagados |

## Banco

```sql
CREATE DATABASE saep_db;
```

## Modelo

```text
barbeiro  1 ---< N  cliente        cliente.barbeiro_id     -> barbeiro.id
barbeiro  1 ---< N  agendamento    agendamento.barbeiro_id -> barbeiro.id
cliente   1 ---< N  agendamento    agendamento.cliente_id  -> cliente.id
```

- A chave estrangeira fica na tabela do lado N.
- Ordem de criação: barbeiro, cliente, agendamento (uma tabela só pode apontar para outra que já existe).
- O barbeiro é o usuário do sistema: a tabela tem `cpf` e `senha` para o login.

## CREATE TABLE

```sql
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
```

## INSERT

```sql
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

- Colunas e valores na mesma ordem e quantidade; o `id` é gerado pelo banco.
- Os ids gerados são 1, 2 e 3, na ordem do INSERT. São esses números que vão em `barbeiro_id` e `cliente_id`.
- Login de exemplo: CPF `111.222.333-44`, senha `senha123`.

## SELECT

```sql
SELECT * FROM barbeiro;

SELECT id, nome, cpf FROM barbeiro;

SELECT * FROM barbeiro WHERE id = 1;

-- login: só retorna o barbeiro se cpf e senha conferem
SELECT id, nome FROM barbeiro WHERE cpf = '111.222.333-44' AND senha = 'senha123';

-- busca por termo: ILIKE ignora maiúsculas/minúsculas, % = qualquer texto
SELECT id, nome, cpf FROM barbeiro WHERE nome ILIKE '%ana%' ORDER BY id;

-- ordenação: ASC (mais antiga primeiro) ou DESC
SELECT * FROM agendamento ORDER BY data_hora ASC;
```

## INNER JOIN

Junta tabelas pela chave estrangeira: `FROM tabela_com_fk INNER JOIN tabela_pai ON tabela_com_fk.coluna_fk = tabela_pai.id`.

```sql
-- cliente + nome do barbeiro
SELECT
    cliente.id,
    cliente.nome,
    cliente.cpf,
    barbeiro.nome AS barbeiro_nome
FROM cliente
INNER JOIN barbeiro ON cliente.barbeiro_id = barbeiro.id
ORDER BY cliente.id;

-- agendamento + barbeiro + cliente, ordenado por data
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
```

- `AS` dá apelido à coluna: sem ele, `barbeiro.nome` e `cliente.nome` chegam com o mesmo nome.
- `tabela.coluna` evita o erro `column "id" is ambiguous`.

## UPDATE e DELETE

```sql
UPDATE agendamento SET data_hora = '2026-11-25 09:00:00' WHERE id = 1;

UPDATE barbeiro SET nome = 'Carlos Silva Souza', cpf = '111.222.333-44' WHERE id = 1;

DELETE FROM barbeiro WHERE id = 3;
```

- Sem `WHERE`, o UPDATE e o DELETE afetam todas as linhas da tabela.
- Com `ON DELETE CASCADE`, apagar o barbeiro 3 apaga também os clientes e agendamentos ligados a ele.

## saep_db.sql

Arquivo da raiz do projeto, executado no Query Tool do banco `saep_db`. O `DROP` inicial permite executar o script mais de uma vez.

```sql
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

## DER (der.png)

pgAdmin > botão direito no banco `saep_db` > **ERD For Database** (em algumas versões, **Generate ERD**) > ícone **Download image** > salvar como `der.png` na raiz do projeto.

O diagrama mostra as 3 tabelas e as ligações cliente > barbeiro, agendamento > barbeiro e agendamento > cliente.

## Mensagens de erro

| Mensagem | Causa |
|---|---|
| `relation "agendamentos" does not exist` | nome da tabela diferente do CREATE TABLE |
| `null value in column "senha" violates not-null constraint` | coluna NOT NULL sem valor no INSERT |
| `insert or update on table "cliente" violates foreign key constraint` | `barbeiro_id` ou `cliente_id` que não existe |
| `relation "barbeiro" already exists` | script executado de novo sem o `DROP` |
| `column "id" is ambiguous` | coluna sem o nome da tabela no JOIN |
