import { useToast } from "@chakra-ui/react";
import { errorToString } from "./errors";

export const useErrors = () => {
  const toast = useToast();
  return {
    onSilentError(e: any) {
      console.error(`onSilentError`, e);
    },
    onNonCriticalError(e: any) {
      console.error(`onNonCriticalError`, e);
      toast({
        status: "error",
        title: errorToString(e),
        isClosable: true,
      });
    },
    onCriticalError(e: any) {
      console.error(`onCriticalError`, e);
      toast({
        status: "error",
        title: errorToString(e),
        isClosable: true,
      });
    },
  };
};
