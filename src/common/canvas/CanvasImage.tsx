import * as React from "react";
import { Box, Image, ImageProps } from "@chakra-ui/react";

interface Props extends ImageProps {
  svgDocument: string;
}

export const CanvasImage: React.FC<Props> = ({ svgDocument, ...rest }) => {
  return <Image src={`data:image/svg+xml;utf8,${encodeURIComponent(svgDocument)}`} {...rest} />;
};
