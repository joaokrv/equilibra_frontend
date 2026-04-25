import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from './store/useAuthStore';
import { API_BASE_URL } from './lib/apiBaseUrl';
import { usePrivacyStore } from './store/usePrivacyStore';
import { toast } from './store/useToastStore';
import { PerfilService } from './api';
import { Dashboard } from './pages/Dashboard';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { ContasPage } from './pages/Contas';
import { ReceitasPage } from './pages/Receitas';
import { DespesasPage } from './pages/Despesas';
import { ExtratoPage } from './pages/Extrato';
import { CartoesPage } from './pages/Cartoes';
import { CategoriasPage } from './pages/Categorias';
import { InvestimentosPage } from './pages/Investimentos';
import { RecorrentesPage } from './pages/Recorrentes';
import { PerfilPage } from './pages/Perfil';
import { TutorialPage } from './pages/Tutorial';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { ResetPasswordPage } from './pages/ResetPassword';
import { NotFoundPage } from './pages/NotFound';

// Renderiza imediatamente com estado local; session-check hidrata o perfil e detecta
// sessão revogada em até 30s via refetchInterval. Proteção real via interceptor 401 (G10.1).
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const { data: perfil } = useQuery({
    queryKey: ['auth-session-check'],
    queryFn: () => PerfilService.obterPerfil(),
    enabled: isAuthenticated,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: false,
  });

  useEffect(() => {
    if (perfil) updateProfile(perfil);
  }, [perfil, updateProfile]);

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Bloqueia acesso a rotas financeiras até e-mail verificado; redireciona com toast.
const VerifiedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore(state => state.user);
  const isUnverified = user !== null && !user.isEmailVerificado;

  useEffect(() => {
    if (isUnverified) {
      toast.warning('Ative sua conta para acessar esta funcionalidade e muito mais!', 5000);
    }
  }, [isUnverified]);

  if (isUnverified) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

export default function App() {
  const hideValues = usePrivacyStore((state) => state.hideValues);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const { isAuthenticated, user, setAuth, logout } = useAuthStore.getState();

    if (!isAuthenticated) {
      setIsInitializing(false);
      return;
    }

    axios
      .post(`${API_BASE_URL}/api/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => {
        if (user && data.accessToken) {
          setAuth(user, data.accessToken);
        }
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []);

  // Listener para logout forçado via interceptor 401 (G10.1 — F1-A3)
  useEffect(() => {
    const handleForceLogout = () => {
      queryClient.clear();
      useAuthStore.getState().logout();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:force-logout', handleForceLogout);
    return () => window.removeEventListener('auth:force-logout', handleForceLogout);
  }, [navigate, queryClient]);

  useEffect(() => {
    document.documentElement.dataset.privacyValues = hideValues ? 'hidden' : 'visible';
  }, [hideValues]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Rotas Protegidas */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/perfil" element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />
      <Route path="/tutorial" element={<ProtectedRoute><TutorialPage /></ProtectedRoute>} />
      
      {/* Rotas Protegidas e Verificadas */}
      <Route path="/contas" element={<ProtectedRoute><VerifiedRoute><ContasPage /></VerifiedRoute></ProtectedRoute>} />
      <Route path="/receitas" element={<ProtectedRoute><VerifiedRoute><ReceitasPage /></VerifiedRoute></ProtectedRoute>} />
      <Route path="/despesas" element={<ProtectedRoute><VerifiedRoute><DespesasPage /></VerifiedRoute></ProtectedRoute>} />
      <Route path="/extrato" element={<ProtectedRoute><VerifiedRoute><ExtratoPage /></VerifiedRoute></ProtectedRoute>} />
      <Route path="/cartoes" element={<ProtectedRoute><VerifiedRoute><CartoesPage /></VerifiedRoute></ProtectedRoute>} />
      <Route path="/categorias" element={<ProtectedRoute><VerifiedRoute><CategoriasPage /></VerifiedRoute></ProtectedRoute>} />
      <Route path="/investimentos" element={<ProtectedRoute><VerifiedRoute><InvestimentosPage /></VerifiedRoute></ProtectedRoute>} />
      <Route path="/recorrentes" element={<ProtectedRoute><VerifiedRoute><RecorrentesPage /></VerifiedRoute></ProtectedRoute>} />

      {/* Redirecionamento Padrão */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
