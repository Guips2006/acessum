import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

// Use a API local por padrão; sobrescreva com VITE_API_BASE_URL se necessário.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://glowing-trout-974prj4964v93xwxq-8000.app.github.dev/',
  timeout: 15000,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      error => {
        if (
          error.response?.status === 403
          && error.response?.data?.detail === 'É obrigatório cadastrar o PIN de segurança antes de acessar o sistema.'
        ) {
          setUser(current => current ? { ...current, pin_definido: false } : current);
        }
        return Promise.reject(error);
      },
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
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
        message: error.response?.data?.detail
          || 'Não foi possível conectar à API. Verifique VITE_API_BASE_URL, se a API está em execução e se a porta está acessível.'
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