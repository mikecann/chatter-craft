import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export const useIsAuthenticated = () => {
  const { isLoading } = useConvexAuth();
  const me = useQuery(api.users.findMe);
  return me != null && !isLoading;
};
