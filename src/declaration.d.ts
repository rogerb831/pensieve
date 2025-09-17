declare module '@maia-id/maleo' {
  export class SpeakerDiarization {
    inference(options: { audio: string; device: 'cpu' | 'gpu' }): Promise<{
      segments: Array<{
        id: number;
        start: number;
        end: number;
        confidence: number;
        label: string;
        text: string;
      }>;
      language?: string;
    }>;
  }
}

// Fix for wavefile import issue
declare module 'wavefile' {
  const wavefile: any;
  export = wavefile;
}