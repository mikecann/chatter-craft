import * as React from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { BsFillChatHeartFill } from "react-icons/bs";

interface Props {}

export const AppTitle: React.FC<Props> = ({}) => {
  return (
    <Box
      position={"relative"}
      width={"1px"}
      height={"1px"}
      overflow={"visible"}
      fontSize={"2em"}
      fontWeight={"bold"}
    >
      <HStack
        position={"absolute"}
        top={"-0px"}
        left={`-3px`}
        color={"white"}
        transform={"rotate(-90deg)"}
        transformOrigin={"top left"}
      >
        <BsFillChatHeartFill />
        <Text
          opacity={0.5}
          width={"200px"}
          userSelect={"none"}
          cursor={"pointer"}
          _hover={{ opacity: 0.9 }}
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
