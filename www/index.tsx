import { memo, useState } from "react";
import ReactDOM from "react-dom/client";
import { Logo, LogoText } from "~/components/Logo";
import { Controls } from "~/components/controls";
import { HistoryViewer } from "~/components/history-viewer";
import { ErrorBoundary } from "~/components/shared";
import { Steps } from "~/components/steps";
import { useStepsData } from "~/lib/data";
import { HoverProvider, useHover } from "~/lib/hover";
import { cn } from "~/lib/utils";
import { useElementSize } from "~/lib/utils/useElementSize";
import { ConfigProvider } from "./lib/config";

const INITIAL_WINDOW_SIZE = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const ScenarioFrame_ = () => {
  // TODO: make configurable
  const [_desiredSize] = useState(INITIAL_WINDOW_SIZE);

  const [containerSize, containerRef] = useElementSize();

  const { hoveredStep, canHover } = useHover();

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
            className={cn(
              "absolute top-0 left-0",
              canHover && hoveredStep && "invisible",
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

const Layout: React.FC<{
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}> = ({ header, sidebar, children }) => {
  const status = useStepsData()?.test_status;
  const isRunning = status === "running";

  return (
    <div className="h-screen flex flex-col items-stretch">
      <nav className="h-14 px-6 py-1 border-b border-gray-200 flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Logo animating={isRunning} size={10} alt="Cyperful logo" />
          <h1 className="text-xl font-bold">
            <LogoText />
          </h1>
        </div>
        {header}
      </nav>
      <div className="flex flex-1 items-stretch">
        {sidebar ? (
          <div
            className="basis-96 flex flex-col items-stretch overflow-y-auto"
            style={{
              maxHeight: "calc(100vh - 3.5rem)",
            }}
          >
            {sidebar}
          </div>
        ) : null}

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

const Page: React.FC = () => {
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
        <HoverProvider>
          <Layout header={<Controls />} sidebar={<Steps />}>
            <ScenarioFrame />
          </Layout>
        </HoverProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<Page />);
