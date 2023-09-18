import * as React from "react";
import { Avatar, Box, HStack, IconButton, Select, Spinner, Tooltip } from "@chakra-ui/react";
import { api } from "../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { canvasMemberRoles } from "../../../convex/schema";
import { useState } from "react";
import { useFindMe, useGetMe } from "../../common/useMe";
import { IoMdTrash } from "react-icons/io";
import { findForUser } from "../../../convex/canvasMembers";
import { iife } from "../../common/misc/misc";
import { useErrors } from "../../common/misc/useErrors";

export type Member = NonNullable<(typeof api.canvasMembers.listForCanvas)["_returnType"]>[number];

interface Props {
  member: Member;
}

export const MemberRow: React.FC<Props> = ({ member }) => {
  const user = useQuery(api.users.get, { id: member.userId });
  const me = useFindMe();
  const [role, setRole] = useState(member.role);
  const { onNonCriticalError } = useErrors();

  const remove = useMutation(api.canvasMembers.removeMember);

  const myMembership = useQuery(
    api.canvasMembers.findForUser,
    me ? { userId: me._id, canvasId: member.canvasId } : "skip",
  );

  if (!user) return <Spinner />;

  const isMe = me?._id == member.userId;
  const meIsOwner = myMembership?.role == "owner";

  return (
    <HStack backgroundColor={"rgba(0,0,0,0.1)"} padding={"5px"}>
      <Avatar name={user.name} src={user.pictureUrl ?? ""} size={"sm"} />
      <Box flex={1}>{user.name}</Box>
      <Tooltip
        label={iife(() => {
          if (isMe) return `Cannot change your own role!`;
          if (!meIsOwner) return `Cannot change a role unless you are an owner!`;
          return null;
        })}
      >
        <Box>
          <Select
            isDisabled={isMe || !meIsOwner}
            value={role}
            size={"sm"}
            width={"100px"}
            onChange={(e) => {
              const before = role;
              setRole(e.target.value as any);
            }}
          >
            {canvasMemberRoles.map((role) => (
              <option value={role}>{role}</option>
            ))}
          </Select>
        </Box>
      </Tooltip>
      <Tooltip
        label={iife(() => {
          if (isMe) return `Cannot remove yourself as a member!`;
          if (!meIsOwner) return `Cannot change remove a member unless you are an owner!`;
          return null;
        })}
      >
        <Box>
          <IconButton
            size={"sm"}
            isDisabled={isMe || !meIsOwner}
            aria-label="Remove"
            onClick={() => remove({ memberId: member._id }).catch(onNonCriticalError)}
            icon={<IoMdTrash />}
          />
        </Box>
      </Tooltip>
    </HStack>
  );
};
