import * as React from "react";
import { Box, Radio, RadioGroup, Stack, Tooltip } from "@chakra-ui/react";
import { Canvas } from "../CanvasPage";
import { canvasVisibilities } from "../../../convex/schema";
import { useFindMe } from "../../common/useMe";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useErrors } from "../../common/misc/useErrors";

interface Props {
  canvas: Canvas;
}

export const CanvasVisibilitySection: React.FC<Props> = ({ canvas }) => {
  const me = useFindMe();
  const myMembership = useQuery(
    api.canvasMembers.findForUser,
    me ? { userId: me._id, canvasId: canvas._id } : "skip",
  );
  const changeVisibility = useMutation(api.canvases.changeVisibility);
  const { onNonCriticalError } = useErrors();

  const meIsOwner = myMembership?.role == "owner";
  const hasSufficientPermissions = meIsOwner != false;

  return (
    <Tooltip
      label={
        hasSufficientPermissions
          ? `This feature is not finished, disabled for now!`
          : `You must be an owner to change the visibility`
      }
    >
      <RadioGroup
        onChange={(m) => {
          // changeVisibility({ visibility: m as any, canvasId: canvas._id }).catch(
          //   onNonCriticalError,
          // );
        }}
        value={canvas.visibility}
        isDisabled={!hasSufficientPermissions && false}
        cursor={"not-allowed"}
      >
        <Stack direction="row" cursor={"not-allowed"}>
          {canvasVisibilities.map((m) => (
            <Radio key={m} value={m}>
              {m}
            </Radio>
          ))}
        </Stack>
      </RadioGroup>
    </Tooltip>
  );
};
