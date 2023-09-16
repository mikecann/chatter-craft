import { StrictMode } from "react";
import "./index.css";
import App from "./App";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { createRoot } from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "./common/theme";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { router } from "./routes";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <ConvexProvider client={convex}>
        <ClerkProvider publishableKey="pk_test_bWF0dXJlLXJlZGZpc2gtOS5jbGVyay5hY2NvdW50cy5kZXYk">
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <RouterProvider router={router} />
          </ConvexProviderWithClerk>
        </ClerkProvider>
      </ConvexProvider>
    </ChakraProvider>
  </StrictMode>,
);
