import * as React from "react";
import { AudioRecorder } from "./AudioRecorder";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;

interface Props {
  children?: React.ReactNode;
}

export const RecorderAndUploader: React.FC<Props> = ({ children }) => {
  const transcode = useAction(api.openai.transcode);

  return (
    <AudioRecorder
      onNewRecording={async (audioData) => {
        console.log(`convexSiteUrl`, convexSiteUrl);

        const url = new URL(`${convexSiteUrl}/addRecording`);
        //url.searchParams.set("author", "Jack Smith");

        console.log(`uploading recording..`, { audioData, url });

        const blob = new Blob(audioData, { type: "audio/webm;codecs=opus" });
        // const formData = new FormData();
        // formData.append("audio", blob, "audio.webm");

        const resp = await transcode({
          bytes: await blob.arrayBuffer(),
        });

        console.log(`GOT RESPONSE`, resp);
      }}
    />
  );
};
