import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import CustomersPage from "./pages/CustomersPage";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={<Navigate to="/customers" replace />}
        />

        <Route
          path="/customers"
          element={<CustomersPage />}
        />
      </Route>
    </Routes>
  );
}