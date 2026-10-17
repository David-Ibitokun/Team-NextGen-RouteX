import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { MapPage } from "../pages/MapPage";
import { ReportHazardPage } from "../pages/ReportHazardPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { CustomerDashboardPage } from "../pages/CustomerDashboardPage";
import { ModerationPage } from "../pages/ModerationPage";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/map",
    element: <MapPage />,
  },
  {
    path: "/report",
    element: <ReportHazardPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/dashboard",
    element: <CustomerDashboardPage />,
  },
  {
    path: "/my-reports",
    element: <CustomerDashboardPage />,
  },
  {
    path: "/moderator",
    element: <ModerationPage />,
  },
  {
    path: "/moderation",
    element: <ModerationPage />,
  },
  {
    path: "/admin",
    element: <AdminDashboardPage />,
  },
  {
    path: "/admin-dashboard",
    element: <AdminDashboardPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
