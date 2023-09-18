import * as React from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
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
  Stack,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useErrors } from "../../common/misc/useErrors";
import { Canvas } from "../CanvasPage";
import { ChatGPTModel, chatGPTModels } from "../../../convex/schema";

interface Props {
  isOpen: boolean;
  onClose: () => unknown;
  canvas: Canvas;
}

export const EditCanvasSettingsModal: React.FC<Props> = ({ isOpen, onClose, canvas }) => {
  const [name, setName] = useState(canvas.name);
  const [model, setModel] = useState<ChatGPTModel>(canvas.model);
  const editSettings = useMutation(api.canvases.editSettings);
  const { onNonCriticalError } = useErrors();

  const onSave = () => {
    editSettings({
      canvasId: canvas._id,
      name,
      model,
    })
      .then(() => {
        setName("");
      })
      .catch(onNonCriticalError);

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"lg"}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Canvas Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack>
            <FormControl>
              <FormLabel>Canvas Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSave();
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Model</FormLabel>
              <RadioGroup onChange={(m) => setModel(m as any)} value={model}>
                <Stack direction="row">
                  {chatGPTModels.map((m) => (
                    <Radio key={m} value={m}>
                      {m}
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            transition={`all 0.2s ease`}
            isDisabled={name.length == 0}
            colorScheme={"blue"}
            onClick={onSave}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
