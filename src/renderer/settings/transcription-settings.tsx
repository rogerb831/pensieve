import { FC } from "react";
import { useFormContext } from "react-hook-form";
import * as Tabs from "@radix-ui/react-tabs";
import { Settings } from "../../types";
import { SettingsSelectField } from "./settings-select-field";
import { SettingsSwitchField } from "./settings-switch-field";
import { SettingsTextField } from "./settings-text-field";
import { SettingsTab } from "./tabs";

export const TranscriptionSettings: FC = () => {
  const form = useFormContext<Settings>();
  const selectedEngine = form.watch("transcription.engine") || "whisper";

  return (
    <Tabs.Content value={SettingsTab.Transcription}>
      <SettingsSelectField
        form={form}
        field="transcription.engine"
        label="Transcription Engine"
        description="Choose between Whisper (traditional) or Maleo (advanced speaker diarization)"
        values={{
          "whisper": "Whisper",
          "maleo": "Maleo (Speaker Similarity)"
        }}
      />

      {selectedEngine === "whisper" && (
        <>
          <SettingsTextField
            {...form.register("transcription.whisper.model")}
            label="Model"
            description="Whisper model to use for transcription"
          />

          <SettingsTextField
            {...form.register("transcription.whisper.threads")}
            label="Threads"
            description="Number of threads to use"
            type="number"
          />

          <SettingsTextField
            {...form.register("transcription.whisper.processors")}
            label="Processors"
            description="Number of processors to use"
            type="number"
          />

          <SettingsTextField
            {...form.register("transcription.whisper.maxContext")}
            label="Max Context"
            description="Maximum context size"
            type="number"
          />

          <SettingsTextField
            {...form.register("transcription.whisper.maxLen")}
            label="Max Length"
            description="Maximum length"
            type="number"
          />

          <SettingsSwitchField
            form={form}
            field="transcription.whisper.splitOnWord"
            label="Split on Word"
            description="Split on word boundaries"
          />

          <SettingsTextField
            {...form.register("transcription.whisper.bestOf")}
            label="Best Of"
            description="Number of best candidates to consider"
            type="number"
          />

          <SettingsTextField
            {...form.register("transcription.whisper.beamSize")}
            label="Beam Size"
            description="Beam size for beam search"
            type="number"
          />

          <SettingsTextField
            {...form.register("transcription.whisper.audioCtx")}
            label="Audio Context"
            description="Audio context size"
            type="number"
          />

          <SettingsTextField
            {...form.register("transcription.whisper.wordThold")}
            label="Word threshold"
            description="Word timestamp probability threshold"
            type="number"
          />

          <SettingsTextField
            {...form.register("transcription.whisper.entropyThold")}
            label="Entropy threshold"
            description="Entropy threshold for decoder fail"
            type="number"
          />

          <SettingsTextField
            {...form.register("transcription.whisper.logprobThold")}
            label="Logprob threshold"
            description="Log probability threshold for decoder fail"
            type="number"
          />

          <SettingsSwitchField
            form={form}
            field="transcription.whisper.translate"
            label="Translate"
            description="Translate transcription from source language to english"
          />

          <SettingsSwitchField
            form={form}
            field="transcription.whisper.diarize"
            label="Diarize"
            description="Diarize speakers based on input device, i.e. microphone and screen audio will be split into two speakers in transcript"
          />

          <SettingsSwitchField
            form={form}
            field="transcription.whisper.noFallback"
            label="No Fallback"
            description="Do not use temperature fallback while decoding"
          />

          <SettingsTextField
            {...form.register("transcription.whisper.language")}
            label="Language"
            description={`Spoken language, "auto" for auto-detection, "en" for english.`}
          />

          <SettingsSwitchField
            form={form}
            field="transcription.whisper.advancedDiarization"
            label="Advanced Diarization"
            description="Use advanced diarization features"
          />
        </>
      )}

      {selectedEngine === "maleo" && (
        <>
          <SettingsSelectField
            form={form}
            field="transcription.maleo.device"
            label="Processing Device"
            description="Device to use for Maleo processing"
            values={{
              "cpu": "CPU",
              "gpu": "GPU (if available)"
            }}
          />

          <SettingsTextField
            {...form.register("transcription.maleo.minSegmentMs")}
            label="Minimum Segment Duration (ms)"
            description="Drop segments shorter than this duration"
            type="number"
          />

          <SettingsTextField
            {...form.register("transcription.maleo.mergeGapMs")}
            label="Merge Gap Threshold (ms)"
            description="Merge segments with gaps smaller than this"
            type="number"
          />

          <SettingsTextField
            {...form.register("transcription.maleo.confidenceThreshold")}
            label="Confidence Threshold"
            description="Minimum confidence score for segments (0.0 - 1.0)"
            type="number"
            step="0.1"
            min="0"
            max="1"
          />
        </>
      )}
    </Tabs.Content>
  );
};
