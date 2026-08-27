classDiagram

class Usuario {
    id
    nome
    email
    status
}

class Aluno {
    id
}

class Professor {
    id
}

class Administrador {
    id
}

class Laboratorio {
    id
    nome
    localizacao
    capacidade
    status
}

class Reserva {
    id
    inicio
    fim
    status
}

class Equipamento {
    id
    nome
    descricao
    quantidade
    status
}

class ReservaEquipamento {
    quantidade
}

class RelatoProblema {
    id
    descricao
    data
    status
}

class Devolucao {
    id
    data
    observacao
}

Usuario <|-- Aluno
Usuario <|-- Professor
Usuario <|-- Administrador

Usuario "1" --> "N" Reserva
Laboratorio "1" --> "N" Reserva

Professor "1" --> "N" Laboratorio : responsavel

Laboratorio "1" --> "N" Equipamento

Reserva "1" --> "N" ReservaEquipamento
Equipamento "1" --> "N" ReservaEquipamento

Reserva "1" --> "0..1" Devolucao

Usuario "1" --> "N" RelatoProblema
Laboratorio "1" --> "N" RelatoProblema
Equipamento "0..1" --> "N" RelatoProblema