import * as React from "react";
import { Box, Heading, Image, VStack } from "@chakra-ui/react";

interface Props {}

export const HomePage: React.FC<Props> = ({}) => {
  return (
    <VStack width={"100%"} alignItems={"stretch"}>
      <Box>
        <Heading>My Canvases</Heading>
        <Box>hello</Box>
      </Box>

      {/*<RecorderAndUploader />*/}
    </VStack>
  );
};
