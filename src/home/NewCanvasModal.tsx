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
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useErrors } from "../common/misc/useErrors";

interface Props {
  isOpen: boolean;
  onClose: () => unknown;
}

const defaultName = "";

export const NewCanvasModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [name, setName] = useState(defaultName);
  const create = useMutation(api.canvases.create);
  const { onNonCriticalError } = useErrors();

  const onCreate = () => {
    create({
      name,
    })
      .then(() => {
        setName(defaultName);
      })
      .catch(onNonCriticalError);

    onClose();
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
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            transition={`all 0.2s ease`}
            isDisabled={name.length == 0}
            colorScheme={"blue"}
            onClick={onCreate}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
