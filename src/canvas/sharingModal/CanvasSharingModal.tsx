import * as React from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Spinner,
  Stack,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useErrors } from "../../common/misc/useErrors";
import { Canvas } from "../CanvasPage";
import { ChatGPTModel, chatGPTModels } from "../../../convex/schema";
import { listForCanvas } from "../../../convex/canvasMembers";
import { MemberRow } from "./MemberRow";
import { AddMemberSection } from "./AddMemberSection";
import { CanvasVisibilitySection } from "./CanvasVisibilitySection";

interface Props {
  isOpen: boolean;
  onClose: () => unknown;
  canvas: Canvas;
}

export const CanvasSharingModal: React.FC<Props> = ({ isOpen, onClose, canvas }) => {
  const editSettings = useMutation(api.canvases.editSettings);
  const members = useQuery(api.canvasMembers.listForCanvas, { canvasId: canvas._id });

  const { onNonCriticalError } = useErrors();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"lg"}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Canvas Sharing Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody paddingBottom={"2em"}>
          <VStack spacing={"1em"}>
            <FormControl>
              <FormLabel>Visibility</FormLabel>
              <CanvasVisibilitySection canvas={canvas} />
            </FormControl>
            <FormControl>
              <FormLabel>Canvas Members</FormLabel>
              <VStack
                alignItems={"stretch"}
                backgroundColor={"rgba(0,0,0,0.1)"}
                spacing={"2px"}
                height={"200px"}
                overflowY={"auto"}
                padding={"10px"}
                borderRadius={"10px"}
              >
                {members ? (
                  members.map((member) => <MemberRow key={member._id} member={member} />)
                ) : (
                  <Spinner />
                )}
              </VStack>
            </FormControl>
            <FormControl>
              <FormLabel>Add Member</FormLabel>
              <AddMemberSection canvas={canvas} />
            </FormControl>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
