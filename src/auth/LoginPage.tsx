import * as React from "react";
import { Box, Button, Center, Heading, Text, VStack } from "@chakra-ui/react";
import { useClerk } from "@clerk/clerk-react";

interface Props {}

export const LoginPage: React.FC<Props> = ({}) => {
  const clerk = useClerk();
  return (
    <Center width={"100%"} height={"calc(100dvh - 90px)"}>
      <VStack
        padding={"20px"}
        backgroundColor={"rgba(255,255,255,0.1)"}
        borderRadius={"10px"}
        maxWidth={"250px"}
        textAlign={"center"}
      >
        <Heading size="lg">Welcome to Chatter Craft!</Heading>
        <Text>Sign In to get started</Text>
        <Button colorScheme={"blue"} onClick={() => clerk.openSignIn()}>
          Sign In
        </Button>
      </VStack>
    </Center>
  );
};
