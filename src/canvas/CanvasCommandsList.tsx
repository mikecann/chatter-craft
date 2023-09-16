import * as React from "react";
import { Avatar, Box, Heading, HStack, Spinner, Text, VStack } from "@chakra-ui/react";
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
    <VStack>
      <Heading size={"sm"}>Commands</Heading>
      {iife(() => {
        if (commands == undefined) return <Spinner />;

        return (
          <VStack
            width={"400px"}
            border={"1px solid rgba(255,255,255,0.5)"}
            minHeight={"100px"}
            backgroundColor={"rgba(255,255,255,0.05)"}
            borderRadius={"10px"}
            padding={"10px"}
          >
            {commands.map((command) => (
              <CommandListItem key={command._id} command={command} />
            ))}
          </VStack>
        );
      })}
    </VStack>
  );
};
