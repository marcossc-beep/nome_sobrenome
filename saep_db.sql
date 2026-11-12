CREATE TABLE barbeiro (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

CREATE TABLE cliente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(255) NOT NULL UNIQUE,
    barbeiro_id INT NOT NULL REFERENCES barbeiro(id) ON DELETE CASCADE
);

CREATE TABLE agendamento (
    id SERIAL PRIMARY KEY,
    data_hora TIMESTAMP NOT NULL,
    barbeiro_id INT NOT NULL REFERENCES barbeiro(id) ON DELETE CASCADE,
    cliente_id INT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE
);

INSERT INTO barbeiro (nome, cpf, senha) VALUES
('GABRIEL', '444.555.666-77', 'senha123'),
('HELENA', '555.666.777-88', 'senha456'),
('ERIKA', '666.777.888-99', 'senha789');

SELECT * FROM barbeiro

INSERT INTO cliente (nome, cpf, barbeiro_id) VALUES
('ricardo', '23455678943', 1),
('fred', '1234567890', 2),
('joao pires', '123456764453', 3);

INSERT INTO agendamento (data_hora, barbeiro_id, cliente_id) VALUES
('2026-12-10 14:00:00', 1, 1),
('2026-12-08 09:30:00', 2, 2),
('2026-12-09 16:00:00', 3, 3);


