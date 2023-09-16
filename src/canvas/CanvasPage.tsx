import * as React from "react";
import { Box, HStack, Spinner, VStack } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { CanvasImage } from "../common/canvas/CanvasImage";
import { CanvasCommandsList } from "./CanvasCommandsList";
import { ensure } from "../common/misc/ensure";
import { RecorderAndUploader } from "./RecorderAndUploader";

interface Props {}

export const CanvasPage: React.FC<Props> = ({}) => {
  const params = useParams();
  const canvasId = ensure(params.canvasId as Id<"canvases">, "Canvas ID is required");

  const canvas = useQuery(api.canvases.get, { id: canvasId });

  if (!canvas) return <Spinner />;

  return (
    <HStack alignItems={"flex-start"}>
      <VStack>
        <RecorderAndUploader canvasId={canvasId} />
        <CanvasCommandsList canvasId={canvasId} />
      </VStack>
      <CanvasImage border={`1px dashed rgba(255,255,255,0.1)`} svgDocument={canvas.svgDocument} />
    </HStack>
  );
};
