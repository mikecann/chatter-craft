import * as React from "react";
import {
  Button,
  Center,
  Heading,
  HStack,
  Icon,
  IconButton,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ensure } from "../common/misc/ensure";
import { CommandsAndRecorder } from "./CommandsAndRecorder";
import { ImageAndCodeTabs } from "./ImageAndCodeTabs";
import { Link as ReactRouterLink } from "react-router-dom";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { EditCanvasSettingsModal } from "./editModal/EditCanvasSettingsModal";
import { HiOutlineCog6Tooth } from "react-icons/hi2";
import { FillSpaceSpinner } from "../common/misc/FillSpaceSpinner";
import { BsFillPeopleFill } from "react-icons/bs";
import { CanvasSharingModal } from "./sharingModal/CanvasSharingModal";

interface Props {}

export type Canvas = NonNullable<(typeof api.canvases.get)["_returnType"]>;

export const CanvasPage: React.FC<Props> = ({}) => {
  const params = useParams();
  const canvasId = ensure(params.canvasId as Id<"canvases">, "Canvas ID is required");
  const [isEditSettingsModalOpen, setIsEditSettingsModalOpen] = React.useState(false);
  const [isSharingSettingsModalOpen, setIsSharingSettingsModalOpen] = React.useState(false);
  const canvas = useQuery(api.canvases.get, { id: canvasId });

  if (!canvas) return <FillSpaceSpinner />;

  return (
    <Center width={"100%"} paddingTop={"15px"}>
      <VStack width={"100%"} maxWidth={"1000px"} alignItems={"stretch"} spacing={"20px"}>
        <HStack alignSelf={" tretch"} alignItems={"baseline"} fontSize={"1.3em"} spacing={"20px"}>
          <Button as={ReactRouterLink} to="/" leftIcon={<Icon as={AiOutlineArrowLeft} />}>
            Back
          </Button>
          <HStack flex={1}>
            <Heading size={"lg"}>{canvas.name}</Heading>
            <Icon
              opacity={0.5}
              _hover={{ opacity: 1 }}
              cursor={"pointer"}
              onClick={() => setIsEditSettingsModalOpen(true)}
              as={HiOutlineCog6Tooth}
            />
          </HStack>
          <Button
            leftIcon={<BsFillPeopleFill />}
            onClick={() => setIsSharingSettingsModalOpen(true)}
          >
            Sharing
          </Button>
        </HStack>
        <HStack
          alignItems={"flex-start"}
          justifyContent={"flex-start"}
          overflowX={"hidden"}
          padding={"0px"}
          spacing={"40px"}
        >
          <CommandsAndRecorder canvasId={canvasId} />
          <ImageAndCodeTabs svgDocument={canvas.svgDocument} />
        </HStack>
      </VStack>
      {isEditSettingsModalOpen && (
        <EditCanvasSettingsModal
          canvas={canvas}
          isOpen={isEditSettingsModalOpen}
          onClose={() => setIsEditSettingsModalOpen(false)}
        />
      )}
      {isSharingSettingsModalOpen && (
        <CanvasSharingModal
          canvas={canvas}
          isOpen={isSharingSettingsModalOpen}
          onClose={() => setIsSharingSettingsModalOpen(false)}
        />
      )}
    </Center>
  );
};
