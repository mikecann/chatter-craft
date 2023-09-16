import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { HomePage } from "./home/HomePage";
import { LoginPage } from "./auth/LoginPage";
import { ErrorPage } from "./errors/ErrorPage";
import { CanvasPage } from "./canvas/CanvasPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <HomePage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/canvas/:canvasId",
        element: <CanvasPage />,
      },
    ],
  },
]);
