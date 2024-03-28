import { Logo, LogoText } from "~/components/Logo";
import { withErrorBoundary } from "~/components/shared";
import { useStepsData } from "~/lib/data";

const AnimatingLogo = withErrorBoundary(
  () => {
    const status = useStepsData()?.test_status;
    const isRunning = status === "running";

    return <Logo animating={isRunning} size={10} alt="Cyperful logo" />;
  },
  () => <Logo size={10} alt="Cyperful logo" />,
);

export const Layout: React.FC<{
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}> = ({ header, sidebar, children }) => {
  return (
    <div className="flex h-screen flex-col items-stretch">
      <nav className="flex h-14 items-center space-x-4 border-b border-stone-700 px-6 py-1 shadow">
        <div className="flex items-center space-x-2">
          <AnimatingLogo />
          <h1 className="text-xl font-bold">
            <LogoText />
          </h1>
        </div>
        {header}
      </nav>
      <div className="flex flex-1 items-stretch">
        {sidebar ? (
          <div
            className="flex basis-96 flex-col items-stretch overflow-y-auto"
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
