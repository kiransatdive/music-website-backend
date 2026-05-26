declare module 'bcryptjs' {
  export function hash(
    data: string,
    saltOrRounds: string | number,
  ): Promise<string>;

  export function compare(data: string, encrypted: string): Promise<boolean>;
}

declare module 'fluent-ffmpeg' {
  interface FFProbeStream {
    codec_name?: string;
    bit_rate?: number | string;
  }

  interface FFProbeFormat {
    duration?: number;
    format_name?: string;
  }

  interface FFProbeData {
    format: FFProbeFormat;
    streams: FFProbeStream[];
  }

  namespace ffmpeg {
    function ffprobe(
      filePath: string,
      callback: (err: Error | null, metadata: FFProbeData) => void
    ): void;
    function setFfprobePath(path: string): void;
    function setFfmpegPath(path: string): void;
  }

  export = ffmpeg;
}
