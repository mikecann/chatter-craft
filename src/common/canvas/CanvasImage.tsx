import * as React from "react";
import { Box, Image, ImageProps } from "@chakra-ui/react";

interface Props extends ImageProps {
  svgDocument: string;
}

export const CanvasImage: React.FC<Props> = ({ svgDocument, ...rest }) => {
  return (
    <Image
      src={`data:image/svg+xml;utf8,${encodeURIComponent(svgDocument)}`}
      backgroundImage={` repeating-conic-gradient(rgba(255,255,255,0.05) 0% 25%, transparent 0% 50%) 
      50% / 20px 20px`}
      backgroundSize={"20px 20px"}
      {...rest}
    />
  );
};
