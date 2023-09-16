import * as React from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { BsFillChatHeartFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";

interface Props {}

export const AppTitle: React.FC<Props> = ({}) => {
  const navigate = useNavigate();
  return (
    <Box fontSize={"2em"} fontWeight={"bold"}>
      <HStack color={"white"} opacity={0.5} _hover={{ opacity: 0.9 }}>
        <BsFillChatHeartFill />
        <Text userSelect={"none"} cursor={"pointer"} onClick={() => navigate("/")}>
          ChatterCraft
        </Text>
      </HStack>
    </Box>
  );
};
