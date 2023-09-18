import * as React from "react";
import { Avatar, Box, Center, Heading, HStack, Spinner, Text, VStack } from "@chakra-ui/react";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { iife } from "../common/misc/misc";
import { CommandListItem } from "./CommandListItem";
import { RecorderAndUploader } from "./RecorderAndUploader";

interface Props {
  canvasId: Id<"canvases">;
}

export const CanvasCommandsList: React.FC<Props> = ({ canvasId }) => {
  const commands = useQuery(api.canvasCommands.list, { canvasId: canvasId });

  return (
    <VStack alignItems={"stretch"} flex={1}>
      <Center backgroundColor={"rgba(255,255,255,0.05)"} padding={"5px"} borderRadius={"10px"}>
        <Heading size={"sm"}>Command History</Heading>
      </Center>
      {iife(() => {
        if (commands == undefined) return <Spinner />;

        return (
          <VStack
            width={"400px"}
            overflowY={"scroll"}
            //overscrollBehaviorY={"contain"}
            //scrollSnapType={"y proximity"}
            //flexDirection={"column-reverse"}
            paddingRight={"5px"}
            height={"calc(100vh - 300px)"}
            maxHeight={"500px"}
            backgroundColor={"rgba(255,255,255,0.05)"}
          >
            {commands.map((command, i) => (
              <CommandListItem
                key={command._id}
                command={command}
                isLast={i == commands.length - 1}
              />
            ))}
          </VStack>
        );
      })}
    </VStack>
  );
};
