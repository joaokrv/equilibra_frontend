import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
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

/**
 * Componente de guarda para rotas autenticadas.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

/**
 * Componente de guarda para rotas que exigem e-mail verificado.
 * Permite renderizar a rota se verificado, senão volta pro Dashboard com aviso.
 */
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

/**
 * Componente de guarda para rotas públicas (login/register).
 * Redireciona para dashboard se já autenticado.
 */
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

export default function App() {
  const { isAuthenticated, updateProfile } = useAuthStore();
  const hideValues = usePrivacyStore((state) => state.hideValues);

  useEffect(() => {
    if (isAuthenticated) {
      PerfilService.getPerfil()
        .then((perfil) => updateProfile(perfil))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    document.documentElement.dataset.privacyValues = hideValues ? 'hidden' : 'visible';
  }, [hideValues]);

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
