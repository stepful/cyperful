import { findLastIndex } from 'lodash-es';
import React, { Fragment, memo, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  RiCheckLine as CheckIcon,
  RiCloseLine as CloseIcon,
  RiCornerDownRightFill as GoToHereIcon,
  RiLoader4Line as LoaderIcon,
  RiPauseCircleFill as PauseIcon,
  RiPlayFill as PlayIcon,
  RiRestartFill as ResetIcon,
  RiStopFill as StopButton,
  RiSkipRightLine as StepThroughIcon,
} from 'react-icons/ri';

import { useHover, HoverProvider } from './context';
import {
  BrowserEvent,
  sendCommand,
  Step,
  useBrowserEvents,
  useStepsData,
} from './data';
import { Button, ErrorBoundary, IconButton, Timer } from './ui';
import { cn, EMPTY_ARRAY, useElementSize } from './utils';

const logoUrl = new URL('./logo.svg', import.meta.url).href;

const StepRow: React.FC<{ step: Step; actions?: React.ReactNode }> = ({
  step,
  actions,
}) => {
  const ms = step.start_at && step.end_at ? step.end_at - step.start_at : null;

  let icon: React.ReactNode = null;
  let textClass = 'text-gray-600';

  const iconShared = 'inline-block w-5 h-5 ml-1';
  if (step.status === 'passed') {
    icon = <CheckIcon className={`${iconShared} text-green-500`} />;
    textClass = 'text-green-500';
  } else if (step.status === 'failed') {
    icon = <CloseIcon className={`${iconShared} text-red-500`} />;
    textClass = 'text-red-400';
  } else if (step.status === 'running') {
    icon = (
      <LoaderIcon className={`${iconShared} text-gray-500 animate-spin`} />
    );
    textClass = 'text-blue-500';
  } else if (step.status === 'paused') {
    icon = <PauseIcon className={`${iconShared} text-yellow-500`} />;
    textClass = 'text-yellow-500';
  }

  const hover = useHover();

  return (
    <li
      data-step-index={step.index}
      className="group relative p-2 text-sm border-b border-gray-200 flex items-start hover:bg-gray-100 cursor-pointer"
      onMouseEnter={() => hover.setStepIndex(step.index)}
      onMouseLeave={() => hover.setStepIndex(null)}
    >
      <p className="flex-1">
        <span className="text-gray-400 w-6 inline-block">
          {step.index + 1}.
        </span>
        <span className={cn('font-mono', textClass)}>{step.as_string}</span>
        {icon}
        {ms != null ? (
          <span className="text-gray-400 ml-1">({ms}ms)</span>
        ) : null}
      </p>

      <div className="hidden group-hover:block absolute top-1 right-4">
        {actions}
      </div>

      {step.permalink ? (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={step.permalink}
          className="text-gray-600 text-xs hover:underline"
          title={`Open in ${step.permalink.match(/^(\w+):/)?.[1] ?? 'editor'}`}
        >
          🔗
        </a>
      ) : null}
    </li>
  );
};

const safeStringify = (data: unknown) => {
  if (typeof data === 'string' || typeof data === 'number') return data;

  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return '<unserializable data>';
  }
};

const eventContent = (event: BrowserEvent): React.ReactNode => {
  const { type, data } = event;
  if (type === 'log') {
    const { args, level } = data;
    return (
      <p className={level === 'error' ? 'text-red-500' : ''}>
        {args.map((arg, i) => (
          <React.Fragment key={i}>
            {i > 0 ? ' ' : null}
            {typeof arg === 'string' ? arg : safeStringify(arg)}
          </React.Fragment>
        ))}
      </p>
    );
  } else if (type === 'fetch' || type === 'xhr') {
    const { url, method, status, body, response } = data;
    return (
      <>
        <p className="mb-1">
          {method} {url} {status}
        </p>

        {body != null ? (
          <div className="relative border-t border-gray-200">
            <span className="absolute top-0 right-0 text-xs bg-gray-100 text-gray-500">
              Request Body
            </span>

            <pre className="whitespace-pre-wrap max-h-16 overflow-y-auto">
              {safeStringify(body)}
            </pre>
          </div>
        ) : null}
        {response != null ? (
          <div className="relative border-t border-gray-200">
            <span className="absolute top-0 right-0 text-xs bg-gray-100 text-gray-500">
              Response Body
            </span>
            <pre className="whitespace-pre-wrap max-h-16 overflow-y-auto">
              {safeStringify(response)}
            </pre>
          </div>
        ) : null}
      </>
    );
  } else if (type === 'global_error' || type === 'unhandledrejection') {
    const { message } = data;
    return (
      <pre className="text-red-500 whitespace-pre-wrap max-h-16 overflow-y-auto">
        {message}
      </pre>
    );
  } else if (type === 'client_navigate') {
    const { url, replace } = data;
    return (
      <p>
        {url}
        {replace ? ' (replace)' : null}
      </p>
    );
  }
  return null;
};

const EventRow: React.FC<{ event: BrowserEvent }> = ({ event: evt }) => {
  return (
    <li key={evt.id}>
      <p className="p-2 text-xs text-gray-500">
        <strong>{evt.type}</strong>
        {evt.duration != null ? <> ({evt.duration}ms)</> : null}
      </p>
      <div className="font-mono text-xs text-gray-500 p-2 pt-0 border-b border-gray-200">
        {eventContent(evt)}
      </div>
    </li>
  );
};

const Steps_: React.FC = () => {
  const {
    steps,
    current_step_index,
    test_status,
    test_suite,
    test_name,
    test_error,
  } = useStepsData() || {};

  const events = useBrowserEvents();

  // scroll to last updated step
  useEffect(() => {
    if (!steps?.length) return;
    if (steps[0].status === 'pending') return; // tests haven't started yet

    let lastNonPendingStepIndex = findLastIndex(
      steps,
      (s) => s.status !== 'pending',
    );
    if (lastNonPendingStepIndex === -1)
      lastNonPendingStepIndex = steps.length - 1;

    const element = document.querySelector(
      `[data-step-index="${lastNonPendingStepIndex}"]`,
    );
    if (!element) return;

    element.scrollIntoView({
      behavior: 'auto',
      block: 'center',
    });
  }, [steps]);

  if (!steps) return <p>Loading...</p>;

  const failedStepI = steps.findIndex((s) => s.status === 'failed');

  return (
    <div className="bg-gray-50 flex-1">
      <p className="bg-gray-100 p-2 text-gray-600 text-sm font-mono">
        {test_suite}:
        <br />
        &nbsp;&nbsp;{test_name}
      </p>
      <ol className="border-t border-gray-200">
        {steps?.map((step, i) => {
          const showError =
            test_error != null &&
            step.index === (failedStepI === -1 ? 0 : failedStepI) ? (
              <pre className="font-mono text-sm p-2 border-b border-gray-200 whitespace-pre-wrap text-red-500">
                <strong>Test failure:</strong>
                <br />
                {test_error}
              </pre>
            ) : null;

          const thisStepStartAt = step.start_at;
          const nextStepStartAt = steps[i + 1]?.start_at;
          const showEvents =
            thisStepStartAt != null
              ? events.filter((e) => {
                  return (
                    e.timestamp > thisStepStartAt &&
                    (nextStepStartAt == null || e.timestamp < nextStepStartAt)
                  );
                })
              : EMPTY_ARRAY;

          return (
            <Fragment key={step.index}>
              {failedStepI === -1 ? showError : null}
              <StepRow
                step={step}
                actions={
                  <>
                    {(test_status === 'paused' || test_status === 'pending') &&
                    (current_step_index == null ||
                      step.index > current_step_index) ? (
                      <Button
                        onClick={() => {
                          sendCommand('start', { pause_at_step: step.index });
                        }}
                        className="mr-2"
                        size="sm"
                      >
                        <GoToHereIcon className="mr-2 text-[1.25em]" />
                        Run to here
                      </Button>
                    ) : null}
                  </>
                }
              />
              {failedStepI !== -1 ? showError : null}

              {showEvents.map((evt) => {
                return <EventRow key={evt.id} event={evt} />;
              })}
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
};
const Steps = memo(Steps_);

const INITIAL_WINDOW_SIZE = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const HistoryScreenshot: React.FC = () => {
  const { step } = useHover();

  if (!step?.end_at) return null;

  // FIXME: screenshots are too slow at the moment
  if (window)
    return <p className="text-white p-4">Historical screenshots are WIP</p>;

  // TODO: this strategy breaks if you resize the window :)
  const imageSize = INITIAL_WINDOW_SIZE;
  const scenarioContainer = document.getElementById('scenario-container')!;
  const { x, y, width } = scenarioContainer.getBoundingClientRect();
  const scale = width / imageSize.width;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
      <img
        src={`/screenshots/${step.index}.png`}
        width={imageSize.width}
        height={imageSize.height}
        style={{
          transformOrigin: 'top left',
          transform: `scale(${1 / scale}) translate(${-x * scale}px, ${
            -y * scale
          }px)`,
        }}
        alt=""
      />
    </div>
  );
};

// using `memo` to make sure we never re-render the iframe
const ScenarioFrame = memo(() => {
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
          backgroundColor: '#9ca3af1a',
          backgroundImage:
            'linear-gradient(135deg,#6b728080 10%,#0000 0,#0000 50%,#6b728080 0,#6b728080 60%,#0000 0,#0000)',
          backgroundSize: '7.07px 7.07px',
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
            className={cn('absolute top-0 left-0', isAnyHovered && 'opacity-0')}
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
});

const BRAND_COLORS = ['#E92727', '#EE7823', '#FFCF00', '#009154'];

const Layout: React.FC<{
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}> = ({ header, sidebar, children }) => {
  const status = useStepsData()?.test_status;
  const isRunning = status === 'running';

  return (
    <div className="h-screen flex flex-col items-stretch">
      <nav className="h-14 px-6 py-1 border-b border-gray-200 flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <img
            src={logoUrl}
            className={cn(
              'w-10 h-10',
              isRunning ? 'animate-spin' : 'animate-none',
            )}
            alt="Cyperful logo"
          />
          <h1 className="text-xl font-bold">
            <span style={{ color: BRAND_COLORS[0] }}>C</span>
            <span style={{ color: BRAND_COLORS[0] }}>y</span>
            <span style={{ color: BRAND_COLORS[1] }}>p</span>
            <span style={{ color: BRAND_COLORS[1] }}>e</span>
            <span style={{ color: BRAND_COLORS[2] }}>r</span>
            <span style={{ color: BRAND_COLORS[2] }}>f</span>
            <span style={{ color: BRAND_COLORS[3] }}>u</span>
            <span style={{ color: BRAND_COLORS[3] }}>l</span>
          </h1>
        </div>
        {header}
      </nav>
      <div className="flex flex-1 items-stretch">
        {sidebar ? (
          <div
            className="basis-96 flex flex-col items-stretch overflow-y-auto"
            style={{
              maxHeight: 'calc(100vh - 3.5rem)',
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

const Controls: React.FC = () => {
  const {
    test_status: status,
    test_duration_ms,
    current_step_index,
  } = useStepsData() || {};

  return (
    <>
      <span className="font-mono text-gray-500 text-lg bg-gray-100 rounded-md py-1 px-3 shadow-inner">
        <Timer
          givenElapsedMs={test_duration_ms ?? null}
          paused={status !== 'running'}
        />
      </span>

      {(status === 'pending' || status === 'paused') && (
        <IconButton
          onClick={() => sendCommand('start')}
          colorScheme="green"
          aria-label={status === 'pending' ? 'Start' : 'Resume'}
          icon={<PlayIcon />}
        />
      )}
      {(status === 'pending' || status === 'paused') && (
        <IconButton
          onClick={() =>
            sendCommand('start', {
              pause_at_step: (current_step_index ?? -1) + 1,
            })
          }
          colorScheme="blue"
          icon={<StepThroughIcon />}
          aria-label="Step Through"
        />
      )}
      {status === 'running' && (
        <IconButton
          onClick={() => sendCommand('stop')}
          colorScheme="red"
          icon={<StopButton />}
          aria-label="Stop"
        />
      )}
      {(status === 'passed' || status === 'failed') && (
        <>
          <span
            className={cn(
              'text-md capitalize rounded-full text-white px-3 py-1',
              status === 'passed' ? 'bg-green-500' : 'bg-red-500',
            )}
          >
            Test {status}
          </span>
        </>
      )}

      {status !== 'pending' && status !== 'running' ? (
        <IconButton
          onClick={() => sendCommand('reset')}
          colorScheme="red"
          icon={<ResetIcon />}
          aria-label="Reset"
        />
      ) : null}

      <div className="flex-1" />

      <Button onClick={() => sendCommand('exit')}>Exit</Button>
    </>
  );
};

const Page: React.FC = () => {
  return (
    <HoverProvider>
      <ErrorBoundary
        fallback={(error) => (
          <Layout>
            <div className="bg-gray-50 p-4 m-4 rounded shadow">
              <h2 className="text-lg font-bold mb-2 text-red-500">
                Cyperful Error:
              </h2>
              <pre className="whitespace-pre-wrap">{error.toString()}</pre>
            </div>
          </Layout>
        )}
      >
        <Layout header={<Controls />} sidebar={<Steps />}>
          <ScenarioFrame />
        </Layout>
      </ErrorBoundary>
    </HoverProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<Page />);
