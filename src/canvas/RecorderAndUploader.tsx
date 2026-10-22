import * as React from "react";
import { AudioRecorder } from "./AudioRecorder";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useErrors } from "../common/misc/useErrors";

const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;

interface Props {
  canvasId: Id<"canvases">;
}

export const RecorderAndUploader: React.FC<Props> = ({ canvasId }) => {
  const createCommand = useMutation(api.canvasCommands.createCanvasDocumentMutation);
  const { onNonCriticalError } = useErrors();

  return (
    <AudioRecorder
      onNewRecording={async (blob) => {
        console.log(`convexSiteUrl`, convexSiteUrl);

        const url = new URL(`${convexSiteUrl}/addRecording`);
        //url.searchParams.set("author", "Jack Smith");

        console.log(`uploading recording..`, { blob, url });

        // const formData = new FormData();
        // formData.append("audio", blob, "audio.webm");

        try {
          const resp = await createCommand({
            bytes: await blob.arrayBuffer(),
            canvasId,
          });

          console.log(`GOT RESPONSE`, resp);
        } catch (err) {
          // e.g. an unsupported recording format or a reached usage limit
          onNonCriticalError(err);
        }
      }}
    />
  );
};
