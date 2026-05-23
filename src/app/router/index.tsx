import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { appConfig } from '@/config/env'
import { AdminLayout } from '@/layouts/AdminLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AdminPage } from '@/pages/AdminPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ROUTES } from '@/shared/constants/routes'

export const router = createBrowserRouter(
  [
    {
      path: ROUTES.home,
      element: <PublicLayout />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: ROUTES.login,
          element: <LoginPage />,
        },
      ],
    },
    {
      path: ROUTES.admin,
      element: (
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <AdminPage />,
        },
      ],
    },
    {
      path: ROUTES.notFound,
      element: <NotFoundPage />,
    },
  ],
  {
    basename: appConfig.basePath,
  },
)
