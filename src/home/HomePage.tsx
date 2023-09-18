import * as React from "react";
import {
  Box,
  Button,
  Center,
  Heading,
  Icon,
  Image,
  Spinner,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { NewCanvasModal } from "./NewCanvasModal";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { iife } from "../common/misc/misc";
import { CanvasItem } from "./CanvasItem";
import { FillSpaceSpinner } from "../common/misc/FillSpaceSpinner";
import { listMyPrivateCanvases } from "../../convex/canvases";

interface Props {}

export const HomePage: React.FC<Props> = ({}) => {
  const [isNewCanvasModalOpen, setIsNewCanvasModalOpen] = React.useState(false);
  const canvases = useQuery(api.canvases.listMyPrivateCanvases);

  return (
    <Center width={"100%"}>
      <VStack width={"100%"} maxWidth={"800px"} alignItems={"stretch"}>
        <Box>
          <Heading>My Canvases</Heading>
          <Box
            backgroundColor={"rgba(255,255,255,0.1)"}
            padding={"20px"}
            borderRadius={"10px"}
            marginTop={"10px"}
          >
            {iife(() => {
              if (!canvases) return <FillSpaceSpinner />;

              if (canvases.length == 0)
                return (
                  <Center>
                    <VStack
                      border={"2px dashed rgba(255,255,255,0.1)"}
                      borderRadius={"6px"}
                      padding={"20px"}
                    >
                      <Text>You dont currently have any canvases</Text>
                      <Button colorScheme={"blue"} onClick={() => setIsNewCanvasModalOpen(true)}>
                        Create Canvas
                      </Button>
                    </VStack>
                  </Center>
                );

              return (
                <VStack width={"100%"} alignItems={"flex-start"}>
                  <Box
                    alignSelf={"stretch"}
                    background={"rgba(255,255,255,0.05)"}
                    padding={`10px`}
                    borderRadius={"10px"}
                  >
                    <Button colorScheme={"green"} onClick={() => setIsNewCanvasModalOpen(true)}>
                      Create Canvas
                    </Button>
                  </Box>
                  <Wrap padding={"20px"} justifyContent={"space-evenly"}>
                    {canvases.map((canvas) => (
                      <WrapItem key={canvas._id}>
                        <CanvasItem canvas={canvas} />
                      </WrapItem>
                    ))}
                  </Wrap>
                </VStack>
              );
            })}
          </Box>
        </Box>

        {/*<Box>*/}
        {/*  <Heading>Public Canvases</Heading>*/}
        {/*  <Box>hello</Box>*/}
        {/*</Box>*/}

        {/*<RecorderAndUploader />*/}

        <NewCanvasModal
          isOpen={isNewCanvasModalOpen}
          onClose={() => setIsNewCanvasModalOpen(false)}
        />
      </VStack>
    </Center>
  );
};
