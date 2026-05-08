import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';

import ECommerce from './pages/Dashboard/ECommerce';
import Messages from './pages/Messages';
import MessagesMe from './pages/MessagesMe';
import Profile from './pages/Profile';
import Roles from './pages/Pages/Roles';
import Permissions from './pages/Pages/Permissions';
import UsersPage from './pages/Pages/UsersPage';
import TermsPage from './pages/Pages/TermsPage';
import TermCategoriesPage from './pages/Pages/TermCategoriesPage';
import LocatedTermsPage from './pages/Pages/LocatedTermsPage';

import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import PrivateRoute from './components/PrivateRoute';
import { useUserProfile } from './hooks/useUser';
import SignIn from './pages/Authentication/SignIn';
import PartsPage from './pages/Pages/PartsPage';
import ProductParts from './pages/Pages/ProductParts';
import QuestionsAnswersPage from './pages/Pages/QuestionsAnswersPage';

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();
  const isAuthRoute = pathname.startsWith('/auth');
  const {
    roleInternalName,
    fetchProfile,
    loading: profileLoading,
  } = useUserProfile();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (!isAuthRoute) {
      fetchProfile();
      setTimeout(() => setLoading(false), 1000);
    } else {
      setLoading(false);
    }
  }, [fetchProfile, isAuthRoute]);

  // Solo muestra loader en rutas privadas
  if (!isAuthRoute && (loading || profileLoading)) {
    return <Loader />;
  }

  // Redirección según rol (solo en rutas privadas)
  let defaultRoute;
  if (!isAuthRoute) {
    if (
      roleInternalName === 'admin' ||
      roleInternalName === 'supervisor' ||
      roleInternalName === 'supervisorL4' ||
      roleInternalName === 'supervisorL1'
    ) {
      defaultRoute = <Navigate to="/" replace />;
    } else if (roleInternalName === 'user') {
      defaultRoute = <Navigate to="/messages/me" replace />;
    } else {
      defaultRoute = <Loader />;
    }
  }

  return (
    <>
      <Routes>
        <Route element={<PrivateRoute />}>
          {/* Ruta principal: dashboard/estadísticas solo para admin y supervisor */}
          <Route
            index
            element={
              (roleInternalName === 'admin' ||
              roleInternalName === 'supervisor' ||
              roleInternalName === 'supervisorL4' ||
              roleInternalName === 'supervisorL1') ? (
                <>
                  <PageTitle title="eCommerce Dashboard | Pronto Pro" />
                  <ECommerce />
                </>
              ) : (
                <Navigate to="/messages/me" replace />
              )
            }
          />
          {/* Ruta para mis mensajes - accesible para TODOS los roles */}
          <Route
            path="/messages/me"
            element={
              <>
                <PageTitle title="Mis Mensajes | Pronto Pro" />
                <MessagesMe />
              </>
            }
          />
          {(roleInternalName === 'admin' ||
            roleInternalName === 'supervisor' ||
            roleInternalName === 'supervisorL4' ||
            roleInternalName === 'supervisorL1') && (
            <Route
              path="/questions-answers"
              element={
                <>
                  <PageTitle title="Preguntas y respuestas | Pronto Pro" />
                  <QuestionsAnswersPage />
                </>
              }
            />
          )}

          {/* Ruta para todos los mensajes - SOLO admin y supervisor */}
          {(roleInternalName === 'admin' ||
            roleInternalName === 'supervisor' ||
            roleInternalName === 'supervisorL4' ||
            roleInternalName === 'supervisorL1') && (
            <Route
              path="/messages"
              element={
                <>
                  <PageTitle title="Todos los Mensajes | Pronto Pro" />
                  <Messages />
                </>
              }
            />
          )}
          {/* Ruta para la tabla de partes - admin, supervisor, supervisorL1, supervisorL4 */}
          {(roleInternalName === 'admin' ||
            roleInternalName === 'supervisor' ||
            roleInternalName === 'supervisorL4' ||
            roleInternalName === 'supervisorL1') && (
            <Route path="/parts" element={<PartsPage />} />
          )}
          {/* Ruta para product parts (marcas y modelos) - admin, supervisor, supervisorL1, supervisorL4 */}
          {(roleInternalName === 'admin' ||
            roleInternalName === 'supervisor' ||
            roleInternalName === 'supervisorL4' ||
            roleInternalName === 'supervisorL1') && (
            <Route
              path="/product-parts"
              element={
                <>
                  <PageTitle title="Product Parts | Pronto Pro" />
                  <ProductParts />
                </>
              }
            />
          )}
          {/* Ruta para terms - SOLO administrador */}
          <Route 
            path="/terms" 
            element={
              roleInternalName === 'admin' ? (
                <TermsPage />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          {/* Ruta para term categories - admin y supervisores */}
          <Route 
            path="/terms/categories" 
            element={
              roleInternalName === 'admin' ||
              roleInternalName === 'supervisor' ||
              roleInternalName === 'supervisorL4' ||
              roleInternalName === 'supervisorL1' ? (
                <>
                  <PageTitle title="Categorías de Términos | Pronto Pro" />
                  <TermCategoriesPage />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          {/* Ruta para located-terms - supervisores y admin */}
          <Route
            path="/terms/located"
            element={
              roleInternalName === 'admin' ||
              roleInternalName === 'supervisor' ||
              roleInternalName === 'supervisorL4' ||
              roleInternalName === 'supervisorL1' ? (
                <>
                  <PageTitle title="Located Terms | Pronto Pro" />
                  <LocatedTermsPage />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Rutas de perfil solo para admin */}
          {roleInternalName === 'admin' && (
            <>
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/roles" element={<Roles />} />
              <Route path="/profile/permissions" element={<Permissions />} />
              <Route path="/profile/users" element={<UsersPage />} />
            </>
          )}
          {/* Redirección por defecto según rol */}
          {!isAuthRoute && <Route path="*" element={defaultRoute} />}
        </Route>
        {/* Ruta pública de autenticación */}
        <Route
          path="/auth/signin"
          element={
            <>
              <PageTitle title="Signin | Pronto Pro" />
              <SignIn />
            </>
          }
        />
      </Routes>
    </>
  );
}

export default App;
