# Banco de dados com PostgreSQL: criar tabelas, inserir, consultar e juntar

```sql
//
// Os exemplos deste arquivo usam o sistema da barbearia: barbeiros, clientes e agendamentos.
//
// As linhas "// >>> sql" e "// <<<" só marcam onde o código começa e termina.
// Não copie essas linhas, copie só o que está entre elas.
```

## O que é um banco de dados relacional

```sql
Um banco de dados relacional é organizado em tabelas conectadas entre si por chaves (IDs).

- Tabela: é como uma aba de planilha (ex: tabela "barbeiro", tabela "cliente", tabela "agendamento").
- Coluna (campo): define o tipo de informação guardada (ex: nome, cpf, senha, data_hora).
- Linha (registro): é um dado cadastrado (ex: a linha 1 da tabela barbeiro é o barbeiro "Carlos Silva").

O SQL (Structured Query Language) é a linguagem que usamos para criar tabelas, inserir, consultar, atualizar e apagar
registros no PostgreSQL, pelo pgAdmin.
```

## Passo 1: criar o banco e abrir o editor de comandos

```sql
No pgAdmin:
1. Clique com o botão direito em Databases > Create > Database, com o nome saep_db.
   (ou, no Query Tool de qualquer banco, rode:   CREATE DATABASE saep_db;)
2. Clique com o botão direito no banco saep_db > Query Tool.
3. Tudo que você digitar dali em diante roda DENTRO do saep_db. Execute com F5 (ou o botão de play).

Se criar as tabelas no banco errado (por exemplo o "postgres"), a API depois não vai encontrá-las.
```

## Passo 2: tipos de dados mais usados

```sql
- SERIAL: número inteiro sequencial automático (1, 2, 3...). Usado na chave primária (id).
- VARCHAR(100): texto com limite de caracteres. Ideal para nomes, CPF, senhas e telefones.
- TEXT: texto longo, sem limite. Ideal para observações e descrições.
- INT: número inteiro. Toda chave estrangeira é INT.
- TIMESTAMP: data e hora juntas (ex: 2026-11-18 14:30:00).
- BOOLEAN: verdadeiro ou falso (true/false).

IMPORTANTE (criptografia): quando a senha e o CPF forem criptografados (bcrypt), o valor guardado deixa de ser
"senha123" e vira um hash de 60 caracteres, algo como $2b$10$Q3x9... Por isso as colunas que vão receber hash
(cpf e senha de quem tem dado criptografado) devem ser VARCHAR(255). Em VARCHAR(20) o hash não cabe e o banco
responde "value too long for type character varying(20)".
```

## Passo 3: regras das colunas (constraints)

```sql
- PRIMARY KEY: identificador único da linha. Não repete e não pode ser nulo.
- NOT NULL: a coluna é obrigatória. Se você esquecer de preenchê-la no INSERT, o banco dá erro.
- UNIQUE: não deixa existir dois registros com o mesmo valor. Não usamos no CPF do barbeiro: ele vai ser criptografado
  com bcrypt, e o mesmo CPF vira um hash diferente a cada vez, então o UNIQUE não teria efeito.
- REFERENCES tabela(id): cria a chave estrangeira (FK), ligando este registro ao id de outra tabela.
- ON DELETE CASCADE: se o registro "pai" for apagado, os "filhos" ligados a ele são apagados juntos.
  Sem isso, apagar um pai que tem filhos dá erro de chave estrangeira.
```

## Passo 4: modelar antes de criar (quem depende de quem)

```sql
Pergunta para cada tabela: "ela precisa de outra para existir?"

    barbeiro  ---<  cliente       (um cliente é atendido por um barbeiro; um barbeiro tem vários clientes)
    barbeiro  ---<  agendamento   (um agendamento é com um barbeiro)
    cliente   ---<  agendamento   (um agendamento é de um cliente)

- A tabela que fica do lado "muitos" (cliente, agendamento) leva a chave estrangeira (barbeiro_id, cliente_id).
- A tabela que só tem relacionamento (agendamento liga barbeiro e cliente) leva DUAS chaves estrangeiras.
- Crie primeiro quem NÃO depende de ninguém (barbeiro), depois quem depende só dele (cliente),
  e por último quem depende dos dois (agendamento). Criar fora de ordem dá erro.

Isto é o que o DER vai mostrar: as tabelas e as setas das chaves estrangeiras.
```

## Passo 5: criar as tabelas (CREATE TABLE)

```sql
1. Tabela base: barbeiro (não depende de nenhuma outra). É quem faz login no sistema, com cpf e senha.

// >>> sql
CREATE TABLE barbeiro (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL
);
// <<<

2. Tabela secundária: cliente (cada cliente pertence a um barbeiro).

// >>> sql
CREATE TABLE cliente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(255) NOT NULL,
    barbeiro_id INT NOT NULL REFERENCES barbeiro(id) ON DELETE CASCADE
);
// <<<

3. Tabela de relacionamento: agendamento (vincula barbeiro e cliente em uma data).

// >>> sql
CREATE TABLE agendamento (
    id SERIAL PRIMARY KEY,
    data_hora TIMESTAMP NOT NULL,
    barbeiro_id INT NOT NULL REFERENCES barbeiro(id) ON DELETE CASCADE,
    cliente_id INT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE
);
// <<<

// Como ler uma chave estrangeira:   barbeiro_id INT NOT NULL REFERENCES barbeiro(id)
//   barbeiro_id = nome da coluna nesta tabela
//   INT         = mesmo tipo do id da outra tabela
//   NOT NULL    = obrigatório (todo cliente TEM que ter um barbeiro)
//   REFERENCES barbeiro(id) = "o valor tem que existir na coluna id da tabela barbeiro"
```

## Passo 6: inserir os dados (INSERT) - mínimo 3 registros em TODAS as tabelas

```sql
É obrigatório ter no mínimo 3 registros em TODAS as tabelas criadas, na mesma ordem em que foram criadas
(as chaves estrangeiras só podem apontar para registros que já existem).

Regras do INSERT:
- A lista de colunas entre parênteses e os valores têm que estar na MESMA ordem e na MESMA quantidade.
- Toda coluna NOT NULL (sem valor padrão) precisa estar na lista. O id (SERIAL) não precisa.
- O nome da tabela é o mesmo do CREATE TABLE: se você criou "agendamento", é INSERT INTO agendamento (e não "agendamentos").
- Texto e data vão entre aspas simples.

// >>> sql
INSERT INTO barbeiro (nome, cpf, senha) VALUES
('Carlos Silva', '111.222.333-44', 'senha123'),
('Ana Souza', '222.333.444-55', 'senha456'),
('Marcos Oliveira', '333.444.555-66', 'senha789');
// <<<

Os ids foram gerados sozinhos: Carlos = 1, Ana = 2, Marcos = 3. As próximas tabelas apontam para esses números.

// >>> sql
INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES
('Pedro Santos', '444.555.666-77', 3),
('Juliana Costa', '555.666.777-88', 2),
('Rafael Lima', '666.777.888-99', 1);
// <<<

// >>> sql
INSERT INTO agendamento (data_hora, barbeiro_id, cliente_id) VALUES
('2026-11-20 14:00:00', 1, 1),
('2026-11-18 10:30:00', 2, 2),
('2026-11-19 16:00:00', 3, 3);
// <<<

// Dica: use datas DIFERENTES e fora de ordem. Assim, quando você ordenar por data, dá para ver a ordenação funcionando.
// Dica: o barbeiro_id e o cliente_id precisam existir (1, 2 ou 3 neste exemplo). Um 9 daria erro de chave estrangeira.

Conferindo se ficou 3 em cada tabela. Esta consulta mostra a contagem das três de uma vez:

// >>> sql
SELECT 'barbeiro' AS tabela, COUNT(*) AS registros FROM barbeiro
UNION ALL
SELECT 'cliente', COUNT(*) FROM cliente
UNION ALL
SELECT 'agendamento', COUNT(*) FROM agendamento;
// <<<
```

## Passo 7: consultar os dados (SELECT)

```sql
// >>> sql
-- Todos os campos de todos os barbeiros (* = todas as colunas)
SELECT * FROM barbeiro;

-- Só algumas colunas
SELECT id, nome FROM barbeiro;

-- Filtrando por id
SELECT * FROM barbeiro WHERE id = 1;

-- Filtrando por CPF (funciona com o CPF do cliente, que fica em texto; o do barbeiro vai estar criptografado)
SELECT * FROM cliente WHERE cpf = '444.555.666-77';

-- Ordenando: ASC = do menor para o maior, DESC = do maior para o menor
SELECT * FROM agendamento ORDER BY data_hora ASC;
SELECT * FROM agendamento ORDER BY data_hora DESC;
// <<<
```

## Passo 8: busca por termo (ILIKE e %)

```sql
A busca pede um termo digitado pelo usuário e devolve só os registros que combinam.

// >>> sql
-- ILIKE ignora maiúsculas e minúsculas. O % vale por "qualquer texto antes ou depois".
SELECT id, nome FROM barbeiro WHERE nome ILIKE '%ana%';

-- Buscando o termo em mais de uma coluna com OR
SELECT * FROM cliente WHERE nome ILIKE '%ra%' OR cpf ILIKE '%444%' ORDER BY id;
// <<<

// - '%ana%' acha "Juliana", "Ana Souza", "Mariana"... (qualquer nome que tenha "ana" dentro).
// - LIKE comum diferencia maiúscula de minúscula; ILIKE não.
// - Na API (documentação API.md, seção Busca por termo) o termo vem da URL e entra no lugar do texto fixo.
// - Colunas que guardam HASH (cpf do barbeiro, senha) não servem para busca: o hash não se parece com o texto original.
```

## Passo 9: juntar tabelas (INNER JOIN)

```sql
A tabela agendamento só guarda números (barbeiro_id e cliente_id). Para mostrar os NOMES, juntamos as tabelas
usando a chave estrangeira. O INNER JOIN traz só os registros que têm correspondência nas duas tabelas.

Receita:   FROM tabela_com_FK   INNER JOIN tabela_pai ON tabela_com_FK.coluna_fk = tabela_pai.id

1) JOIN simples entre 2 tabelas (cliente + barbeiro responsável):

// >>> sql
SELECT
    cliente.id AS id_cliente,
    cliente.nome AS nome_cliente,
    cliente.cpf AS cpf_cliente,
    barbeiro.nome AS barbeiro_responsavel
FROM cliente
INNER JOIN barbeiro ON cliente.barbeiro_id = barbeiro.id;
// <<<

2) JOIN triplo entre 3 tabelas, ordenado por data (agendamento + barbeiro + cliente):

// >>> sql
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
// <<<

3) JOIN com filtro (só os agendamentos de um barbeiro):

// >>> sql
SELECT agendamento.id, agendamento.data_hora, cliente.nome AS cliente
FROM agendamento
INNER JOIN cliente ON agendamento.cliente_id = cliente.id
WHERE agendamento.barbeiro_id = 1;
// <<<

// Pontos para entender:
// - AS dá um apelido à coluna. Sem ele, barbeiro.nome e cliente.nome viram duas colunas chamadas "nome" e se confundem.
// - Escreva sempre tabela.coluna (agendamento.id, barbeiro.nome). Só "id" daria erro: duas tabelas têm a coluna id.
// - O cpf mostrado é o do CLIENTE. O cpf do barbeiro fica criptografado e não aparece nas listagens.
// - O ORDER BY vem por último, depois dos JOIN.
// - Esta consulta de 3 tabelas serve para listar os agendamentos de uma tela (ordenada por data).
```

## Passo 10: alterar dados (UPDATE)

```sql
// ATENÇÃO: nunca rode UPDATE sem WHERE. Sem WHERE, TODAS as linhas da tabela são alteradas.

// >>> sql
-- Mudando só a data de um agendamento (é o "atualizar a data do agendamento" da tela)
UPDATE agendamento SET data_hora = '2026-11-25 09:00:00' WHERE id = 1;

-- Mudando mais de uma coluna de uma vez
UPDATE cliente SET nome = 'Pedro Santos Lima', barbeiro_id = 2 WHERE id = 1;
// <<<

// Depois de um UPDATE, rode um SELECT para conferir.
```

## Passo 11: apagar dados (DELETE) e o efeito do ON DELETE CASCADE

```sql
// ATENÇÃO: nunca rode DELETE sem WHERE. Sem WHERE, TODAS as linhas da tabela são apagadas.

// >>> sql
DELETE FROM barbeiro WHERE id = 3;
// <<<

// Por causa do ON DELETE CASCADE, o cliente e o agendamento ligados ao barbeiro 3 também foram apagados
// (o cliente Pedro Santos era do barbeiro 3, e o agendamento 3 era com esse barbeiro).
// Confira com a mesma consulta de contagem do passo 6.
//
// Sem o ON DELETE CASCADE o resultado seria um erro:
//   update or delete on table "barbeiro" violates foreign key constraint
// porque o barbeiro ainda teria clientes e agendamentos apontando para ele.
// Isso importa quando uma tela tem o botão excluir e o registro já está ligado a outras tabelas.
```

## Passo 12: salvando o script saep_db.sql

```sql
O que fica guardado é o ARQUIVO saep_db.sql, não só os comandos que você rodou no pgAdmin.
1. Escreva os CREATE TABLE e depois os INSERT no arquivo saep_db.sql (da raiz do projeto, no VS Code).
   A ordem do arquivo é a mesma dos passos 5 e 6: todos os CREATE e depois todos os INSERT.
2. Para testar: copie o conteúdo para o Query Tool do pgAdmin, DENTRO do banco saep_db, e execute.
3. Teste o script do zero: apague as tabelas e rode de novo. Todas no mesmo DROP, o Postgres apaga na ordem certa:

// >>> sql
DROP TABLE IF EXISTS agendamento, cliente, barbeiro;
// <<<

// (use os nomes das SUAS tabelas). Dica: coloque esse DROP no começo do saep_db.sql, assim o script pode ser rodado
// quantas vezes você quiser. Sem ele, rodar duas vezes dá "relation already exists".

Banco: o script roda DENTRO do saep_db (Query Tool aberto no banco saep_db).
```

## Passo 13: gerando o DER no pgAdmin (der.png)

```sql
1. No pgAdmin, depois de criar as tabelas, clique com o botão direito no banco (saep_db).
2. Escolha "ERD For Database" (em algumas versões o nome é "Generate ERD").
3. O diagrama mostra as tabelas e as setas das chaves estrangeiras. Confira se TODAS as tabelas aparecem
   e se cada seta liga a tabela certa (cliente > barbeiro, agendamento > barbeiro e cliente).
4. Na barra do diagrama use o ícone de imagem ("Download image") e salve como PNG.
5. Renomeie para der.png e coloque na raiz do projeto (pode ser der.png ou der.pdf).
```

## Conferência final

```sql
[ ] cada relacionamento tem sua chave estrangeira (REFERENCES) e as tabelas foram criadas na ordem certa
[ ] TODAS as tabelas têm pelo menos 3 registros, conferido com a consulta de contagem
[ ] der.png mostra todas as tabelas e as ligações
[ ] o arquivo saep_db.sql roda inteiro, do zero, sem nenhum erro
```

## Erros comuns

```sql
- relation "agendamentos" does not exist: o nome da tabela no INSERT é diferente do nome do CREATE TABLE
  (plural a mais ou a menos). Copie o nome exatamente como criou.
- null value in column "senha" violates not-null constraint: faltou a coluna senha na lista do INSERT (ou o valor).
  Toda coluna NOT NULL precisa receber um valor.
- insert or update on table "cliente" violates foreign key constraint: o barbeiro_id (ou cliente_id) apontado não existe.
  Confira os ids com SELECT * FROM barbeiro.
- Os INSERT de uma tabela falham em cascata: se barbeiro não foi populado, cliente e agendamento também falham,
  pois dependem dele. Corrija o primeiro erro e rode de novo do zero.
- value too long for type character varying(20): a coluna é pequena demais para o hash. Use VARCHAR(255).
- relation "barbeiro" already exists / duplicate key value violates unique constraint: o script foi rodado duas vezes.
  Rode o DROP TABLE do passo 12 e depois o script de novo.
- column "id" is ambiguous: no JOIN, escreva tabela.coluna.
- As tabelas foram criadas no banco errado: confira no pgAdmin qual banco está selecionado antes de abrir o Query Tool.
```
