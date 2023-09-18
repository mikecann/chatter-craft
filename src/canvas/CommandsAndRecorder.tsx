import * as React from "react";
import { Box, VStack } from "@chakra-ui/react";
import { CanvasCommandsList } from "./CanvasCommandsList";
import { RecorderAndUploader } from "./RecorderAndUploader";
import { Id } from "../../convex/_generated/dataModel";

interface Props {
  canvasId: Id<"canvases">;
}

export const CommandsAndRecorder: React.FC<Props> = ({ canvasId }) => {
  return (
    <VStack
      border={"1px solid rgba(255,255,255,0.5)"}
      padding={"10px"}
      borderRadius={"10px"}
      alignItems={"stretch"}
    >
      <CanvasCommandsList canvasId={canvasId} />
      <RecorderAndUploader canvasId={canvasId} />
    </VStack>
  );
};
