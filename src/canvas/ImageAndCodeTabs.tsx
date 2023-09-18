import * as React from "react";
import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { CanvasImage } from "../common/canvas/CanvasImage";
import { DocumentCode } from "./DocumentCode";

interface Props {
  svgDocument: string;
}

export const ImageAndCodeTabs: React.FC<Props> = ({ svgDocument }) => {
  return (
    <Tabs size="md" variant="enclosed">
      <TabList>
        <Tab>Image</Tab>
        <Tab>Code</Tab>
      </TabList>
      <TabPanels border={`1px solid rgba(255,255,255,0.2)`} minWidth={"500px"} minHeight={"500px"}>
        <TabPanel>
          <CanvasImage border={`1px dashed rgba(255,255,255,0.1)`} svgDocument={svgDocument} />
        </TabPanel>
        <TabPanel width={"498px"} height={"498px"}>
          <DocumentCode svgDocument={svgDocument} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
