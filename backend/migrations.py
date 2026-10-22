from sqlalchemy import Engine, inspect


def aplicar_migracoes(engine: Engine) -> None:
    tabelas = set(inspect(engine).get_table_names())
    if "reservas" not in tabelas:
        return

    colunas = {coluna["name"] for coluna in inspect(engine).get_columns("reservas")}
    with engine.begin() as conexao:
        if "finalidade" not in colunas:
            conexao.exec_driver_sql(
                "ALTER TABLE reservas ADD COLUMN finalidade VARCHAR(500) "
                "NOT NULL DEFAULT 'Reserva legada sem finalidade informada'"
            )
        if "motivo_recusa" not in colunas:
            conexao.exec_driver_sql(
                "ALTER TABLE reservas ADD COLUMN motivo_recusa VARCHAR(500)"
            )
        if "data_fim_real" not in colunas:
            conexao.exec_driver_sql(
                "ALTER TABLE reservas ADD COLUMN data_fim_real DATETIME"
            )
