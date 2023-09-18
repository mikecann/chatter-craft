import * as React from "react";
import {
  Alert,
  AlertIcon,
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
import { BsFillCheckCircleFill, BsRobot } from "react-icons/bs";
import { PiSpeakerSimpleHighDuotone } from "react-icons/pi";
import { IconWithLowerRightIcon } from "../common/misc/IconWithLowerRightIcon";
import { CommandActionKindIcon } from "./CommandActionKindIcon";
import { formatDuration, getDuration, getDurationFromRange } from "../common/misc/duration";
import { useEffect, useRef } from "react";

export type Command = (typeof api.canvasCommands.list)["_returnType"][number];

interface Props {
  command: Command;
  isLast: boolean;
}

export const CommandListItem: React.FC<Props> = ({ command, isLast }) => {
  const duration = getDurationFromRange(command._creationTime, Date.now());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLast) return;
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [ref, isLast]);

  return (
    <HStack
      ref={ref}
      width={"100%"}
      border={"1px solid rgba(255,255,255,0.1)"}
      borderRadius={"6px"}
      justifyContent={"flex-start"}
    >
      <HStack width={"100%"} padding={"5px"} justifyContent={"flex-start"}>
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
          <Text>{command.action.transcodedCommandText}</Text>
          {command.action.errorMessage && (
            <Alert status="error">
              <AlertIcon />
              {command.action.errorMessage}
            </Alert>
          )}
        </VStack>
      </HStack>
      <Tooltip label={command.action.status.kind}>
        <Center
          alignSelf={"stretch"}
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
                lowerRightIcon={<Spinner size={"xs"} />}
              />
            ),
            mutating: () => (
              <IconWithLowerRightIcon as={BsRobot} lowerRightIcon={<Spinner size={"xs"} />} />
            ),
            errored: () => <Icon as={BiSolidErrorCircle} color={"red.500"} />,
            success: () => <Icon as={BsFillCheckCircleFill} color={"green.500"} />,
          })}
        </Center>
      </Tooltip>
    </HStack>
  );
};
