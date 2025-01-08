import clsx from "clsx";
import { clamp } from "lodash-es";
import { memo, useLayoutEffect, useMemo, useRef } from "react";
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
  // in milliseconds
  seekTime: number | null;
  duration: number | null;
}> = ({ seekTime, duration }) => {
  const ratio = duration ? (seekTime ?? 0) / duration : 0;

  return (
    <div className="absolute bottom-1 left-1 right-1 h-2.5 rounded-full border border-slate-800 bg-slate-950 shadow-md">
      <div
        className="h-full rounded-full bg-green-500 transition-[width] duration-100"
        style={{ width: `${ratio * 100.0}%` }}
      />
      {/* Tooltip with time */}
      {seekTime != null && duration != null && (
        <div
          className="text-shadow-outline absolute right-0 right-1/2 top-0 text-right text-xs text-black"
          style={{ transform: "translate(40px, -120%)" }}
        >
          {(seekTime / 1000.0).toFixed(2)} / {(duration / 1000.0).toFixed(2)}s
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
  return dur * 1000.0;
};

const HistoryViewer_: React.FC<{
  containerRef: React.RefObject<HTMLElement | null>;
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
    ? (hoveredStep?.start_at ?? null)
    : null;

  const videoDuration = useMemo(() => {
    const estimatedDuration = videoResult?.duration;
    if (!estimatedDuration) return null; // i.e. we didn't finish recording

    const actualDuration = getVideoElDuration(videoElRef.current);
    return actualDuration ?? estimatedDuration;
  }, [videoResult]);

  // TODO: video logic breaks if test was paused and resumed
  // TODO: video seeking is inaccurate
  const videoSeekMs =
    videoDuration && hoveredStepStartAt && recordingStartAt
      ? clamp(
          hoveredStepStartAt - recordingStartAt + hoveredExtraTime,
          0,
          videoDuration,
        )
      : null;

  useLayoutEffect(() => {
    if (videoSeekMs == null) return;
    const videoEl = videoElRef.current;
    if (!videoEl) return;

    if (!videoEl.paused) videoEl.pause();
    videoEl.currentTime = videoSeekMs / 1000.0;
  }, [videoSeekMs]);

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

        <SeekBar seekTime={videoSeekMs} duration={videoDuration} />
      </div>
    </>
  );
};
export const HistoryViewer = memo(HistoryViewer_);
