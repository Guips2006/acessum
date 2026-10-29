import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

// 1. Deixe a baseURL apenas com o link principal do Codespaces (sem o /api no final)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://sinister-zombie-5g6j464wjpr5fp5-8000.app.github.dev/',
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      // 2. Coloque o /api direto aqui na chamada
      api.get('/api/auth/me') 
        .then(response => setUser(response.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

 const login = async (email, senha) => {
    try {
      const response = await api.post('/api/auth/login', { 
        email: email, 
        senha: senha 
      }); 
      
      const { token, ...dadosUsuario } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(dadosUsuario);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Erro ao iniciar sessão' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.Authorization;
    setUser(null);
  };

  const atualizarUsuario = (dadosUsuario) => {
    setUser(atual => ({ ...atual, ...dadosUsuario }));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, api, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
};