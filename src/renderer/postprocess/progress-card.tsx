import { FC } from "react";
import { Heading, Spinner, Text } from "@radix-ui/themes";
import {
  HiOutlineCheckCircle,
  HiOutlineEllipsisHorizontalCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { useQuery } from "@tanstack/react-query";
import { ProgressStep } from "./progress-step";
import { useHistoryRecordings } from "../history/state";
import { ProgressCardWrapper } from "./progress-card-wrapper";
import { PostProcessingJob } from "../../types";
import type { getProgressData } from "../../main/domain/postprocess";
import { mainApi } from "../api";
import { QueryKeys } from "../../query-keys";

const baseSteps = [
  "wav",
  "mp3",
  "modelDownload",
  "summary",
  "datahooks",
] as const;

const stepLabels = {
  modelDownload: "Downloading AI models",
  wav: "Preparing audio",
  mp3: "Generating MP3 file",
  whisper: "Whisper transcription & diarization",
  maleo: "Maleo transcription & diarization",
  summary: "Generating summary",
  datahooks: "Running datahooks",
};

// Helper function to get the appropriate steps based on transcription engine setting
const getAllSteps = (transcriptionEngine: string) => {
  const steps = [...baseSteps];
  
  // Insert the appropriate transcription step based on the engine setting
  if (transcriptionEngine === "maleo") {
    steps.splice(3, 0, "maleo"); // Insert after modelDownload
  } else {
    steps.splice(3, 0, "whisper"); // Default to whisper
  }
  
  return steps;
};

export const ProgressCard: FC<{
  job: PostProcessingJob;
  data: Awaited<ReturnType<typeof getProgressData>>;
}> = ({ job, data }) => {
  const { data: recordings } = useHistoryRecordings();
  const { data: settings } = useQuery({
    queryKey: [QueryKeys.Settings],
    queryFn: mainApi.getSettings,
  });
  const recording = recordings?.[job.recordingId];
  const name = recording?.name ?? "Untitled recording";
  
  // Determine which transcription engine is being used
  const transcriptionEngine = settings?.transcription?.engine || "whisper";

  if (job.error) {
    return (
      <ProgressCardWrapper
        header={<Text color="red">{name}</Text>}
        icon={<HiOutlineExclamationTriangle color="var(--red-11)" />}
      >
        <pre
          style={{ overflowX: "auto", overflowY: "auto", maxHeight: "400px" }}
        >
          {job.error}
        </pre>
      </ProgressCardWrapper>
    );
  }

  if (job.isDone) {
    return (
      <ProgressCardWrapper
        header={
          <Text color="green">{recording?.name ?? "Untitled recording"}</Text>
        }
        icon={<HiOutlineCheckCircle color="var(--green-11)" />}
      />
    );
  }

  if (job.isRunning) {
    return (
      <ProgressCardWrapper
        icon={<Spinner size="3" />}
        header={
          <>
            <Heading>{name}</Heading>
            <Text>File is processing...</Text>
          </>
        }
      >
        {getAllSteps(transcriptionEngine)
          .filter((step) => !job.steps || job.steps.includes(step))
          .map((item, index) => (
            <ProgressStep
              key={item}
              label={stepLabels[item]}
              isRunning={item === data.currentStep}
              isDone={getAllSteps(transcriptionEngine).indexOf(data.currentStep as any) > index}
              progress={data.progress[item]}
            />
          ))}
      </ProgressCardWrapper>
    );
  }

  return (
    <ProgressCardWrapper
      icon={<HiOutlineEllipsisHorizontalCircle />}
      header={<Text>{recording?.name ?? "Untitled recording"}</Text>}
    />
  );
};
