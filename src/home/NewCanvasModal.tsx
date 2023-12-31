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
import { api } from "../../convex/_generated/api";
import { useErrors } from "../common/misc/useErrors";
import { ChatGPTModel, chatGPTModels } from "../../convex/schema";
import { useNavigate } from "react-router-dom";

interface Props {
  isOpen: boolean;
  onClose: () => unknown;
}

const defaultName = "";

export const NewCanvasModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [name, setName] = useState(defaultName);
  const [model, setModel] = useState<ChatGPTModel>("chat_gpt_3.5_turbo");
  const [isLoading, setIsLoading] = useState(false);
  const create = useMutation(api.canvases.create);
  const { onNonCriticalError } = useErrors();
  const navigate = useNavigate();

  const onCreate = () => {
    setIsLoading(true);
    create({
      name,
      model,
    })
      .then((canvasId) => {
        navigate(`/canvas/${canvasId}`);
      })
      .catch(onNonCriticalError)
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"lg"}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create Canvas</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack>
            <FormControl>
              <FormLabel>Canvas Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCreate();
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
            onClick={onCreate}
            isLoading={isLoading}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
