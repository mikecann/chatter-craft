import * as React from "react";
import {
  Avatar,
  Box,
  Center,
  Heading,
  HStack,
  Icon,
  Spinner,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { api } from "../../convex/_generated/api";
import { match } from "../common/misc/match";
import {
  BiDotsHorizontalRounded,
  BiSolidErrorCircle,
  BiSolidMessageSquareEdit,
} from "react-icons/bi";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { PiSpeakerSimpleHighDuotone } from "react-icons/pi";
import { IconWithLowerRightIcon } from "../common/misc/IconWithLowerRightIcon";
import { CommandActionKindIcon } from "./CommandActionKindIcon";
import { formatDuration, getDuration, getDurationFromRange } from "../common/misc/duration";

export type Command = (typeof api.canvasCommands.list)["_returnType"][number];

interface Props {
  command: Command;
}

export const CommandListItem: React.FC<Props> = ({ command }) => {
  const duration = getDurationFromRange(command._creationTime, Date.now());
  return (
    <HStack
      width={"100%"}
      border={"1px solid rgba(255,255,255,0.1)"}
      borderRadius={"6px"}
      padding={"5px"}
      justifyContent={"flex-start"}
    >
      <Avatar name={command.author.name} src={command.author.pictureUrl ?? undefined} />
      <VStack alignItems={"flex-start"} spacing={0} flex={1}>
        <HStack>
          <Heading size={"xs"}>{command.author.name} </Heading>
          <Box opacity={0.5}>
            <Tooltip label={command.action.kind}>
              <Box>
                <CommandActionKindIcon kind={command.action.kind} />
              </Box>
            </Tooltip>
          </Box>
        </HStack>
        <Text fontSize={"xs"} color={"white"} opacity={0.5} marginTop={"-5px"}>
          {formatDuration(duration, "single_long")} ago
        </Text>
        <Text>
          {match(command.action.status, {
            not_started: () => "...",
            transcoding: () => "transcoding..",
            mutating: () => command.action.transcodedCommandText,
            errored: () => command.action.errorMessage,
            success: () => command.action.transcodedCommandText,
          })}
        </Text>
      </VStack>
      <Tooltip label={command.action.status.kind}>
        <Center
          height={"100%"}
          fontSize={"2em"}
          backgroundColor={"rgba(255,255,255,0.05)"}
          padding={"0px 5px"}
        >
          {match(command.action.status, {
            not_started: () => (
              <IconWithLowerRightIcon
                as={BiDotsHorizontalRounded}
                lowerRightIcon={<Spinner size={"xs"} />}
              />
            ),
            transcoding: () => (
              <IconWithLowerRightIcon
                as={PiSpeakerSimpleHighDuotone}
                color={"blue"}
                lowerRightIcon={<Spinner size={"xs"} />}
              />
            ),
            mutating: () => (
              <IconWithLowerRightIcon
                as={BiSolidMessageSquareEdit}
                color={"blue"}
                lowerRightIcon={<Spinner size={"xs"} />}
              />
            ),
            errored: () => <Icon as={BiSolidErrorCircle} color={"red"} />,
            success: () => <Icon as={BsFillCheckCircleFill} color={"green"} />,
          })}
        </Center>
      </Tooltip>
    </HStack>
  );
};
