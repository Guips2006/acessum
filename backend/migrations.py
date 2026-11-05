from sqlalchemy import Engine, inspect


def aplicar_migracoes(engine: Engine) -> None:
    inspetor = inspect(engine)
    tabelas = set(inspetor.get_table_names())
    colunas_reservas = (
        {coluna["name"] for coluna in inspetor.get_columns("reservas")}
        if "reservas" in tabelas
        else set()
    )
    colunas_usuarios = (
        {coluna["name"] for coluna in inspetor.get_columns("usuarios")}
        if "usuarios" in tabelas
        else set()
    )
    with engine.begin() as conexao:
        if "reservas" in tabelas:
            if "finalidade" not in colunas_reservas:
                conexao.exec_driver_sql(
                    "ALTER TABLE reservas ADD COLUMN finalidade VARCHAR(500) "
                    "NOT NULL DEFAULT 'Reserva legada sem finalidade informada'"
                )
            if "motivo_recusa" not in colunas_reservas:
                conexao.exec_driver_sql(
                    "ALTER TABLE reservas ADD COLUMN motivo_recusa VARCHAR(500)"
                )
            if "data_fim_real" not in colunas_reservas:
                conexao.exec_driver_sql(
                    "ALTER TABLE reservas ADD COLUMN data_fim_real DATETIME"
                )
            if "data_no_show" not in colunas_reservas:
                conexao.exec_driver_sql(
                    "ALTER TABLE reservas ADD COLUMN data_no_show DATETIME"
                )
                conexao.exec_driver_sql(
                    "UPDATE reservas SET data_no_show = datetime(data_inicio, '+15 minutes') "
                    "WHERE status = 'NO_SHOW' AND data_no_show IS NULL"
                )
            conexao.exec_driver_sql(
                "CREATE INDEX IF NOT EXISTS ix_reservas_usuario_no_show "
                "ON reservas (usuario_id, status, data_no_show)"
            )
            conexao.exec_driver_sql(
                "CREATE INDEX IF NOT EXISTS ix_reservas_status_data_inicio "
                "ON reservas (status, data_inicio)"
            )

        if "usuarios" in tabelas:
            if "avatar_url" not in colunas_usuarios:
                conexao.exec_driver_sql(
                    "ALTER TABLE usuarios ADD COLUMN avatar_url VARCHAR(500)"
                )
            if "ultima_atividade" not in colunas_usuarios:
                conexao.exec_driver_sql(
                    "ALTER TABLE usuarios ADD COLUMN ultima_atividade DATETIME"
                )
            if "suspensao_ate" not in colunas_usuarios:
                conexao.exec_driver_sql(
                    "ALTER TABLE usuarios ADD COLUMN suspensao_ate DATETIME"
                )
            if "cpf" not in colunas_usuarios:
                conexao.exec_driver_sql(
                    "ALTER TABLE usuarios ADD COLUMN cpf VARCHAR(11)"
                )
            if "rg" not in colunas_usuarios:
                conexao.exec_driver_sql(
                    "ALTER TABLE usuarios ADD COLUMN rg VARCHAR(30)"
                )
            if "data_nascimento" not in colunas_usuarios:
                conexao.exec_driver_sql(
                    "ALTER TABLE usuarios ADD COLUMN data_nascimento DATE"
                )
            if "pin_hash" not in colunas_usuarios:
                conexao.exec_driver_sql(
                    "ALTER TABLE usuarios ADD COLUMN pin_hash VARCHAR(255)"
                )
            if "deve_trocar_senha" not in colunas_usuarios:
                conexao.exec_driver_sql(
                    "ALTER TABLE usuarios ADD COLUMN deve_trocar_senha "
                    "BOOLEAN NOT NULL DEFAULT 0"
                )
            conexao.exec_driver_sql(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_cpf_not_null "
                "ON usuarios (cpf) WHERE cpf IS NOT NULL"
            )

        conexao.exec_driver_sql(
            "CREATE TABLE IF NOT EXISTS notificacoes ("
            "id VARCHAR(36) PRIMARY KEY, "
            "usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id), "
            "reserva_id VARCHAR(36) NOT NULL REFERENCES reservas(id), "
            "tipo VARCHAR(30) NOT NULL CHECK (tipo IN "
            "('RESERVA_APROVADA', 'RESERVA_RECUSADA', 'CHECKIN_30_MIN')), "
            "titulo VARCHAR(120) NOT NULL, "
            "mensagem VARCHAR(500) NOT NULL, "
            "criada_em DATETIME NOT NULL, "
            "lida BOOLEAN NOT NULL DEFAULT 0, "
            "CONSTRAINT uq_notificacao_reserva_tipo UNIQUE (reserva_id, tipo)"
            ")"
        )
        conexao.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS ix_notificacoes_usuario_lida_criada "
            "ON notificacoes (usuario_id, lida, criada_em)"
        )
        conexao.exec_driver_sql(
            "CREATE TABLE IF NOT EXISTS favoritos_usuarios ("
            "usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, "
            "laboratorio_id VARCHAR(36) NOT NULL REFERENCES laboratorios(id) ON DELETE CASCADE, "
            "criado_em DATETIME NOT NULL, "
            "PRIMARY KEY (usuario_id, laboratorio_id)"
            ")"
        )
        conexao.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS ix_favoritos_usuarios_usuario "
            "ON favoritos_usuarios (usuario_id)"
        )
        conexao.exec_driver_sql(
            "CREATE TABLE IF NOT EXISTS reserva_co_reservantes ("
            "reserva_id VARCHAR(36) NOT NULL REFERENCES reservas(id) ON DELETE CASCADE, "
            "usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, "
            "PRIMARY KEY (reserva_id, usuario_id)"
            ")"
        )
        conexao.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS ix_reserva_co_reservantes_usuario "
            "ON reserva_co_reservantes (usuario_id)"
        )
        conexao.exec_driver_sql(
            "CREATE TABLE IF NOT EXISTS notificacoes_grupo ("
            "id VARCHAR(36) PRIMARY KEY, "
            "usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id), "
            "reserva_id VARCHAR(36) NOT NULL REFERENCES reservas(id), "
            "tipo VARCHAR(30) NOT NULL CHECK (tipo IN "
            "('RESERVA_APROVADA', 'RESERVA_RECUSADA', 'CHECKIN_30_MIN')), "
            "titulo VARCHAR(120) NOT NULL, "
            "mensagem VARCHAR(500) NOT NULL, "
            "criada_em DATETIME NOT NULL, "
            "lida BOOLEAN NOT NULL DEFAULT 0, "
            "CONSTRAINT uq_notificacao_grupo_reserva_usuario_tipo "
            "UNIQUE (reserva_id, usuario_id, tipo)"
            ")"
        )
        conexao.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS ix_notificacoes_grupo_usuario_lida_criada "
            "ON notificacoes_grupo (usuario_id, lida, criada_em)"
        )
        conexao.exec_driver_sql(
            "CREATE TABLE IF NOT EXISTS logs_auditoria ("
            "id VARCHAR(36) PRIMARY KEY, "
            "usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id), "
            "acao VARCHAR(50) NOT NULL, "
            "entidade VARCHAR(30) NOT NULL, "
            "entidade_id VARCHAR(36) NOT NULL, "
            "descricao VARCHAR(500) NOT NULL, "
            "data_hora DATETIME NOT NULL"
            ")"
        )
        conexao.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS ix_logs_auditoria_data_acao "
            "ON logs_auditoria (data_hora, acao)"
        )
        conexao.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS ix_logs_auditoria_usuario "
            "ON logs_auditoria (usuario_id)"
        )
        conexao.exec_driver_sql(
            "CREATE TABLE IF NOT EXISTS notificacoes_conta ("
            "id VARCHAR(36) PRIMARY KEY, "
            "destinatario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id), "
            "solicitante_id VARCHAR(36) NOT NULL REFERENCES usuarios(id), "
            "tipo VARCHAR(40) NOT NULL CHECK (tipo = 'RESET_SENHA_SOLICITADO'), "
            "titulo VARCHAR(120) NOT NULL, "
            "mensagem VARCHAR(500) NOT NULL, "
            "criada_em DATETIME NOT NULL, "
            "lida BOOLEAN NOT NULL DEFAULT 0, "
            "status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' "
            "CHECK (status IN ('PENDENTE', 'ATENDIDA')), "
            "atendida_por_id VARCHAR(36) REFERENCES usuarios(id), "
            "atendida_em DATETIME"
            ")"
        )
        conexao.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS ix_notificacao_conta_destino_status "
            "ON notificacoes_conta (destinatario_id, status, criada_em)"
        )
        conexao.exec_driver_sql(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_notificacao_reset_pendente "
            "ON notificacoes_conta (destinatario_id, solicitante_id) "
            "WHERE status = 'PENDENTE'"
        )
        conexao.exec_driver_sql(
            "CREATE TABLE IF NOT EXISTS tokens_reset_senha ("
            "id VARCHAR(36) PRIMARY KEY, "
            "usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id), "
            "token_hash VARCHAR(64) NOT NULL, "
            "criado_em DATETIME NOT NULL, "
            "expira_em DATETIME NOT NULL, "
            "consumido_em DATETIME"
            ")"
        )
        conexao.exec_driver_sql(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_tokens_reset_senha_hash "
            "ON tokens_reset_senha (token_hash)"
        )
        conexao.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS ix_tokens_reset_senha_usuario "
            "ON tokens_reset_senha (usuario_id, expira_em)"
        )
        conexao.exec_driver_sql(
            "CREATE TABLE IF NOT EXISTS tentativas_reset_senha ("
            "id VARCHAR(36) PRIMARY KEY, "
            "chave_ip VARCHAR(64) NOT NULL, "
            "criada_em DATETIME NOT NULL"
            ")"
        )
        conexao.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS ix_tentativas_reset_senha_chave_data "
            "ON tentativas_reset_senha (chave_ip, criada_em)"
        )
