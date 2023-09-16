import { Box, Center, Image, VStack } from "@chakra-ui/react";
import useStoreUserEffect from "./auth/useStoreUserEffect";
import { AppMenu } from "./app/AppSidebar";
import github from "./github-corner-right.svg";
import { Outlet } from "react-router-dom";

export default function App() {
  useStoreUserEffect();
  return (
    <Box background={`#121212`} minHeight={"100dvh"} position={"relative"}>
      <AppMenu />
      <VStack
        paddingTop={"70px"}
        //backgroundColor={"rgba(255,0,0,0.2)"}
        minHeight={"calc(100dvh)"}
      >
        <VStack
          width={"100%"}
          maxWidth={"800px"}
          padding={"10px"}
          //backgroundColor={"rgba(255,0,0,0.2)"}
        >
          <Outlet />
        </VStack>
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
