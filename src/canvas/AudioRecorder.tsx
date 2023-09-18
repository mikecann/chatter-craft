import * as React from "react";
import {
  Box,
  Button,
  Center,
  CircularProgress,
  CircularProgressLabel,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FaMicrophoneAlt, FaMicrophoneAltSlash } from "react-icons/fa";
import { useErrors } from "../common/misc/useErrors";
import { match } from "../common/misc/match";
import { useTick } from "../common/misc/hooks";

const maxRecordTimeMs = 10000;
const SILENCE_THRESHOLD = 0;

type Status =
  | {
      kind: "stopped";
    }
  | {
      kind: "recording";
      startedAt: number;
      context: AudioContext;
      analyser: AnalyserNode;
      stream: MediaStream;
      recorder: MediaRecorder;
      data: Blob[];
    };

interface Props {
  onNewRecording: (data: Blob[]) => unknown;
}

export const AudioRecorder: React.FC<Props> = ({ onNewRecording }) => {
  const [status, setStatus] = useState<Status>({ kind: "stopped" });
  const micRef = useRef<HTMLDivElement>(null);

  useTick(status.kind == "stopped" ? 99999999999 : 1000);

  const { onNonCriticalError } = useErrors();

  useEffect(() => {
    if (status.kind != "recording") return;

    let exited = false;

    const dataArray = new Uint8Array(status.analyser.fftSize);
    const checkSilence = () => {
      if (exited) return;

      status.analyser.getByteTimeDomainData(dataArray);

      const rms = Math.sqrt(
        dataArray.reduce((acc, val) => acc + (val - 128) ** 2, 0) / dataArray.length,
      );

      //console.log(rms);

      if (micRef.current) micRef.current.style.opacity = `${rms / 8}`;
      requestAnimationFrame(checkSilence);

      // const isCurrentlySilent = rms < SILENCE_THRESHOLD;
      // setIsSilent(isCurrentlySilent);

      // if (isCurrentlySilent) {
      //   console.error("Silence detected, stopping recording");
      //   stopRecording();
      // } else {
      //   requestAnimationFrame(checkSilence);
      // }
    };

    checkSilence();

    return () => {
      exited = true;
    };
  }, [status.kind]);

  const startRecording = async () => {
    try {
      const context = new AudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      source.connect(analyser);

      const data: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => data.push(e.data);
      recorder.start();

      setStatus({
        kind: "recording",
        startedAt: Date.now(),
        analyser,
        context,
        stream,
        recorder,
        data,
      });
    } catch (err) {
      onNonCriticalError(err);
    }
  };

  const stopRecording = () => {
    if (status.kind != "recording") return;
    status.context.close();
    status.stream.getTracks().forEach((track) => track.stop());
    status.recorder.stop();
    setStatus({ kind: "stopped" });
  };

  const endRecording = () => {
    if (status.kind != "recording") return;
    status.recorder.addEventListener("stop", (e) => {
      onNewRecording(status.data);
    });
    stopRecording();
  };

  const cancelRecording = () => {
    stopRecording();
  };

  const timeRemainingMs =
    status.kind == "recording" ? maxRecordTimeMs - (Date.now() - status.startedAt) : 99;

  useEffect(() => {
    if (timeRemainingMs <= 0) stopRecording();
  }, [timeRemainingMs]);

  //const [sliderValue, setSliderValue] = useState(50);

  return (
    <HStack
      backgroundColor={"rgba(255,255,255,0.1)"}
      padding={"10px"}
      borderRadius={"10px"}
      justifyContent={"space-evenly"}
    >
      {status.kind == "recording" ? (
        <VStack>
          <Button onClick={endRecording} colorScheme={"red"}>
            End Recording
          </Button>
          <Button onClick={cancelRecording} colorScheme={"yellow"}>
            Cancel Recording
          </Button>
        </VStack>
      ) : (
        <Button onClick={startRecording} colorScheme={"green"}>
          Start Recording
        </Button>
      )}

      <Box>
        <CircularProgress
          value={match(status, {
            recording: ({ startedAt }) => ((Date.now() - startedAt) / maxRecordTimeMs) * 100,
            stopped: () => 0,
          })}
          color="green.400"
          size={"2.5em"}
        >
          <CircularProgressLabel>
            <Center position={"relative"}>
              {status.kind == "recording" && (
                <Box
                  width={"10px"}
                  height={"10px"}
                  backgroundColor={"#ee2e2e"}
                  position={"absolute"}
                  top={"0px"}
                  right={"40px"}
                  borderRadius={"50%"}
                ></Box>
              )}
              <Center
                ref={micRef}
                opacity={status.kind == "recording" ? undefined : 0.6}
                fontSize={"6em"}
              >
                {match(status, {
                  recording: () => <FaMicrophoneAlt />,
                  stopped: () => <FaMicrophoneAltSlash />,
                })}
              </Center>
            </Center>
          </CircularProgressLabel>
        </CircularProgress>
      </Box>

      {/*<Slider aria-label="slider-ex-4" defaultValue={30} onChange={(val) => setSliderValue(val)}>*/}
      {/*  <SliderMark value={25}>25%</SliderMark>*/}
      {/*  <SliderMark value={50}>50%</SliderMark>*/}
      {/*  <SliderMark value={75}>75%</SliderMark>*/}
      {/*  <SliderMark*/}
      {/*    value={sliderValue}*/}
      {/*    textAlign="center"*/}
      {/*    bg="blue.500"*/}
      {/*    color="white"*/}
      {/*    mt="-10"*/}
      {/*    ml="-5"*/}
      {/*    w="12"*/}
      {/*  >*/}
      {/*    {sliderValue}%*/}
      {/*  </SliderMark>*/}
      {/*  <SliderTrack bg="green.100">*/}
      {/*    <SliderFilledTrack bg="green.400" />*/}
      {/*  </SliderTrack>*/}
      {/*  <SliderThumb boxSize={6}>*/}
      {/*    <Box color="green.400" as={MdGraphicEq} />*/}
      {/*  </SliderThumb>*/}
      {/*</Slider>*/}
    </HStack>
  );
};
