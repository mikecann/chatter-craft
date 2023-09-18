import * as React from "react";
import { Box, BoxProps, Center, Spinner, VStack } from "@chakra-ui/react";

interface Props extends BoxProps {}

export const FillSpaceSpinner: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  ...rest
}) => {
  return (
    <VStack justifyContent={"center"} width={`100%`} height={`100dvh`} {...(rest as any)}>
      <VStack>
        <Spinner size={"xl"} />
        <Box>{children}</Box>
      </VStack>
    </VStack>
  );
};
