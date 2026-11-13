# PostgreSQL 17

Referência: https://www.postgresql.org/docs/17/

Exemplos: sistema de uma barbearia (barbeiro, cliente, agendamento). O barbeiro é o usuário do sistema: a tabela dele tem `cpf` e `senha` para o login, guardados como hash bcrypt (LGPD).

## Conceitos

Um banco relacional guarda os dados em **tabelas**. Cada tabela tem **colunas** (o tipo de informação: nome, cpf, data) e **linhas** ou **registros** (cada item cadastrado).

- **Chave primária** (`PRIMARY KEY`): coluna que identifica uma linha sem repetir. Normalmente o `id`.
- **Chave estrangeira** (`REFERENCES`): coluna que guarda o `id` de uma linha de outra tabela. É ela que cria o relacionamento (o cliente "pertence" a um barbeiro porque guarda o `barbeiro_id`).
- **SQL**: a linguagem dos comandos. `CREATE` cria estruturas, `INSERT` grava, `SELECT` consulta, `UPDATE` altera e `DELETE` apaga.

Comandos SQL terminam com `;`. Textos e datas ficam entre aspas simples (`'Ana'`); números não (`3`). Comentário de linha: `--`.

## Tipos de dados comuns

| Tipo | Uso |
|---|---|
| `SERIAL` | inteiro que aumenta sozinho (1, 2, 3...), usado no `id` |
| `INTEGER` / `INT` | número inteiro, usado nas chaves estrangeiras |
| `NUMERIC(10,2)` | número com casas decimais (10 dígitos, 2 depois da vírgula) |
| `VARCHAR(n)` | texto de até n caracteres (hash bcrypt: 60 caracteres, por isso `VARCHAR(255)` em cpf e senha) |
| `TEXT` | texto sem limite |
| `DATE` | data (`'2026-12-20'`) |
| `TIMESTAMP` | data e hora (`'2026-12-20 14:30:00'`) |
| `BOOLEAN` | `TRUE` ou `FALSE` |

Datas seguem o formato ano-mês-dia. Em `TIMESTAMP`, a hora vem depois de um espaço (ou de um `T`: `'2026-12-20T14:30'`).

## Restrições (constraints)

Regras escritas junto da coluna, no `CREATE TABLE`. O banco recusa qualquer INSERT ou UPDATE que quebre a regra.

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

No pgAdmin, os comandos seguintes rodam no Query Tool aberto **dentro** do banco criado (botão direito no banco > Query Tool).

## Relacionamentos

```text
barbeiro     1 ---< N  cliente        cliente.barbeiro_id     -> barbeiro.id
barbeiro     1 ---< N  agendamento    agendamento.barbeiro_id -> barbeiro.id
cliente      1 ---< N  agendamento    agendamento.cliente_id  -> cliente.id
```

Leitura: um barbeiro (1) atende vários clientes (N); cada cliente tem um barbeiro. O agendamento liga um barbeiro e um cliente em uma data, por isso tem duas chaves estrangeiras.

- A chave estrangeira fica na tabela do lado N.
- Uma tabela só pode apontar para outra que já existe: as tabelas sem chave estrangeira são criadas e populadas primeiro.

## Tabela barbeiro

Tabela sem chave estrangeira. Guarda quem acessa o sistema.

```sql
CREATE TABLE barbeiro (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL
);
```

No `INSERT`, a lista de colunas e a lista de valores ficam na mesma ordem e na mesma quantidade. O `id` não é informado: o `SERIAL` gera 1, 2, 3 na ordem em que as linhas entram. Vários registros vão em um único INSERT, separados por vírgula.

O CPF e a senha entram já como hash bcrypt (ver seção Dados criptografados); o texto original de cada um está no comentário da linha.

```sql
INSERT INTO barbeiro (nome, cpf, senha) VALUES
-- cpf 111.222.333-44 / senha senha123
('Carlos Silva', '$2b$10$MADf5EqPMWp0mXYXmrlpnewXD3fnnXD9dSrcZAKXgV3t2/ka.bq5a', '$2b$10$umkwr6hMlx8hvPp4l0AF9.h3lWdxNcXmOBjcEq8VKChX7dVm6MIu2'),
-- cpf 222.333.444-55 / senha senha456
('Ana Souza', '$2b$10$1r.JLaPtRs4uwzeVkdh/vec3UO2njeSkWh6vYUNGjiPyi95Vk1KP.', '$2b$10$9TBYUgRRq8epWcJzhBZk3eBx5tJZxyveNJBTiw6UEDhSlUoYHKw9O'),
-- cpf 333.444.555-66 / senha senha789
('Marcos Oliveira', '$2b$10$RTGnpivk7p.16j/NMG0BoetTbBVDKvqjl5wFFXQIIDX6bIvXgMyHi', '$2b$10$qL6W.fZ8mVEqIMYbtsz6zeg72o0PrQDZG2RumJq0BlRv9IOefCDSK');
```

Resultado: Carlos = id 1, Ana = id 2, Marcos = id 3.

## Dados criptografados (bcrypt)

O CPF e a senha do barbeiro são gravados como hash bcrypt (`$2b$10$...`, 60 caracteres). Quem gera o hash é a API, com a biblioteca `bcrypt` (`02_node_fastify.md`); o banco só guarda o texto.

- O hash não volta ao texto original. O login confere o texto digitado contra o hash com `bcrypt.compare`, na API.
- O mesmo texto gera um hash diferente a cada vez: colunas com hash não servem para `WHERE cpf = '...'` nem para busca com `ILIKE`.
- O CPF do cliente não é dado de acesso ao sistema e fica em texto.

Hash de um texto qualquer, no terminal do VS Code, dentro do projeto:

```bash
node -e "import('bcrypt').then(b => b.default.hash('senha123', 10)).then(console.log)"
```

## Tabela cliente

Cada cliente pertence a um barbeiro: a coluna `barbeiro_id` é a chave estrangeira.

```sql
CREATE TABLE cliente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(255) NOT NULL,
    barbeiro_id INT NOT NULL REFERENCES barbeiro(id) ON DELETE CASCADE
);
```

Leitura da chave estrangeira: `barbeiro_id INT NOT NULL REFERENCES barbeiro(id)` = número obrigatório que precisa existir na coluna `id` da tabela `barbeiro`. O tipo é `INT` porque guarda o número do `id` (o `SERIAL` também é um inteiro).

No INSERT, o `barbeiro_id` recebe o id de um barbeiro já cadastrado:

```sql
INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES
('Pedro Santos', '444.555.666-77', 3),
('Juliana Costa', '555.666.777-88', 2),
('Rafael Lima', '666.777.888-99', 1);
```

Um `barbeiro_id` que não existe (ex: 9) é recusado com erro de chave estrangeira.

## Tabela agendamento

Liga um barbeiro e um cliente em uma data e hora: duas chaves estrangeiras.

```sql
CREATE TABLE agendamento (
    id SERIAL PRIMARY KEY,
    data_hora TIMESTAMP NOT NULL,
    barbeiro_id INT NOT NULL REFERENCES barbeiro(id) ON DELETE CASCADE,
    cliente_id INT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE
);
```

```sql
INSERT INTO agendamento (data_hora, barbeiro_id, cliente_id) VALUES
('2026-11-20 14:00:00', 1, 1),
('2026-11-18 10:30:00', 2, 2),
('2026-11-19 16:00:00', 3, 3);
```

Datas em ordem diferente da ordem de cadastro deixam visível o efeito do `ORDER BY`.

## Recriar e conferir as tabelas

`DROP TABLE` apaga a tabela e os dados. Com várias tabelas no mesmo comando, o Postgres resolve a ordem das chaves estrangeiras; `IF EXISTS` evita erro quando a tabela ainda não existe. No início de um arquivo `.sql`, permite executar o arquivo mais de uma vez.

```sql
DROP TABLE IF EXISTS agendamento, cliente, barbeiro;
```

`COUNT(*)` conta linhas. Com subconsultas, a contagem de todas as tabelas sai em uma linha só:

```sql
SELECT
    (SELECT COUNT(*) FROM barbeiro)    AS barbeiros,
    (SELECT COUNT(*) FROM cliente)     AS clientes,
    (SELECT COUNT(*) FROM agendamento) AS agendamentos;
```

## SELECT

Estrutura: `SELECT colunas FROM tabela WHERE condição ORDER BY coluna;` Só `SELECT` e `FROM` são obrigatórios; as outras partes, quando usadas, seguem essa ordem.

- `*` traz todas as colunas. Listar as colunas (`id, nome`) traz só essas, na ordem escrita.
- `AS` dá um apelido para a coluna no resultado.

```sql
SELECT * FROM barbeiro;
SELECT id, nome FROM barbeiro;
SELECT nome AS barbeiro_nome FROM barbeiro;
```

## Filtros (WHERE)

`WHERE` define quais linhas entram no resultado. A condição é testada linha por linha.

| Operador | Significado | Exemplo |
|---|---|---|
| `=` | igual | `WHERE id = 1` |
| `<>` | diferente | `WHERE id <> 1` |
| `>` `<` `>=` `<=` | maior, menor... | `WHERE data_hora >= '2026-11-19'` |
| `BETWEEN a AND b` | entre dois valores (inclusive) | `WHERE id BETWEEN 1 AND 3` |
| `IN (...)` | igual a um dos valores | `WHERE barbeiro_id IN (1, 2)` |
| `AND` | as duas condições verdadeiras | `WHERE barbeiro_id = 1 AND data_hora >= '2026-11-19'` |
| `OR` | pelo menos uma verdadeira | `WHERE id = 1 OR id = 2` |

```sql
SELECT * FROM barbeiro WHERE id = 1;


-- agendamentos a partir de uma data
SELECT * FROM agendamento WHERE data_hora >= '2026-11-19';
```

## Busca por termo (LIKE / ILIKE)

`=` exige o texto idêntico. Para achar um texto que **contém** um pedaço, usa-se `LIKE` com o curinga `%`, que vale por qualquer sequência de caracteres (inclusive nenhuma).

| Padrão | Encontra |
|---|---|
| `'ana%'` | começa com "ana" (Ana Souza) |
| `'%ana'` | termina com "ana" (Juliana, Mariana) |
| `'%ana%'` | contém "ana" em qualquer posição (Ana Souza, Juliana Costa) |

`LIKE` diferencia maiúsculas de minúsculas (`'%ana%'` não acha "Ana"). `ILIKE` é igual ao `LIKE`, mas ignora essa diferença; por isso é o usado em campos de busca.

```sql
SELECT id, nome FROM barbeiro WHERE nome ILIKE '%ana%';     -- Ana Souza
SELECT * FROM cliente WHERE nome ILIKE 'j%';                -- Juliana Costa
```

Busca do mesmo termo em mais de uma coluna:

```sql
SELECT * FROM cliente WHERE nome ILIKE '%lima%' OR cpf ILIKE '%666%';
```

## Ordenação (ORDER BY)

`ORDER BY coluna` ordena o resultado. `ASC` é crescente (padrão: menor número, data mais antiga, A-Z) e `DESC` decrescente. Com mais de uma coluna, a segunda desempata a primeira.

```sql
SELECT * FROM agendamento ORDER BY data_hora;          -- mais antigo primeiro
SELECT * FROM agendamento ORDER BY data_hora DESC;     -- mais recente primeiro
SELECT * FROM barbeiro ORDER BY nome;                  -- alfabética
```

## Datas

`EXTRACT(parte FROM coluna)` tira um pedaço da data como número:

```sql
SELECT id, EXTRACT(DAY FROM data_hora)   AS dia FROM agendamento;   -- 20
SELECT id, EXTRACT(MONTH FROM data_hora) AS mes FROM agendamento;   -- 11
SELECT id, EXTRACT(YEAR FROM data_hora)  AS ano FROM agendamento;   -- 2026
```

O mesmo `EXTRACT` serve para ordenar ou filtrar por uma parte da data:

| Ordenação | ORDER BY |
|---|---|
| data e hora completas | `ORDER BY data_hora` |
| dia do mês | `ORDER BY EXTRACT(DAY FROM data_hora), data_hora` |
| mês | `ORDER BY EXTRACT(MONTH FROM data_hora), data_hora` |
| ano | `ORDER BY EXTRACT(YEAR FROM data_hora), data_hora` |

```sql
SELECT * FROM agendamento WHERE EXTRACT(MONTH FROM data_hora) = 11;   -- só novembro
```

`TO_CHAR(coluna, 'formato')` transforma a data em texto no formato desejado:

| Código | Significado |
|---|---|
| `DD` | dia (01-31) |
| `MM` | mês (01-12) |
| `YYYY` | ano |
| `HH24` | hora (00-23) |
| `MI` | minuto |

```sql
SELECT id, TO_CHAR(data_hora, 'DD/MM/YYYY HH24:MI') AS data_formatada FROM agendamento;   -- 20/11/2026 14:00
```

## JOIN

A tabela `agendamento` guarda só números (`barbeiro_id`, `cliente_id`). Para mostrar os nomes, as tabelas são juntadas pela chave estrangeira.

Estrutura: `FROM tabela_com_fk INNER JOIN tabela_referenciada ON tabela_com_fk.coluna_fk = tabela_referenciada.id`

- `INNER JOIN` traz só as linhas que têm par nas duas tabelas. `LEFT JOIN` traz todas as linhas da primeira, mesmo sem par.
- Com colunas de mesmo nome em tabelas diferentes (`id`, `nome`, `cpf`), escreve-se `tabela.coluna`. Sem isso o banco responde `column reference "id" is ambiguous`.
- Cada coluna repetida recebe um apelido com `AS`, senão uma sobrescreve a outra no resultado.
- `WHERE` e `ORDER BY` vêm depois dos `JOIN`.

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

`cliente.*` traz todas as colunas do cliente: `SELECT cliente.*, barbeiro.nome AS barbeiro_nome ...`

### Três tabelas: agendamento com os dados do barbeiro e do cliente, ordenado por data

Um `INNER JOIN` para cada tabela referenciada.

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

O CPF e a senha do barbeiro ficam fora: são hash.

### JOIN com filtro

```sql
SELECT agendamento.data_hora, cliente.nome AS cliente_nome
FROM agendamento
INNER JOIN cliente ON agendamento.cliente_id = cliente.id
WHERE agendamento.barbeiro_id = 1
ORDER BY agendamento.data_hora;
```

## UPDATE

`UPDATE tabela SET coluna = valor WHERE condição;` Várias colunas no mesmo comando ficam separadas por vírgula. O `WHERE` escolhe as linhas alteradas: **sem `WHERE`, todas as linhas da tabela mudam**.

```sql
UPDATE barbeiro SET nome = 'Carlos Silva Souza' WHERE id = 1;
UPDATE cliente SET nome = 'Pedro S.', barbeiro_id = 2 WHERE id = 1;
UPDATE agendamento SET data_hora = '2026-12-01 09:00:00' WHERE id = 1;
```

## DELETE

`DELETE FROM tabela WHERE condição;` **Sem `WHERE`, todas as linhas são apagadas.**

```sql
DELETE FROM agendamento WHERE id = 3;
DELETE FROM barbeiro WHERE id = 1;
```

Com `ON DELETE CASCADE`, apagar o barbeiro 1 apaga também os clientes e os agendamentos ligados a ele. Sem o `CASCADE`, o banco recusaria o DELETE enquanto houvesse linhas apontando para esse barbeiro.

## Erros comuns

| Mensagem | Causa |
|---|---|
| `relation "x" does not exist` | a tabela não existe ou o Query Tool está aberto em outro banco |
| `relation "x" already exists` | a tabela já foi criada; use `DROP TABLE IF EXISTS` antes |
| `syntax error at or near "x"` | vírgula, parêntese ou aspas faltando perto da palavra indicada |
| `null value in column "x" violates not-null constraint` | coluna `NOT NULL` sem valor no INSERT |
| `violates foreign key constraint` | o id informado na chave estrangeira não existe na outra tabela |
| `column reference "id" is ambiguous` | coluna com o mesmo nome em duas tabelas do JOIN; use `tabela.coluna` |
| `INSERT has more expressions than target columns` | quantidade de valores diferente da quantidade de colunas |
| `value too long for type character varying(n)` | o texto é maior que o tamanho da coluna |

## pgAdmin 4

Referência: https://www.pgadmin.org/docs/pgadmin4/latest/

- **Query Tool**: botão direito no banco > Query Tool. Executa com F5. Com um trecho selecionado, executa só o trecho.
- **Ver dados**: botão direito na tabela (Schemas > public > Tables) > View/Edit Data > All Rows.
- **ERD Tool**: botão direito no banco > ERD For Database (em algumas versões, Generate ERD). Mostra as tabelas e as chaves estrangeiras. O botão **Download image** exporta o diagrama como imagem (`der.png`).
- **Backup**: botão direito no banco > Backup. Com o formato "Plain" gera um arquivo `.sql`.
