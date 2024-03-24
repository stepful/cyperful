import { Subject } from "~/lib/utils/async";

export class VideoRecorder {
  private recordedChunks: Blob[] = [];
  private subject = new Subject<string>();
  private mediaRecorder?: MediaRecorder;

  startAt?: number;
  endAt?: number;

  get runDuration() {
    if (!this.startAt || !this.endAt) return 0;
    return this.endAt - this.startAt;
  }

  async start() {
    // must enable flags `--auto-accept-this-tab-capture` & `--use-fake-ui-for-media-stream`
    // in Chrome to avoid the prompt (are both necessary?)
    const mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    // Create a MediaRecorder
    const mediaRecorder = (this.mediaRecorder = new MediaRecorder(mediaStream));

    mediaRecorder.onerror = (e) => {
      console.error("MediaRecorder error:", e);
      this.subject.error(e);
    };

    mediaRecorder.ondataavailable = (e) => {
      // Store the recorded data
      // if (e.data.size > 0)
      this.recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      this.endAt = Date.now();
      const blob = new Blob(this.recordedChunks, {
        type: "video/webm",
      });
      const url = URL.createObjectURL(blob);
      this.subject.complete(url);
    };

    // Start recording
    mediaRecorder.start();
    this.startAt = Date.now();
  }

  getUrl() {
    return this.subject.toPromise();
  }

  async stop() {
    console.log("Stopping recording...");
    this.mediaRecorder?.stop();
    return { url: await this.getUrl() };
  }
}

// export const videoTest = async () => {
//   const recorder = new VideoRecorder();
//   await recorder.start();
//   await new Promise((r) => setTimeout(r, 5000));

//   const { url } = await recorder.stop();
//   console.log("Recording URL:", url);

//   const video = document.createElement("video");
//   video.src = url;
//   video.controls = true;
//   document.body.appendChild(video);
// };
