# PostgreSQL 17

Referência: https://www.postgresql.org/docs/17/

Exemplos: sistema de uma barbearia (barbeiro, cliente, agendamento). O barbeiro é o usuário do sistema: a tabela dele tem `cpf` e `senha` para o login, guardados como hash bcrypt (LGPD).

## Tipos de dados comuns

| Tipo | Uso |
|---|---|
| `SERIAL` | inteiro que aumenta sozinho (1, 2, 3...), usado no `id` |
| `INTEGER` / `INT` | número inteiro, usado nas chaves estrangeiras |
| `NUMERIC(10,2)` | número com casas decimais |
| `VARCHAR(n)` | texto de até n caracteres (hash bcrypt: 60 caracteres, por isso `VARCHAR(255)` em cpf e senha) |
| `TEXT` | texto sem limite |
| `DATE` | data (`'2026-12-20'`) |
| `TIMESTAMP` | data e hora (`'2026-12-20 14:30:00'`) |
| `BOOLEAN` | `TRUE` ou `FALSE` |

## Restrições (constraints)

| Restrição | Efeito |
|---|---|
| `PRIMARY KEY` | identifica cada linha; não repete e não fica vazia |
| `NOT NULL` | a coluna não pode ficar vazia |
| `REFERENCES tabela(coluna)` | chave estrangeira: o valor precisa existir na outra tabela |
| `ON DELETE CASCADE` | ao apagar a linha referenciada, apaga também as que apontam para ela |
| `DEFAULT valor` | valor usado quando nada é informado |

## Banco

```sql
CREATE DATABASE saep_db;
```

No pgAdmin, os comandos seguintes rodam no Query Tool aberto **dentro** do banco criado.

## Relacionamentos do exemplo

```text
barbeiro     1 ---< N  cliente        cliente.barbeiro_id     -> barbeiro.id
barbeiro     1 ---< N  agendamento    agendamento.barbeiro_id -> barbeiro.id
cliente      1 ---< N  agendamento    agendamento.cliente_id  -> cliente.id
```

A chave estrangeira fica na tabela do lado N. A tabela referenciada precisa existir antes da tabela que tem a chave estrangeira.

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

Leitura de uma chave estrangeira: `barbeiro_id INT NOT NULL REFERENCES barbeiro(id)` = número obrigatório que precisa existir na coluna `id` da tabela `barbeiro`.

Apagar as tabelas (todas no mesmo comando, o Postgres resolve a ordem):

```sql
DROP TABLE IF EXISTS agendamento, cliente, barbeiro;
```

## INSERT

A coluna `SERIAL` não é informada: o banco gera o valor (1, 2, 3, na ordem do INSERT).

```sql
INSERT INTO barbeiro (nome, cpf, senha) VALUES
-- cpf 111.222.333-44 / senha senha123
('Carlos Silva', '$2b$10$MADf5EqPMWp0mXYXmrlpnewXD3fnnXD9dSrcZAKXgV3t2/ka.bq5a', '$2b$10$umkwr6hMlx8hvPp4l0AF9.h3lWdxNcXmOBjcEq8VKChX7dVm6MIu2'),
-- cpf 222.333.444-55 / senha senha456
('Ana Souza', '$2b$10$1r.JLaPtRs4uwzeVkdh/vec3UO2njeSkWh6vYUNGjiPyi95Vk1KP.', '$2b$10$9TBYUgRRq8epWcJzhBZk3eBx5tJZxyveNJBTiw6UEDhSlUoYHKw9O'),
-- cpf 333.444.555-66 / senha senha789
('Marcos Oliveira', '$2b$10$RTGnpivk7p.16j/NMG0BoetTbBVDKvqjl5wFFXQIIDX6bIvXgMyHi', '$2b$10$qL6W.fZ8mVEqIMYbtsz6zeg72o0PrQDZG2RumJq0BlRv9IOefCDSK');

INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES
('Pedro Santos', '444.555.666-77', 3),
('Juliana Costa', '555.666.777-88', 2),
('Rafael Lima', '666.777.888-99', 1);

INSERT INTO agendamento (data_hora, barbeiro_id, cliente_id) VALUES
('2026-11-20 14:00:00', 1, 1),
('2026-11-18 10:30:00', 2, 2),
('2026-11-19 16:00:00', 3, 3);
```

O `barbeiro_id` e o `cliente_id` precisam ser ids que já existem nas tabelas referenciadas.

## Dados criptografados (bcrypt)

O CPF e a senha do barbeiro são gravados como hash bcrypt (`$2b$10$...`, 60 caracteres). Quem gera o hash é a API, com a biblioteca `bcrypt` (`02_node_fastify.md`); o banco só guarda o texto.

- O hash não volta ao texto original. O login confere o texto digitado contra o hash com `bcrypt.compare`, na API.
- O mesmo texto gera um hash diferente a cada vez: colunas com hash não servem para `WHERE cpf = '...'` nem para busca com `ILIKE`.
- Os registros do script já entram com o hash pronto (os valores originais estão no comentário de cada linha).

Hash de um texto qualquer, no terminal do VS Code, dentro do projeto:

```bash
node -e "import('bcrypt').then(b => b.default.hash('senha123', 10)).then(console.log)"
```

Contagem de registros de todas as tabelas em uma consulta:

```sql
SELECT
    (SELECT COUNT(*) FROM barbeiro)    AS barbeiros,
    (SELECT COUNT(*) FROM cliente)     AS clientes,
    (SELECT COUNT(*) FROM agendamento) AS agendamentos;
```

## SELECT

```sql
SELECT * FROM barbeiro;
SELECT id, nome FROM barbeiro WHERE id = 1;
```

### Busca por termo (LIKE / ILIKE)

`%` representa qualquer sequência de caracteres. `ILIKE` ignora maiúsculas e minúsculas; `LIKE` não.

```sql
SELECT id, nome FROM barbeiro WHERE nome ILIKE '%ana%';        -- Ana Souza
SELECT * FROM cliente WHERE nome ILIKE 'j%';                   -- começa com j
SELECT * FROM cliente WHERE nome ILIKE '%lima%' OR cpf ILIKE '%666%';   -- mais de uma coluna
```

### Ordenação (ORDER BY)

`ASC` crescente (padrão), `DESC` decrescente.

| Ordenação | ORDER BY |
|---|---|
| data e hora completas | `ORDER BY data_hora` |
| dia do mês | `ORDER BY EXTRACT(DAY FROM data_hora), data_hora` |
| mês | `ORDER BY EXTRACT(MONTH FROM data_hora), data_hora` |
| ano | `ORDER BY EXTRACT(YEAR FROM data_hora), data_hora` |

O `data_hora` depois da vírgula desempata registros com o mesmo dia, mês ou ano.

### Partes e formato de uma data

```sql
SELECT id, EXTRACT(DAY FROM data_hora)   AS dia FROM agendamento;
SELECT id, EXTRACT(MONTH FROM data_hora) AS mes FROM agendamento;
SELECT id, EXTRACT(YEAR FROM data_hora)  AS ano FROM agendamento;

SELECT id, TO_CHAR(data_hora, 'DD/MM/YYYY HH24:MI') AS data_formatada FROM agendamento;   -- 20/11/2026 14:00
```

## JOIN

`INNER JOIN` junta linhas de tabelas onde a condição do `ON` é verdadeira. A condição liga a chave estrangeira à chave primária.

### Duas tabelas: cliente com o nome do barbeiro

```sql
SELECT
    cliente.id,
    cliente.nome,
    cliente.cpf,
    barbeiro.nome AS barbeiro_nome
FROM cliente
INNER JOIN barbeiro ON cliente.barbeiro_id = barbeiro.id
ORDER BY cliente.id;
```

| id | nome | cpf | barbeiro_nome |
|---|---|---|---|
| 1 | Pedro Santos | 444.555.666-77 | Marcos Oliveira |
| 2 | Juliana Costa | 555.666.777-88 | Ana Souza |
| 3 | Rafael Lima | 666.777.888-99 | Carlos Silva |

### Três tabelas: agendamento com os dados do barbeiro e do cliente, ordenado por data

```sql
SELECT
    agendamento.id,
    agendamento.data_hora,
    TO_CHAR(agendamento.data_hora, 'DD/MM/YYYY HH24:MI') AS data_formatada,
    barbeiro.id   AS barbeiro_id,
    barbeiro.nome AS barbeiro_nome,
    cliente.id    AS cliente_id,
    cliente.nome  AS cliente_nome,
    cliente.cpf   AS cliente_cpf
FROM agendamento
INNER JOIN barbeiro ON agendamento.barbeiro_id = barbeiro.id
INNER JOIN cliente  ON agendamento.cliente_id  = cliente.id
ORDER BY agendamento.data_hora ASC;
```

| id | data_formatada | barbeiro_nome | cliente_nome | cliente_cpf |
|---|---|---|---|---|
| 2 | 18/11/2026 10:30 | Ana Souza | Juliana Costa | 555.666.777-88 |
| 3 | 19/11/2026 16:00 | Marcos Oliveira | Rafael Lima | 666.777.888-99 |
| 1 | 20/11/2026 14:00 | Carlos Silva | Pedro Santos | 444.555.666-77 |

Observações:
- Quando duas tabelas têm colunas com o mesmo nome (`id`, `nome`, `cpf`), escreva `tabela.coluna` e dê um apelido com `AS`. Sem apelido, uma coluna sobrescreve a outra no resultado.
- `ORDER BY` vem depois dos `JOIN`.
- O CPF e a senha do barbeiro ficam fora das listagens: são hash.
- `INNER JOIN` só traz linhas que têm par nas duas tabelas. `LEFT JOIN` traz todas as linhas da primeira tabela, mesmo sem par.

## UPDATE e DELETE

```sql
UPDATE barbeiro SET nome = 'Carlos Silva Souza' WHERE id = 1;
UPDATE cliente SET nome = 'Pedro S.', barbeiro_id = 2 WHERE id = 1;
UPDATE agendamento SET data_hora = '2026-12-01 09:00:00' WHERE id = 1;

DELETE FROM agendamento WHERE id = 3;
DELETE FROM barbeiro WHERE id = 1;     -- com ON DELETE CASCADE, apaga também seus clientes e agendamentos
```

Sem `WHERE`, o comando altera ou apaga todas as linhas da tabela.

## Script de criação e população (saep_db.sql)

Executado no Query Tool do banco `saep_db`. O `DROP` inicial permite executar o script mais de uma vez.

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
-- cpf 111.222.333-44 / senha senha123
('Carlos Silva', '$2b$10$MADf5EqPMWp0mXYXmrlpnewXD3fnnXD9dSrcZAKXgV3t2/ka.bq5a', '$2b$10$umkwr6hMlx8hvPp4l0AF9.h3lWdxNcXmOBjcEq8VKChX7dVm6MIu2'),
-- cpf 222.333.444-55 / senha senha456
('Ana Souza', '$2b$10$1r.JLaPtRs4uwzeVkdh/vec3UO2njeSkWh6vYUNGjiPyi95Vk1KP.', '$2b$10$9TBYUgRRq8epWcJzhBZk3eBx5tJZxyveNJBTiw6UEDhSlUoYHKw9O'),
-- cpf 333.444.555-66 / senha senha789
('Marcos Oliveira', '$2b$10$RTGnpivk7p.16j/NMG0BoetTbBVDKvqjl5wFFXQIIDX6bIvXgMyHi', '$2b$10$qL6W.fZ8mVEqIMYbtsz6zeg72o0PrQDZG2RumJq0BlRv9IOefCDSK');

INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES
('Pedro Santos', '444.555.666-77', 3),
('Juliana Costa', '555.666.777-88', 2),
('Rafael Lima', '666.777.888-99', 1);

INSERT INTO agendamento (data_hora, barbeiro_id, cliente_id) VALUES
('2026-11-20 14:00:00', 1, 1),
('2026-11-18 10:30:00', 2, 2),
('2026-11-19 16:00:00', 3, 3);
```

## Erros comuns

| Mensagem | Causa |
|---|---|
| `relation "x" does not exist` | a tabela não existe ou o Query Tool está aberto em outro banco |
| `relation "x" already exists` | a tabela já foi criada; use `DROP TABLE IF EXISTS` antes |
| `null value in column "x" violates not-null constraint` | coluna `NOT NULL` sem valor no INSERT |
| `violates foreign key constraint` | o id informado na chave estrangeira não existe na outra tabela |
| `column reference "id" is ambiguous` | coluna com o mesmo nome em duas tabelas do JOIN; use `tabela.coluna` |
| `value too long for type character varying(n)` | o texto é maior que o tamanho da coluna |

## pgAdmin 4

Referência: https://www.pgadmin.org/docs/pgadmin4/latest/

- **Query Tool**: botão direito no banco > Query Tool. Executa com F5.
- **ERD Tool**: botão direito no banco > ERD For Database (em algumas versões, Generate ERD). Mostra as tabelas e as chaves estrangeiras. O botão **Download image** exporta o diagrama como imagem (`der.png`).
- **Backup**: botão direito no banco > Backup. Com o formato "Plain" gera um arquivo `.sql`.
