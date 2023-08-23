// @ts-expect-error how to type SVGR imports?
import { ReactComponent as LogoSvg } from '../logo.svg';
import clsx from 'clsx';

export const Logo: React.FC<{
  alt?: string;
  size?: number;
  animating?: boolean;
}> = ({ alt = 'Cyperful', size = 10, animating = false }) => {
  return (
    <LogoSvg
      className={clsx('Logo', animating && 'Logo--animating')}
      style={{
        width: `${size / 4}rem`,
        height: `${size / 4}rem`,
      }}
      alt={alt}
    />
  );
};

export const BRAND_COLORS = ['#E92727', '#EE7823', '#FFCF00', '#009154'];

export const LogoText = () => {
  return (
    <>
      <span style={{ color: BRAND_COLORS[0] }}>C</span>
      <span style={{ color: BRAND_COLORS[0] }}>y</span>
      <span style={{ color: BRAND_COLORS[1] }}>p</span>
      <span style={{ color: BRAND_COLORS[1] }}>e</span>
      <span style={{ color: BRAND_COLORS[2] }}>r</span>
      <span style={{ color: BRAND_COLORS[2] }}>f</span>
      <span style={{ color: BRAND_COLORS[3] }}>u</span>
      <span style={{ color: BRAND_COLORS[3] }}>l</span>
    </>
  );
};
