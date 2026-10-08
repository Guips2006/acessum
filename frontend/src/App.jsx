import React, { useContext, useState } from 'react';
import { AuthContext } from './contexts/AuthContext';

export default function App() {
  const { user, login, logout, loading } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  if (loading) return <div>Carregando...</div>;

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(email, senha);
    if (!result.success) setErro(result.message);
  };

  // TELA QUANDO LOGADO
// TELA QUANDO LOGADO
  if (user) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h2>Bem-vindo, {user.nome}!</h2>
        <p>Seu perfil é: <strong>{user.perfil}</strong></p>
        
        <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Menu de Ações Permitidas:</h3>
          <ul style={{ lineHeight: '1.8' }}>
            
            {/* VISÍVEL PARA TODOS (Consulta de Laboratórios - SPEC-005) */}
            <li>🔍 Consultar Laboratórios e Equipamentos</li>

            {/* VISÍVEL APENAS PARA ALUNO E PROFESSOR (Reservas - SPEC-007) */}
            {['ALUNO', 'PROFESSOR'].includes(user.perfil) && (
              <li style={{ color: 'green' }}>
                📅 Solicitar Nova Reserva
              </li>
            )}

            {/* VISÍVEL APENAS PARA PROFESSOR (Aprovação - SPEC-008) */}
            {user.perfil === 'PROFESSOR' && (
              <li style={{ color: 'orange', fontWeight: 'bold' }}>
                ✅ Analisar Solicitações de Alunos (Aprovar/Recusar)
              </li>
            )}

            {/* VISÍVEL APENAS PARA ADMINISTRADOR (Gestão - SPEC-002, 003 e 004) */}
            {user.perfil === 'ADMINISTRADOR' && (
              <>
                <li style={{ color: 'red', fontWeight: 'bold' }}>⚙️ Gerenciar Usuários</li>
                <li style={{ color: 'red', fontWeight: 'bold' }}>🏢 Cadastrar Laboratórios</li>
              </>
            )}
          </ul>
        </div>

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
      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      <form onSubmit={handleLogin}>
        <input 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <input 
          type="password" 
          placeholder="Senha" 
          value={senha} 
          onChange={(e) => setSenha(e.target.value)} 
          style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%' }}
        />
        <button type="submit" style={{ width: '100%', padding: '10px' }}>Entrar</button>
      </form>
    </div>
  );
}