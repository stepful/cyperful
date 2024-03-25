import { Subject } from "~/lib/utils/async";

type Dims = { width: number; height: number };

export type VideoResult = {
  url: string;
  duration: number;
  pixelDims: Dims;
};

export class VideoRecorder {
  private recordedChunks: Blob[] = [];
  private subject = new Subject<string>();
  private mediaRecorder?: MediaRecorder;
  private firstDataSubject = new Subject<void>();

  startAt?: number;
  endAt?: number;

  get runDuration() {
    if (!this.startAt || !this.endAt) return 0;
    return this.endAt - this.startAt;
  }

  pixelDims?: Dims;
  async start() {
    console.log("[VideoRecorder] starting...");

    // NOTE: the dimensions of the video stream
    // may be larger than these window dimensions due to high DPI screens
    this.pixelDims = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // must enable flags `--auto-accept-this-tab-capture` & `--use-fake-ui-for-media-stream`
    // in Chrome to avoid the prompt (are both necessary?)
    const mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        // only capture the content of the browser tab
        displaySurface: "browser",
        // frameRate: {
        //   ideal: 24,
        // },
        // ...this.suggestedDimensions,
      },
      audio: false,
    });

    // just in case https://stackoverflow.com/a/68108931
    mediaStream
      .getAudioTracks()
      .forEach((track) => mediaStream.removeTrack(track));

    const mediaRecorder = (this.mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: "video/webm",
    }));

    console.log("[VideoRecorder] started");

    mediaRecorder.onerror = (e) => {
      const { error } = e as ErrorEvent;
      console.error("[VideoRecorder] error:", error);
      this.subject.error(error);
    };

    mediaRecorder.ondataavailable = ({ data }) => {
      console.log("[VideoRecorder] data-available:", data.size);
      this.recordedChunks.push(data);
      if (data.size > 0) {
        this.firstDataSubject.complete();
      }
    };

    mediaRecorder.onstop = () => {
      this.endAt = Date.now();
      if (!this.recordedChunks.some((c) => c.size > 0)) {
        this.subject.error("No data recorded");
        return;
      }

      const blob = new Blob(this.recordedChunks, {
        type: "video/webm",
      });
      const url = URL.createObjectURL(blob);
      this.subject.complete(url);
    };

    // Start recording
    mediaRecorder.start(1000);

    this.startAt = Date.now();
  }

  getUrl() {
    return this.subject.toPromise();
  }

  // private get suggestedDimensions() {
  //   let width = window.innerWidth;
  //   let height = window.innerHeight;
  //   if (width % 2 !== 0) width--;
  //   if (height % 2 !== 0) height--;
  //   return { width, height };
  // }

  // private get settingsDimensions() {
  //   if (!this.mediaRecorder) throw new Error("No media recorder found");
  //   const videoSettings = this.mediaRecorder.stream
  //     .getVideoTracks()[0]
  //     ?.getSettings();
  //   if (!videoSettings) throw new Error("No video settings found");
  //   if (!videoSettings.width || !videoSettings.height)
  //     throw new Error("video settings missing width/height");

  //   return {
  //     width: videoSettings.width! / window.devicePixelRatio,
  //     height: videoSettings.height! / window.devicePixelRatio,
  //   };
  // }

  async stop(): Promise<VideoResult> {
    console.log("[VideoRecorder] stopping...");

    // wait for `firstDataSubject` or a timeout of 5 seconds, whichever comes first
    await Promise.race([
      this.firstDataSubject.toPromise(),
      new Promise((r) => setTimeout(r, 5000)),
    ]);

    this.mediaRecorder?.stop();

    const url = await this.getUrl();

    return {
      url,
      duration: this.runDuration,
      pixelDims: this.pixelDims!,
      // ...this.suggestedDimensions,
    };
  }
}
