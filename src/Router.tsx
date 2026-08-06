import { Route, Routes } from 'react-router-dom'

import { appLayout, authLayout, publicRoutes } from './config/routes'

export function Router() {
  return (
    <Routes>
      {publicRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      <Route element={authLayout.element}>
        {authLayout.routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>

      <Route element={appLayout.element}>
        {appLayout.routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>
    </Routes>
  )
}
