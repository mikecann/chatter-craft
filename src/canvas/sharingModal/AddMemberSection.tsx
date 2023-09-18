import * as React from "react";
import { Box, Button, HStack, Input, Tooltip } from "@chakra-ui/react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useErrors } from "../../common/misc/useErrors";
import { Canvas } from "../CanvasPage";
import { useFindMe } from "../../common/useMe";

interface Props {
  canvas: Canvas;
}

export const AddMemberSection: React.FC<Props> = ({ canvas }) => {
  const [email, setEmail] = useState("");
  const addMember = useMutation(api.canvasMembers.addMember);
  const { onNonCriticalError } = useErrors();
  const [isLoading, setIsLoading] = useState(false);
  const me = useFindMe();
  const myMembership = useQuery(
    api.canvasMembers.findForUser,
    me ? { userId: me._id, canvasId: canvas._id } : "skip",
  );

  const meIsOwner = myMembership?.role == "owner";
  const hasSufficientPermissions = meIsOwner != false;

  return (
    <Tooltip label={hasSufficientPermissions ? null : `Must be an owner to add more members!`}>
      <HStack>
        <Input
          isDisabled={isLoading || !hasSufficientPermissions}
          placeholder={"Email"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button
          isLoading={isLoading}
          isDisabled={isLoading || !hasSufficientPermissions}
          onClick={() => {
            addMember({ canvasId: canvas._id, email })
              .then(() => setEmail(""))
              .catch(onNonCriticalError)
              .finally(() => setIsLoading(false));
          }}
        >
          Add
        </Button>
      </HStack>
    </Tooltip>
  );
};
