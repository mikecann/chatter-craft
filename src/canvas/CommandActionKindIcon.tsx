import * as React from "react";
import { Box, Icon } from "@chakra-ui/react";
import { Doc } from "../../convex/_generated/dataModel";
import { match } from "../common/misc/match";
import { BiEditAlt } from "react-icons/bi";

interface Props {
  kind: Doc<"canvasCommands">["action"]["kind"];
}

export const CommandActionKindIcon: React.FC<Props> = ({ kind }) => {
  return (
    <>
      {match(kind, {
        mutate_canvas_document: () => <Icon as={BiEditAlt} />,
      })}
    </>
  );
};
