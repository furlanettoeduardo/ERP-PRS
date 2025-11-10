import api from './api';
import Cookies from 'js-cookie';
import { LoginCredentials, RegisterCredentials, AuthResponse } from '@/types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    
    // Salvar tokens nos cookies
    Cookies.set('accessToken', data.accessToken, {
      expires: 1 / 24, // 1 hora
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    Cookies.set('refreshToken', data.refreshToken, {
      expires: 7, // 7 dias
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    return data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', credentials);
    
    // Não salvar tokens no registro - usuário deve fazer login depois
    return data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
    
    // Limpar cookies
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
    
    // Atualizar tokens nos cookies
    Cookies.set('accessToken', data.accessToken, {
      expires: 1 / 24,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    Cookies.set('refreshToken', data.refreshToken, {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    return data;
  },

  async getProfile() {
    const { data } = await api.get('/auth/me');
    return data;
  },
};
