import React from 'react';
import Svg from './Svg';

export default function(path, name, viewBox) {
  const Component = props => (
    <Svg viewBox={viewBox} {...props}>
      {path}
    </Svg>
  );
  Component.displayName = name;
  return Component;
}
