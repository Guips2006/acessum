```mermaid
classDiagram

    %% =========================
    %% USUARIOS
    %% =========================

    class Usuario {
        +UUID id
        +String nome
        +String email
        +String cpf
        +String rg
        +Date dataNascimento
        +String avatarUrl
        +DateTime ultimaAtividade
        +DateTime suspensaoAte
        +Boolean deveTrocarSenha
        +StatusUsuario status
        +ativar()
        +desativar()
    }

    class Aluno {
        +String matricula
    }

    class Professor {
        +String registro
    }

    class Administrador {
    }

    Usuario <|-- Aluno
    Usuario <|-- Professor
    Usuario <|-- Administrador


    %% =========================
    %% LABORATORIO
    %% =========================

    class Laboratorio {
        +UUID id
        +String nome
        +String localizacao
        +Integer capacidade
        +StatusLaboratorio status
        +consultarDisponibilidade()
    }

    Professor "0..*" --> "0..*" Laboratorio : responsavel


    %% =========================
    %% RESERVAS
    %% =========================

    class Reserva {
        +UUID id
        +UUID laboratorioId
        +UUID usuarioId
        +DateTime inicio
        +DateTime fim
        +DateTime fimReal
        +DateTime dataNoShow
        +DateTime dataCriacao
        +StatusReserva status
        +confirmar()
        +cancelar()
        +iniciarUso()
        +encerrar()
    }

    Usuario "1" --> "0..*" Reserva : realiza
    Laboratorio "1" --> "0..*" Reserva : recebe


    %% =========================
    %% EQUIPAMENTOS
    %% =========================

    class Equipamento {
        +UUID id
        +String nome
        +String descricao
        +Integer quantidadeTotal
        +StatusEquipamento status
    }

    Laboratorio "1" --> "0..*" Equipamento : possui


    %% =========================
    %% RESERVA DE EQUIPAMENTO
    %% =========================

    class ReservaEquipamento {
        +Integer quantidade
    }

    Reserva "1" --> "0..*" ReservaEquipamento : inclui
    Equipamento "1" --> "0..*" ReservaEquipamento : reservado


    %% =========================
    %% DEVOLUCAO
    %% =========================

    class Devolucao {
        +UUID id
        +DateTime dataHora
        +String observacao
    }

    Reserva "1" --> "0..1" Devolucao : possui


    %% =========================
    %% RELATO DE PROBLEMA
    %% =========================

    class RelatoProblema {
        +UUID id
        +String descricao
        +String nivelSeveridade
        +DateTime dataHora
        +StatusProblema status
        +resolver()
    }

    Usuario "1" --> "0..*" RelatoProblema : registra
    Laboratorio "1" --> "0..*" RelatoProblema : relacionado
    Equipamento "0..1" --> "0..*" RelatoProblema : afetado

    class Notificacao {
        +UUID id
        +UUID usuarioId
        +UUID reservaId
        +String tipo
        +String titulo
        +String mensagem
        +DateTime criadaEm
        +Boolean lida
    }

    Usuario "1" --> "0..*" Notificacao : recebe
    Reserva "1" --> "0..*" Notificacao : origina

    class LogAuditoria {
        +UUID id
        +UUID usuarioId
        +String acao
        +String entidade
        +UUID entidadeId
        +String descricao
        +DateTime dataHora
    }

    Usuario "1" --> "0..*" LogAuditoria : executa

    class NotificacaoConta {
        +UUID id
        +UUID destinatarioId
        +UUID solicitanteId
        +String tipo
        +String status
        +DateTime criadaEm
        +UUID atendidaPorId
        +DateTime atendidaEm
    }

    Usuario "1" --> "0..*" NotificacaoConta : recebe
    Usuario "1" --> "0..*" NotificacaoConta : solicita


    %% =========================
    %% ENUMERACOES
    %% =========================

    class StatusUsuario {
        <<enumeration>>
        ATIVO
        INATIVO
        SUSPENSO
    }

    class StatusLaboratorio {
        <<enumeration>>
        DISPONIVEL
        INDISPONIVEL
    }

    class StatusReserva {
        <<enumeration>>
        PENDENTE
        APROVADA
        RECUSADA
        EM_USO
        CONCLUIDA
        CANCELADA
        NO_SHOW
    }

    class StatusEquipamento {
        <<enumeration>>
        DISPONIVEL
        INDISPONIVEL
        MANUTENCAO
    }

    class StatusProblema {
        <<enumeration>>
        ABERTO
        RESOLVIDO
    }

    class TipoNotificacao {
        <<enumeration>>
        RESERVA_APROVADA
        RESERVA_RECUSADA
        CHECKIN_30_MIN
    }
```