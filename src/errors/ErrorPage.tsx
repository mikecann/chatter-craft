import * as React from "react";
import { Box, Button, Center, Code, Heading, Text, VStack } from "@chakra-ui/react";
import { Link, useRouteError } from "react-router-dom";
import { TbFaceIdError } from "react-icons/tb";
import { errorToString } from "../common/misc/errors";

interface Props {}

export const ErrorPage: React.FC<Props> = ({}) => {
  const error = useRouteError();
  console.error(error);
  return (
    <Center width={"100dvw"} height={"100dvh"}>
      <VStack maxWidth={"800px"} textAlign={"center"}>
        <TbFaceIdError fontSize={"10em"} />
        <Heading size={"xl"}>Whoopsie!</Heading>
        <Text>Sorry, an unexpected error has occurred.</Text>
        <Code padding={"20px"}>{errorToString(error)}</Code>
        <Button as={Link} to={"/"} colorScheme={"blue"}>
          Return Home
        </Button>
      </VStack>
    </Center>
  );
};
