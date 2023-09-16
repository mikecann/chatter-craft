import * as React from "react";
import { AppTitle } from "./AppTitle";
import { MyAvatar } from "./MyAvatar";
import { Box, Center, HStack, VStack } from "@chakra-ui/react";

interface Props {}

export const AppMenu: React.FC<Props> = ({}) => {
  return (
    <HStack
      width={"100dvw"}
      position={"fixed"}
      background={"#1D1D1D"}
      borderRadius={"5px"}
      boxShadow={"4px 0px 2px #111"}
      top={0}
      left={0}
      padding={"10px 10px"}
      spacing={`20px`}
      zIndex={100}
    >
      <AppTitle />
      <Box flex={1} />
      <Center>
        <MyAvatar />
      </Center>
    </HStack>
  );
};
