import * as React from "react";
import { Box } from "@chakra-ui/react";
import { prettifyXml } from "../common/misc/xml";
import { CodeBlock, dracula } from "react-code-blocks";

interface Props {
  svgDocument: string;
}

export const DocumentCode: React.FC<Props> = ({ svgDocument }) => {
  return (
    <CodeBlock
      text={prettifyXml(svgDocument)}
      language={"svg"}
      showLineNumbers={true}
      startingLineNumber={1}
      theme={dracula}
    />
  );

  //<pre>{prettifyXml(svgDocument)}</pre>;
};
