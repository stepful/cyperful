declare module "*.svg?react" {
  const ReactComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module "*?worker" {
  const Worker: new () => Worker;
  export default Worker;
}
