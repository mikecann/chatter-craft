import * as React from "react";
import {
  Avatar,
  AvatarGroup,
  Card,
  CardBody,
  Heading,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/react";
import { api } from "../../convex/_generated/api";
import { CanvasImage } from "../common/canvas/CanvasImage";
import { useNavigate } from "react-router-dom";
import { BsFillTrash3Fill } from "react-icons/bs";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import { useMutation, useQuery } from "convex/react";
import { useErrors } from "../common/misc/useErrors";

export type Canvas = (typeof api.canvases.listMyPrivateCanvases)["_returnType"][number];

interface Props {
  canvas: Canvas;
}

export const CanvasItem: React.FC<Props> = ({ canvas }) => {
  const navigate = useNavigate();
  const destroy = useMutation(api.canvases.destroy);
  const { onNonCriticalError } = useErrors();
  const me = useQuery(api.users.findMe);

  const amIOwner = canvas.contributors.some((m) => m.userId == me?._id && m.role == "owner");

  return (
    <Card
      maxW="xs"
      border={`1px solid rgba(255,255,255,0)`}
      _hover={{ border: `1px solid rgba(255,255,255,0.5)` }}
      transition={"all 0.2s ease"}
    >
      <CardBody>
        <CanvasImage
          svgDocument={canvas.svgDocument}
          border={`1px dashed rgba(255,255,255,0.1)`}
          onClick={() => navigate(`/canvas/${canvas._id}`)}
          cursor={"pointer"}
        />
        <Stack marginTop={"10px"} spacing={0}>
          <Heading size="md">{canvas.name}</Heading>
          <Text fontSize={"0.8em"} color={"rgba(255,255,255,0.5)"}>
            Created at: <b>{new Date(canvas._creationTime).toLocaleString()}</b>
          </Text>

          <HStack alignItems={"flex-end"}>
            <AvatarGroup size="md" max={5} marginTop={"20px"} flex={1}>
              {canvas.contributors.map((contributor) => (
                <Avatar
                  key={contributor.id}
                  name={contributor.name}
                  src={contributor.pictureUrl ?? undefined}
                />
              ))}
            </AvatarGroup>
            <Menu>
              <MenuButton
                as={IconButton}
                size={"sm"}
                aria-label="Options"
                icon={<BiDotsHorizontalRounded />}
                variant="outline"
              />
              <MenuList>
                <MenuItem
                  icon={<BsFillTrash3Fill />}
                  disabled={true}
                  onClick={(e) => {
                    if (!amIOwner) {
                      onNonCriticalError(`Cannot delete, you are not an owner!`);
                      return;
                    }
                    destroy({ canvasId: canvas._id }).catch(onNonCriticalError);
                    e.stopPropagation();
                    return false;
                  }}
                >
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Stack>
      </CardBody>
    </Card>
  );
};
