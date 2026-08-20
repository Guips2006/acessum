<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Personas — Sistema de Gestão de Laboratórios</title>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            background: #f6f8fb;
            color: #273142;
            line-height: 1.6;
            padding: 40px 20px;
        }

        .container {
            max-width: 1100px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 40px;
        }

        header h1 {
            font-size: 32px;
            color: #1f2937;
            margin-bottom: 10px;
        }

        header p {
            color: #6b7280;
            font-size: 16px;
        }

        /* Persona */

        .persona {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 28px;
            margin-bottom: 32px;
            box-shadow: 0 4px 15px rgba(15, 23, 42, 0.05);
        }

        .persona-header {
            display: flex;
            align-items: center;
            gap: 18px;
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid #edf0f4;
        }

        .avatar {
            width: 65px;
            height: 65px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            background: #eef2ff;
        }

        .persona-header h2 {
            font-size: 24px;
            color: #1f2937;
        }

        .persona-header span {
            color: #64748b;
            font-size: 14px;
        }

        /* Tabela da persona */

        .persona-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
        }

        .persona-table th {
            width: 22%;
            background: #f8fafc;
            color: #374151;
            text-align: left;
            vertical-align: top;
            padding: 18px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
        }

        .persona-table td {
            padding: 18px;
            vertical-align: top;
            border-bottom: 1px solid #e5e7eb;
            color: #4b5563;
            font-size: 14px;
        }

        .persona-table tr:last-child th,
        .persona-table tr:last-child td {
            border-bottom: none;
        }

        .persona-table ul {
            padding-left: 20px;
        }

        .persona-table li {
            margin-bottom: 6px;
        }

        /* Cores individuais */

        .aluno {
            border-top: 4px solid #6366f1;
        }

        .aluno .avatar {
            background: #eef2ff;
        }

        .professor {
            border-top: 4px solid #14b8a6;
        }

        .professor .avatar {
            background: #ecfdf5;
        }

        /* Resumo */

        .summary {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 28px;
            margin-top: 40px;
            box-shadow: 0 4px 15px rgba(15, 23, 42, 0.05);
        }

        .summary h2 {
            margin-bottom: 20px;
            color: #1f2937;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }

        .summary-table th {
            background: #f8fafc;
            color: #374151;
            text-align: left;
            padding: 14px;
            border-bottom: 1px solid #e5e7eb;
        }

        .summary-table td {
            padding: 14px;
            border-bottom: 1px solid #e5e7eb;
            color: #4b5563;
        }

        .summary-table tr:last-child td {
            border-bottom: none;
        }

        .yes {
            color: #059669;
            font-weight: bold;
        }

        .no {
            color: #9ca3af;
        }

        /* Insight */

        .insight {
            margin-top: 28px;
            padding: 20px;
            border-radius: 12px;
            background: #f8fafc;
            border-left: 4px solid #6366f1;
            color: #475569;
        }

        .insight strong {
            color: #1f2937;
        }

        /* Responsividade */

        @media (max-width: 700px) {

            body {
                padding: 20px 12px;
            }

            .persona {
                padding: 18px;
            }

            .persona-header {
                align-items: flex-start;
            }

            .persona-table,
            .persona-table tbody,
            .persona-table tr,
            .persona-table th,
            .persona-table td {
                display: block;
                width: 100%;
            }

            .persona-table th {
                padding-bottom: 6px;
                border-bottom: none;
            }

            .persona-table td {
                padding-top: 6px;
            }

            .summary {
                padding: 18px;
                overflow-x: auto;
            }

            .summary-table {
                min-width: 650px;
            }
        }
    </style>
</head>

<body>

<div class="container">

    <header>
        <h1>Personas</h1>
        <p>Sistema de Gestão de Acessos e Usos de Laboratórios</p>
    </header>


    <!-- PERSONA 1 -->

    <section class="persona aluno">

        <div class="persona-header">
            <div class="avatar">👨‍🎓</div>

            <div>
                <h2>Persona 1 — Aluno</h2>
                <span>Lucas Almeida, 21 anos</span>
            </div>
        </div>

        <table class="persona-table">

            <tr>
                <th>Nome e contexto</th>

                <td>
                    <strong>Lucas Almeida, 21 anos</strong>

                    <p>
                        Lucas é estudante de Engenharia e utiliza os laboratórios
                        para aulas práticas, trabalhos acadêmicos e projetos.
                        Precisa consultar horários e reservar um laboratório
                        rapidamente, sem depender diretamente de professores
                        ou da administração.
                    </p>
                </td>
            </tr>

            <tr>
                <th>Objetivo</th>

                <td>
                    Garantir um horário vago em bancada equipada para testar
                    seus protótipos de hardware antes do prazo de entrega.
                </td>
            </tr>

            <tr>
                <th>Dores</th>

                <td>
                    <ul>
                        <li>
                            Chegar no laboratório e descobrir que o local
                            está trancado ou ocupado.
                        </li>

                        <li>
                            Perder horas de testes descobrindo na hora que
                            um equipamento-chave está quebrado.
                        </li>

                        <li>
                            Falta de transparência aos alunos em relação
                            a quais horários estão disponíveis.
                        </li>
                    </ul>
                </td>
            </tr>

            <tr>
                <th>Comportamento atual</th>

                <td>
                    <ul>
                        <li>
                            Consulta colegas ou professores para descobrir
                            a disponibilidade dos laboratórios.
                        </li>

                        <li>
                            Utiliza mensagens ou outros meios informais
                            para solicitar reservas.
                        </li>

                        <li>
                            Precisa confirmar manualmente se o laboratório
                            estará disponível.
                        </li>

                        <li>
                            Pode ter dificuldade para acompanhar suas
                            reservas e horários.
                        </li>
                    </ul>
                </td>
            </tr>

            <tr>
                <th>Restrições</th>

                <td>
                    <ul>
                        <li>
                            Possui horários limitados entre aulas e
                            outras atividades.
                        </li>

                        <li>
                            Não possui permissões administrativas.
                        </li>

                        <li>
                            Depende da disponibilidade dos laboratórios.
                        </li>
                    </ul>
                </td>
            </tr>

            <tr>
                <th>Critérios de sucesso</th>

                <td>
                    <ul>
                        <li>
                            Conseguir consultar a disponibilidade rapidamente.
                        </li>

                        <li>
                            Realizar uma reserva sem depender de terceiros.
                        </li>

                        <li>
                            Encontrar o laboratório e os equipamentos
                            funcionando no horário agendado.
                        </li>

                        <li>
                            Visualizar suas reservas de forma clara.
                        </li>

                        <li>
                            Conseguir devolver o laboratório corretamente.
                        </li>

                        <li>
                            Reportar problemas de maneira simples e rápida.
                        </li>
                    </ul>
                </td>
            </tr>

        </table>

    </section>


    <!-- PERSONA 2 -->

    <section class="persona professor">

        <div class="persona-header">
            <div class="avatar">👩‍🏫</div>

            <div>
                <h2>Persona 2 — Professora</h2>
                <span>Mariana Costa, 52 anos</span>
            </div>
        </div>

        <table class="persona-table">

            <tr>
                <th>Nome e contexto</th>

                <td>
                    <strong>Mariana Costa, 52 anos</strong>

                    <p>
                        Mariana é professora responsável por disciplinas
                        práticas. Utiliza regularmente os laboratórios
                        para ministrar aulas e desenvolver atividades
                        acadêmicas. Também precisa reservar equipamentos
                        específicos para suas atividades.
                    </p>
                </td>
            </tr>

            <tr>
                <th>Objetivo</th>

                <td>
                    Organizar o uso do espaço físico e dos kits de
                    desenvolvimento para suas turmas, mantendo o controle
                    sobre a conservação do patrimônio da faculdade.
                </td>
            </tr>

            <tr>
                <th>Dores</th>

                <td>
                    <ul>
                        <li>
                            Conflitos entre reservas de laboratórios.
                        </li>

                        <li>
                            Dificuldade para saber quais laboratórios
                            estão disponíveis.
                        </li>

                        <li>
                            Falta de informações sobre a disponibilidade
                            dos equipamentos.
                        </li>

                        <li>
                            Necessidade de entrar em contato com a
                            administração para resolver problemas.
                        </li>

                        <li>
                            Falta de centralização das informações sobre
                            laboratórios e equipamentos.
                        </li>
                    </ul>
                </td>
            </tr>

            <tr>
                <th>Comportamento atual</th>

                <td>
                    <ul>
                        <li>
                            Verifica a disponibilidade dos laboratórios
                            antes de planejar as aulas.
                        </li>

                        <li>
                            Utiliza sistemas ou contatos internos para
                            realizar reservas.
                        </li>

                        <li>
                            Comunica-se com a administração quando
                            encontra problemas.
                        </li>

                        <li>
                            Precisa confirmar manualmente a disponibilidade
                            de equipamentos.
                        </li>

                        <li>
                            Planeja previamente as atividades que serão
                            realizadas nos laboratórios.
                        </li>
                    </ul>
                </td>
            </tr>

            <tr>
                <th>Restrições</th>

                <td>
                    Pouco tempo hábil no dia a dia para gerenciar
                    burocracias manuais de chaves ou autorizações em papel.
                </td>
            </tr>

            <tr>
                <th>Critérios de sucesso</th>

                <td>
                    <ul>
                        <li>
                            Conseguir reservar um laboratório em poucos passos.
                        </li>

                        <li>
                            Consultar rapidamente a disponibilidade
                            dos laboratórios.
                        </li>

                        <li>
                            Reservar os equipamentos necessários
                            para suas atividades.
                        </li>

                        <li>
                            Evitar conflitos entre reservas.
                        </li>

                        <li>
                            Conseguir reportar problemas de maneira rápida.
                        </li>

                        <li>
                            Ter informações centralizadas sobre laboratórios
                            e equipamentos.
                        </li>
                    </ul>
                </td>
            </tr>

        </table>

    </section>


    <!-- RESUMO -->

    <section class="summary">

        <h2>📊 Resumo das Personas</h2>

        <table class="summary-table">

            <thead>
                <tr>
                    <th>Característica</th>
                    <th>Lucas — Aluno</th>
                    <th>Mariana — Professora</th>
                </tr>
            </thead>

            <tbody>

                <tr>
                    <td><strong>Principal necessidade</strong></td>
                    <td>Reservar laboratórios</td>
                    <td>Organizar o uso de laboratórios e equipamentos</td>
                </tr>

                <tr>
                    <td>Consulta disponibilidade</td>
                    <td class="yes">✓ Sim</td>
                    <td class="yes">✓ Sim</td>
                </tr>

                <tr>
                    <td>Reserva laboratório</td>
                    <td class="yes">✓ Sim</td>
                    <td class="yes">✓ Sim</td>
                </tr>

                <tr>
                    <td>Devolve laboratório</td>
                    <td class="yes">✓ Sim</td>
                    <td class="yes">✓ Sim</td>
                </tr>

                <tr>
                    <td>Reserva equipamentos</td>
                    <td class="no">✕ Não</td>
                    <td class="yes">✓ Sim</td>
                </tr>

                <tr>
                    <td>Reporta problemas</td>
                    <td class="yes">✓ Sim</td>
                    <td class="yes">✓ Sim</td>
                </tr>

                <tr>
                    <td>Cadastra laboratórios</td>
                    <td class="no">✕ Não</td>
                    <td class="no">✕ Não</td>
                </tr>

                <tr>
                    <td>Cadastra equipamentos</td>
                    <td class="no">✕ Não</td>
                    <td class="no">✕ Não</td>
                </tr>

                <tr>
                    <td>Gerencia usuários</td>
                    <td class="no">✕ Não</td>
                    <td class="no">✕ Não</td>
                </tr>

                <tr>
                    <td><strong>Principal prioridade</strong></td>
                    <td><strong>Autonomia e facilidade</strong></td>
                    <td><strong>Organização e controle</strong></td>
                </tr>

            </tbody>

        </table>

        <div class="insight">
            <strong>💡 Insight:</strong>
            O sistema deve reduzir a dependência de processos informais
            e burocráticos, permitindo que <strong>Lucas</strong> tenha
            autonomia para reservar e utilizar os laboratórios, enquanto
            <strong>Mariana</strong> consiga planejar e controlar os
            recursos necessários para suas aulas.
        </div>

    </section>

</div>

</body>
</html>