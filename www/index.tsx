import { memo, useState } from "react";
import ReactDOM from "react-dom/client";
import { Logo, LogoText } from "~/components/Logo";
import { Controls } from "~/components/controls";
import { ErrorBoundary } from "~/components/shared";
import { Steps } from "~/components/steps";
import { HoverProvider, useHover } from "~/lib/context";
import { useStepsData } from "~/lib/data";
import { cn } from "~/lib/utils";
import { useElementSize } from "~/lib/utils/useElementSize";

const INITIAL_WINDOW_SIZE = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const SCREENSHOTS_ENABLED = false;

const HistoryScreenshot: React.FC = () => {
  const { step } = useHover();

  if (!step?.end_at) return null;

  // FIXME: taking screenshots is too slow at the moment...
  if (!SCREENSHOTS_ENABLED)
    return (
      <p className="text-white p-4">
        🚧 Historical snapshots are coming soon 🚧
      </p>
    );

  // TODO: this strategy breaks if you resize the window :)
  const imageSize = INITIAL_WINDOW_SIZE;
  const scenarioContainer = document.getElementById("scenario-container")!;
  const { x, y, width } = scenarioContainer.getBoundingClientRect();
  const scale = width / imageSize.width;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
      <img
        src={`/screenshots/${step.index}.png`}
        width={imageSize.width}
        height={imageSize.height}
        style={{
          transformOrigin: "top left",
          transform: `scale(${1 / scale}) translate(${-x * scale}px, ${
            -y * scale
          }px)`,
        }}
        alt=""
      />
    </div>
  );
};

const ScenarioFrame_ = () => {
  // TODO: make configurable
  const [_desiredSize] = useState(INITIAL_WINDOW_SIZE);

  const [containerSize, containerRef] = useElementSize();

  const { step } = useHover();
  const isAnyHovered = !!step?.end_at;

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

      <div
        ref={containerRef}
        id="scenario-container"
        className="relative h-full"
      >
        {containerSize ? (
          <iframe
            // NOTE: the `src` attribute is set by Capybara
            id="scenario-frame"
            title="scenario"
            className={cn("absolute top-0 left-0", isAnyHovered && "opacity-0")}
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
        <HistoryScreenshot />
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
      <HoverProvider>
        <Layout header={<Controls />} sidebar={<Steps />}>
          <ScenarioFrame />
        </Layout>
      </HoverProvider>
    </ErrorBoundary>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<Page />);
