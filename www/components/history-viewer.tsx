import clsx from "clsx";
import { clamp } from "lodash-es";
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useHover } from "~/lib/hover";
import { VideoRecorder, VideoResult } from "~/lib/video";

// TODO: this strategy breaks if you resize the window :)
const mapElementVideo = (
  videoResult: VideoResult,
  scenarioElement: HTMLElement,
): React.VideoHTMLAttributes<HTMLVideoElement> => {
  const scenarioBounds = scenarioElement.getBoundingClientRect();

  const { x, y } = scenarioBounds;

  // console.log({
  //   x,
  //   y,
  //   scenarioBounds: {
  //     x: scenarioBounds.x,
  //     y: scenarioBounds.y,
  //     width: scenarioBounds.width,
  //     height: scenarioBounds.height,
  //   },
  //   RECORDED_SIZE,
  //   videoResult,
  //   devicePixelRatio: window.devicePixelRatio,
  // });

  return {
    // width: videoResult.width,
    // height: videoResult.height,
    style: {
      display: "block",
      maxWidth: "none",
      width: videoResult.pixelDims.width,
      height: videoResult.pixelDims.height,
      transformOrigin: "top left",
      transform: `translate(${-x}px, ${-y}px)`,
    },
  };
};

const HistoryViewer_: React.FC<{
  containerRef: React.RefObject<HTMLElement>;
}> = ({ containerRef }) => {
  const { hoveredStep, shouldRecord, canHover, isRunning } = useHover();
  const hoverStepEndAt = canHover ? hoveredStep?.end_at ?? null : null;

  const videoElRef = useRef<HTMLVideoElement>(null);
  const videoRecorderRef = useRef<VideoRecorder | null>(null);
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);

  useEffect(() => {
    if (shouldRecord && isRunning) {
      const recorder = (videoRecorderRef.current = new VideoRecorder());

      recorder.start();

      return () => {
        recorder.stop().then((res) => {
          console.log("recording stopped:", res);
          setVideoResult(res);
        });
      };
    }
  }, [shouldRecord, isRunning]);

  useLayoutEffect(() => {
    if (!hoverStepEndAt) return;
    const videoEl = videoElRef.current;
    if (!videoEl) return;
    const videoStartAt = videoRecorderRef.current?.startAt;
    if (!videoStartAt) return;

    // FIXME: sometimes video's have `duration=0` and can't be seeked :/
    // I can only get it to consistently work AFTER clicking the "Reload test" button.
    const videoDuration = videoEl.duration;
    if (
      Number.isNaN(videoDuration) ||
      videoDuration === Infinity ||
      videoDuration <= 0
    )
      return console.warn("Invalid video duration:", videoDuration);

    const delta = hoverStepEndAt - videoStartAt;

    // console.log(
    //   "seek:",
    //   delta / 1000.0,
    //   "readyState:",
    //   videoEl.readyState,
    //   "duration:",
    //   videoEl.duration,
    // );

    // videoEl.pause();
    videoEl.currentTime = clamp(delta / 1000.0, 0, videoDuration);
  }, [hoverStepEndAt]);

  return (
    <>
      <div
        className={clsx(
          !hoverStepEndAt && "invisible",
          "absolute top-0 left-0 w-full h-full overflow-hidden",
          "pointer-events-none",
        )}
      >
        {videoResult && containerRef.current ? (
          <video
            className="bg-gray-500"
            ref={videoElRef}
            src={videoResult.url}
            // controls
            // autoPlay
            // loop
            muted
            playsInline
            // onLoadedMetadata={(e) => {
            //   console.log("loaded video metadata:", {
            //     duration: e.currentTarget.duration,
            //     width: e.currentTarget.videoWidth,
            //     height: e.currentTarget.videoHeight,
            //   });
            // }}
            {...mapElementVideo(videoResult, containerRef.current)}
          />
        ) : null}
      </div>
    </>
  );
};
export const HistoryViewer = memo(HistoryViewer_);
