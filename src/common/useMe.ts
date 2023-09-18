import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ensure } from "./misc/ensure";

export const useFindMe = () => useQuery(api.users.findMe);

export const useGetMe = () => ensure(useFindMe(), `not authenticated`);
