import * as React from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { BsFillChatHeartFill } from "react-icons/bs";

interface Props {}

export const AppTitle: React.FC<Props> = ({}) => {
  return (
    <Box fontSize={"2em"} fontWeight={"bold"}>
      <HStack color={"white"} opacity={0.5} _hover={{ opacity: 0.9 }}>
        <BsFillChatHeartFill />
        <Text
          userSelect={"none"}
          cursor={"pointer"}
          onClick={() =>
            window.open(`https://mikecann.co.uk/posts/tinkering-with-convex`, `_blank`)
          }
        >
          ChatterCraft
        </Text>
      </HStack>
    </Box>
  );
};
