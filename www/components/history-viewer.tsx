import clsx from "clsx";
import { clamp } from "lodash-es";
import { memo, useLayoutEffect, useRef } from "react";
import { useHistoryRecording } from "~/lib/history-recording";
import { type VideoResult } from "~/lib/video";

// TODO: this strategy breaks if you resize the window :)
const renderVideoDimensions = (
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
      width: videoResult.pixelDims.width + 0.75,
      height: videoResult.pixelDims.height + 0.75,
      transformOrigin: "top left",
      transform: `translate(${-x - 0.2}px, ${-y}px)`,
    },
  };
};

const SeekBar: React.FC<{
  seekTime: number | null;
  duration: number | null;
}> = ({ seekTime, duration }) => {
  const ratio = duration != null ? (seekTime ?? 0) / duration : 0;

  return (
    <div className="absolute bottom-1 left-1 right-1 h-2.5 rounded-full border border-slate-800 bg-slate-950 shadow-md">
      <div
        className="h-full rounded-full bg-green-500 transition-[width] duration-100"
        style={{ width: `${ratio * 100.0}%` }}
      />
      {/* Tooltip with time */}
      {seekTime != null && duration != null && (
        <div
          className="text-shadow-outline absolute left-0 right-0 top-0 text-center text-xs text-black"
          style={{ transform: "translateY(-120%)" }}
        >
          {seekTime.toFixed(2)} / {duration.toFixed(2)}s
        </div>
      )}
    </div>
  );
};

const getVideoElDuration = (videoEl: HTMLVideoElement | null) => {
  if (!videoEl) return null;
  const dur = videoEl.duration;
  // FIXME: sometimes video's have `duration=0` and can't be seeked :/
  // I can only get it to consistently work AFTER clicking the "Reload test" button.
  if (!Number.isFinite(dur) || dur <= 0) {
    console.warn("Invalid video duration:", dur);
    return null;
  }
  return dur;
};

const HistoryViewer_: React.FC<{
  containerRef: React.RefObject<HTMLElement>;
}> = ({ containerRef }) => {
  const {
    videoResult,
    videoRecorder,
    hoveredStep,
    canShowHistory,
    hoveredExtraTime,
  } = useHistoryRecording();

  const videoElRef = useRef<HTMLVideoElement>(null);

  const recordingStartAt = videoRecorder?.startAt ?? null;
  const hoveredStepStartAt = canShowHistory
    ? hoveredStep?.start_at ?? null
    : null;

  const videoDuration =
    getVideoElDuration(videoElRef.current) ?? videoResult?.duration ?? null;

  const HACK_PADDING = 20;
  const videoSeekTime =
    videoDuration && hoveredStepStartAt && recordingStartAt
      ? clamp(
          (hoveredStepStartAt -
            recordingStartAt +
            hoveredExtraTime +
            HACK_PADDING) /
            1000.0,
          0,
          videoDuration,
        )
      : null;

  useLayoutEffect(() => {
    if (videoSeekTime == null) return;
    const videoEl = videoElRef.current;
    if (!videoEl) return;

    if (!videoEl.paused) videoEl.pause();
    videoEl.currentTime = videoSeekTime;
  }, [videoSeekTime]);

  return (
    <>
      <div
        className={clsx(
          !hoveredStepStartAt && "invisible",
          "absolute left-0 top-0 h-full w-full overflow-hidden",
          "pointer-events-none",
        )}
      >
        {videoResult && containerRef.current ? (
          <video
            className="bg-gray-500"
            ref={videoElRef}
            src={videoResult.url}
            muted
            playsInline
            // onLoadedMetadata={(e) => {
            //   console.log("loaded video metadata:", {
            //     duration: e.currentTarget.duration,
            //     width: e.currentTarget.videoWidth,
            //     height: e.currentTarget.videoHeight,
            //   });
            // }}
            {...renderVideoDimensions(videoResult, containerRef.current)}
          />
        ) : null}

        <SeekBar seekTime={videoSeekTime} duration={videoDuration} />
      </div>
    </>
  );
};
export const HistoryViewer = memo(HistoryViewer_);
