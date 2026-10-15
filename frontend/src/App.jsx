import React, { useContext, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';
import GestaoUsuarios from './GestaoUsuarios'; // Importando a nova tela

export default function App() {
  const { user, login, logout, loading } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [telaAtiva, setTelaAtiva] = useState('MENU'); // Controle de qual tela mostrar

  if (loading) return <div>Carregando...</div>;

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(email, senha);
    if (!result.success) setErro(result.message);
  };

  // TELA QUANDO LOGADO
  if (user) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h2>Bem-vindo, {user.nome}!</h2>
        <p>Seu perfil é: <strong>{user.perfil}</strong></p>

        {/* SE A TELA ATIVA FOR "GESTAO_USUARIOS", MOSTRA O NOVO COMPONENTE */}
        {telaAtiva === 'GESTAO_USUARIOS' && (
          <GestaoUsuarios voltar={() => setTelaAtiva('MENU')} />
        )}

        {/* SE A TELA ATIVA FOR "MENU", MOSTRA OS BOTÕES NORMAIS */}
        {telaAtiva === 'MENU' && (
          <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h3>Menu de Ações Permitidas:</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li>🔍 Consultar Laboratórios e Equipamentos</li>

              {['ALUNO', 'PROFESSOR'].includes(user.perfil) && (
                <li style={{ color: 'green' }}>📅 Solicitar Nova Reserva</li>
              )}

              {user.perfil === 'PROFESSOR' && (
                <li style={{ color: 'orange', fontWeight: 'bold' }}>✅ Analisar Solicitações</li>
              )}

              {user.perfil === 'ADMINISTRADOR' && (
                <>
                  <li 
                    style={{ color: 'red', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setTelaAtiva('GESTAO_USUARIOS')}
                  >
                    ⚙️ Gerenciar Usuários
                  </li>
                  <li style={{ color: 'red', fontWeight: 'bold' }}>🏢 Cadastrar Laboratórios</li>
                </>
              )}
            </ul>
          </div>
        )}

        <button 
          onClick={logout} 
          style={{ padding: '10px 20px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Sair do Sistema
        </button>
      </div>
    );
  }

  // TELA DE LOGIN
  return (
    <div style={{ padding: '20px', maxWidth: '300px' }}>
      <h2>Login Acessum</h2>
      {erro && <p style={{ color: 'red' }}>{typeof erro === 'string' ? erro : 'Erro de validação no login. Verifique os dados.'}</p>}
      <form onSubmit={handleLogin}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }} />
        <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }} />
        <button type="submit" style={{ width: '100%', padding: '10px' }}>Entrar</button>
      </form>
    </div>
  );
}