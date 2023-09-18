import * as React from "react";
import { Box, Button, Center, Heading, Icon, Text, VStack } from "@chakra-ui/react";
import { useClerk } from "@clerk/clerk-react";
import { BsFillChatHeartFill } from "react-icons/bs";

interface Props {}

export const LoginPage: React.FC<Props> = ({}) => {
  const clerk = useClerk();
  return (
    <Center width={"100%"} height={"calc(100dvh - 90px)"}>
      <VStack
        padding={"20px"}
        backgroundColor={"rgba(255,255,255,0.1)"}
        borderRadius={"10px"}
        maxWidth={"300px"}
        textAlign={"center"}
      >
        <Icon as={BsFillChatHeartFill} color={"green.300"} fontSize={"6em"} />
        <Heading size="xl">Welcome to Chatter Craft!</Heading>
        <Text opacity={0.8}>Sign In to get started</Text>
        <Button colorScheme={"blue"} onClick={() => clerk.openSignIn()} marginTop={"20px"}>
          Sign In
        </Button>
      </VStack>
    </Center>
  );
};
