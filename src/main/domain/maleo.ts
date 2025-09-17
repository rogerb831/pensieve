import { SpeakerDiarization } from '@maia-id/maleo';
import path from "path";
import fs from "fs-extra";
import log from "electron-log/main";
import * as postprocess from "./postprocess";
import * as ffmpeg from "./ffmpeg";
import { getSettings } from "./settings";
import { RecordingTranscript, RecordingTranscriptItem } from "../../types";

export interface MaleoSegment {
  id: number;
  start: number;
  end: number;
  confidence: number;
  label: string;
  text: string;
}

export const processWavFile = async (
  input: string,
  output: string,
  modelId?: string
) => {
  postprocess.setStep("maleo");
  
  const settings = (await getSettings()).transcription.maleo;
  
  log.info("Processing wav file with Maleo", input);
  
  // Get audio duration for progress estimation
  const audioDurationMs = await ffmpeg.getDuration(input);
  const audioDuration = audioDurationMs / 1000; // Convert ms to seconds
  log.info("Audio duration:", audioDuration, "seconds");
  
  // Start progress estimation (Maleo doesn't provide real progress)
  // Based on real data: 46 seconds to process 610 seconds of audio = ~7.5% of audio duration
  const estimatedProcessingTime = Math.max(audioDuration * 0.075, 15); // At least 15 seconds
  const startTime = Date.now();
  const progressInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000; // seconds
    const estimatedProgress = Math.min(elapsed / estimatedProcessingTime, 0.95); // Cap at 95% until completion
    postprocess.setProgress("maleo", estimatedProgress);
  }, 1000); // Update every second
  
  try {
    const speakerDiarization = new SpeakerDiarization();
    
    const result = await speakerDiarization.inference({
      audio: input,
      device: settings.device
    });
    
    // Clear progress interval and set to 100%
    clearInterval(progressInterval);
    postprocess.setProgress("maleo", 1.0);
    
    // Post-process segments (exact same logic as local-diarization-electron)
    let cleaned = dropTinySegments(result.segments, settings.minSegmentMs);
    cleaned = mergeShortGaps(cleaned, settings.mergeGapMs);
    
        // Additional cleaning for better results
        cleaned = filterEmptySegments(cleaned);
        cleaned = mergeAdjacentSameSpeaker(cleaned);
    
    // Convert to Pensieve transcript format
    const transcript = convertMaleoToTranscript(cleaned);
    
    // Save transcript (same path as Whisper)
    await fs.writeJSON(output, transcript, { spaces: 2 });
    
    log.info("Processed Wav File with Maleo");
  } catch (error) {
    // Clear progress interval on error
    clearInterval(progressInterval);
    log.error("Maleo processing failed:", error);
    throw error;
  }
};

// Exact same post-processing functions from local-diarization-electron
function dropTinySegments(segments: MaleoSegment[], minMs: number): MaleoSegment[] {
  return segments.filter(s => (s.end - s.start) * 1000 >= minMs);
}

function mergeShortGaps(segments: MaleoSegment[], gapMs: number): MaleoSegment[] {
  if (!segments.length) return segments;
  const out = [segments[0]];
  for (let i = 1; i < segments.length; i++) {
    const prev = out[out.length - 1];
    const cur = segments[i];
    const gap = (cur.start - prev.end) * 1000;
    if (gap <= gapMs && prev.label === cur.label) {
      prev.end = cur.end;
    } else {
      out.push(cur);
    }
  }
  return out;
}

// Filter out segments with empty text only
function filterEmptySegments(segments: MaleoSegment[]): MaleoSegment[] {
  return segments.filter(segment => {
    const text = segment.text?.trim();
    return text && text.length > 0; // Only remove truly empty segments
  });
}

// Merge adjacent segments from the same speaker (very conservative)
function mergeAdjacentSameSpeaker(segments: MaleoSegment[]): MaleoSegment[] {
  if (!segments.length) return segments;
  const out = [segments[0]];

  for (let i = 1; i < segments.length; i++) {
    const prev = out[out.length - 1];
    const cur = segments[i];

    // Only merge if same speaker (regardless of gap)
    // This preserves natural speech flow for the same speaker
    if (prev.label === cur.label) {
      // Merge the segments
      prev.end = cur.end;
      prev.text = (prev.text + " " + cur.text).trim();
    } else {
      out.push(cur);
    }
  }

  return out;
}

// Convert Maleo format to Pensieve transcript format
function convertMaleoToTranscript(segments: MaleoSegment[]): RecordingTranscript {
  const transcription: RecordingTranscriptItem[] = segments.map(segment => ({
    timestamps: {
      from: formatTime(segment.start),
      to: formatTime(segment.end)
    },
    offsets: {
      from: Math.round(segment.start * 1000),
      to: Math.round(segment.end * 1000)
    },
    text: segment.text,
    speaker: convertSpeakerLabel(segment.label)
  }));

  return {
    result: { language: "unknown" }, // Maleo doesn't provide language detection
    transcription
  };
}

function convertSpeakerLabel(label: string): string {
  // Convert Maleo's complex speaker labels to user-friendly names
  if (label === "NO_SPEAKER") {
    return "?"; // Keep the existing UI convention for no speaker
  }
  
  if (label.startsWith("SPEAKER_")) {
    const speakerNum = label.replace("SPEAKER_", "");
    return `Speaker ${speakerNum}`;
  }
  
  if (label.startsWith("SPEAKERS_") && label.includes("_AND_")) {
    // Handle cases like "SPEAKERS_1_AND_2"
    const parts = label.replace("SPEAKERS_", "").split("_AND_");
    return `Speakers ${parts[0]} & ${parts[1]}`;
  }
  
  // Fallback for any other format
  return label;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
