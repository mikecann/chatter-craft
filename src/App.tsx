import { Box, Center, Image, Spinner, VStack } from "@chakra-ui/react";
import useStoreUserEffect from "./auth/useStoreUserEffect";
import { AppMenu } from "./app/AppMenu";
import github from "./github-corner-right.svg";
import { Outlet } from "react-router-dom";
import { LoginPage } from "./auth/LoginPage";
import { useConvexAuth, useQuery } from "convex/react";
import { iife } from "./common/misc/misc";
import { FillSpaceSpinner } from "./common/misc/FillSpaceSpinner";
import { useFindMe } from "./common/useMe";

export default function App() {
  useStoreUserEffect();
  const { isLoading } = useConvexAuth();
  const me = useFindMe();
  return (
    <Box background={`#121212`} minHeight={"100dvh"} position={"relative"} overflowX={"hidden"}>
      <AppMenu />
      <VStack
        paddingTop={"70px"}
        //backgroundColor={"rgba(255,0,0,0.2)"}
      >
        <Box
          width={"100dvw"}
          minHeight={"calc(100dvh - 70px)"}
          //backgroundColor={"rgba(255,0,0,0.2)"}
        >
          {iife(() => {
            if (isLoading) return <FillSpaceSpinner />;
            if (!me) return <LoginPage />;
            return <Outlet />;
          })}
        </Box>
      </VStack>
      <Image
        position={"fixed"}
        cursor={"pointer"}
        onClick={() => window.open(`https://github.com/mikecann/chatter-craft`, `_blank`)}
        bottom={0}
        right={0}
        src={github}
        transform={"scale(1,-1)"}
      />
    </Box>
  );
}
