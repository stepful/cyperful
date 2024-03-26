import { useEffect, useRef, useState } from "react";
import { useConfig } from "~/lib/config";
import { useStepsData } from "~/lib/data";
import { useHover } from "~/lib/hover";
import { createProvider } from "~/lib/utils/providers";
import { VideoRecorder, type VideoResult } from "~/lib/video";

export const [HistoryRecordingProvider, useHistoryRecording] = createProvider(
  () => {
    const { stepIndex, hoverRatio } = useHover();

    const { steps, test_status } = useStepsData() || {};

    const hoveredStep = (stepIndex != null && steps?.[stepIndex]) || null;

    const stepDuration =
      hoveredStep?.end_at && hoveredStep?.start_at
        ? hoveredStep.end_at - hoveredStep.start_at
        : null;
    const hoveredExtraTime = stepDuration ? stepDuration * hoverRatio : 0;

    const recordingAllowed = useConfig()?.history_recording ?? false;

    const isTestRunning = test_status === "running";

    const canShowHistory =
      recordingAllowed &&
      (test_status === "passed" ||
        test_status === "failed" ||
        test_status === "paused");

    // const firstStepStartAt = steps?.[0]?.start_at ?? null;

    const videoRecorderRef = useRef<VideoRecorder | null>(null);
    const [videoResult, setVideoResult] = useState<VideoResult | null>(null);

    useEffect(() => {
      if (recordingAllowed && isTestRunning) {
        const recorder = (videoRecorderRef.current = new VideoRecorder());

        void recorder.start();

        return () => {
          recorder
            .stop()
            .then((res) => {
              console.log("recording stopped:", res);
              setVideoResult(res);
            })
            .catch((err) => {
              console.error("recording error:", err);
            });
        };
      }
    }, [recordingAllowed, isTestRunning]);

    // console.log("seek:", {
    //   delta: delta / 1000.0,
    //   readyState: videoEl.readyState,
    //   currentTime: Math.round(videoEl.currentTime * 1000.0),
    //   videoEl: {
    //     duration: Math.round(videoEl.duration * 1000.0),
    //   },
    //   recorder: {
    //     start: startAt - debugNow,
    //     end: endAt - debugNow,
    //     duration: endAt - startAt,
    //   },
    //   hover: {
    //     start: hoverStepEndAt - debugNow,
    //     end: firstStepStartAt - debugNow,
    //     duration: hoverStepEndAt - firstStepStartAt,
    //   },
    // });

    return {
      showing: canShowHistory && !!hoveredStep,
      videoRecorder: videoRecorderRef.current,
      videoResult,
      hoveredStep,
      canShowHistory,
      isTestRunning,
      hoveredExtraTime,
    };
  },
);
