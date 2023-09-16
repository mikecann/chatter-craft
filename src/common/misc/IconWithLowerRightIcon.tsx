import * as React from "react";
import { Box, Icon, IconProps } from "@chakra-ui/react";

interface Props extends IconProps {
  as?: any;
  lowerRightIcon?: React.ReactNode;
}

export const IconWithLowerRightIcon: React.FC<Props> = ({ lowerRightIcon, as, ...rest }) => {
  return (
    <Box position={"relative"}>
      <Icon as={as} {...rest} />
      <Box position={"absolute"} bottom={0} right={0} fontSize={"0.5em"}>
        {lowerRightIcon}
      </Box>
    </Box>
  );
};
