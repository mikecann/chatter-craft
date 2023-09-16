import * as React from "react";
import { AudioRecorder } from "./AudioRecorder";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;

interface Props {
  canvasId: Id<"canvases">;
}

export const RecorderAndUploader: React.FC<Props> = ({ canvasId }) => {
  const createCommand = useMutation(api.canvasCommands.createCanvasDocumentMutation);

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

        const resp = await createCommand({
          bytes: await blob.arrayBuffer(),
          canvasId,
        });

        console.log(`GOT RESPONSE`, resp);
      }}
    />
  );
};
