import React from 'react';

// @ts-expect-error how to type SVGR imports?
import { ReactComponent as LogoSvg } from './logo.svg';
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
