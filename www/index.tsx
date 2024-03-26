import { memo, useState } from "react";
import ReactDOM from "react-dom/client";
import { Controls } from "~/components/controls";
import { HistoryViewer } from "~/components/history-viewer";
import { Layout } from "~/components/layout";
import { ErrorBoundary } from "~/components/shared";
import { Steps } from "~/components/steps";
import { ConfigProvider } from "~/lib/config";
import { StepsDataProvider } from "~/lib/data";
import {
  HistoryRecordingProvider,
  useHistoryRecording,
} from "~/lib/history-recording";
import { HoverProvider } from "~/lib/hover";
import { clsx } from "~/lib/utils";
import { useElementSize } from "~/lib/utils/useElementSize";

const INITIAL_WINDOW_SIZE = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const ScenarioFrame_ = () => {
  // TODO: make configurable
  const [_desiredSize] = useState(INITIAL_WINDOW_SIZE);

  const [containerSize, containerRef] = useElementSize();

  const showingHistoryRecording = useHistoryRecording((s) => s.showing);

  return (
    <div className="relative h-full p-2 bg-[#121b2e]">
      <div
        className="absolute top-0 left-0 w-full h-full opacity-50"
        style={{
          // gray stripes
          backgroundColor: "#9ca3af1a",
          backgroundImage:
            "linear-gradient(135deg,#6b728080 10%,#0000 0,#0000 50%,#6b728080 0,#6b728080 60%,#0000 0,#0000)",
          backgroundSize: "7.07px 7.07px",
        }}
      />

      <div ref={containerRef} className="relative h-full">
        {containerSize ? (
          <iframe
            // NOTE: the `src` attribute is set by Capybara
            id="scenario-frame"
            title="scenario"
            className={clsx(
              "absolute top-0 left-0",
              showingHistoryRecording && "invisible",
            )}
            style={{
              width: containerSize.width,
              height: containerSize.height,
              // TODO: while scaling the iframe would be more accurate (b/c it keeps the desiredSize),
              //       it breaks Capybara's `click_on` coordinates (x,y) logic
              // width: desiredSize.width,
              // height: desiredSize.height,
              // transform: `scale(${containerSize.width / desiredSize.width})`,
              // transformOrigin: 'top left',
            }}
          />
        ) : null}
        <HistoryViewer containerRef={containerRef} />
      </div>
    </div>
  );
};
// using `memo` to make sure we never re-render the iframe
const ScenarioFrame = memo(ScenarioFrame_);

const Page = memo(() => {
  return (
    <Layout header={<Controls />} sidebar={<Steps />}>
      <ScenarioFrame />
    </Layout>
  );
});

const App: React.FC = () => {
  return (
    <ErrorBoundary
      fallback={(error) => {
        return (
          <Layout>
            <div className="bg-gray-50 p-4 m-4 rounded shadow">
              <h2 className="text-lg font-bold mb-2 text-red-500">
                Cyperful Error:
              </h2>
              <pre className="whitespace-pre-wrap">{error.toString()}</pre>
            </div>
          </Layout>
        );
      }}
    >
      <ConfigProvider>
        <StepsDataProvider>
          <HoverProvider>
            <HistoryRecordingProvider>
              <Page />
            </HistoryRecordingProvider>
          </HoverProvider>
        </StepsDataProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
