import * as React from "react";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { api } from "../../convex/_generated/api";
import { CanvasImage } from "../common/canvas/CanvasImage";
import { useNavigate } from "react-router-dom";

export type Canvas = (typeof api.canvases.list)["_returnType"][number];

interface Props {
  canvas: Canvas;
}

export const CanvasItem: React.FC<Props> = ({ canvas }) => {
  const navigate = useNavigate();
  return (
    <Card
      maxW="xs"
      _hover={{ filter: "brightness(1.1)" }}
      cursor={"pointer"}
      onClick={() => navigate(`/canvas/${canvas._id}`)}
    >
      <CardBody>
        <CanvasImage svgDocument={canvas.svgDocument} border={`1px dashed rgba(255,255,255,0.1)`} />
        <Stack marginTop={"10px"} spacing={0}>
          <Heading size="md">{canvas.name}</Heading>
          <Text fontSize={"0.8em"} color={"rgba(255,255,255,0.5)"}>
            Created at: <b>{new Date(canvas._creationTime).toLocaleString()}</b>
          </Text>
          <AvatarGroup size="md" max={5} marginTop={"20px"}>
            {canvas.members.map((member) => (
              <Avatar key={member.id} name={member.name} src={member.pictureUrl ?? undefined} />
            ))}
          </AvatarGroup>
        </Stack>
      </CardBody>
    </Card>
  );
};
