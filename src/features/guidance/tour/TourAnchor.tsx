/**
 * Wraps any view so the tour engine can locate it. Zero behavioral cost when
 * no tour is running — it only registers a ref.
 */
import React, { useEffect, useRef } from 'react';
import { View, type ViewProps } from 'react-native';
import { registerAnchor, unregisterAnchor } from './anchorRegistry';

interface TourAnchorProps extends ViewProps {
  id: string;
  children: React.ReactNode;
}

export function TourAnchor({ id, children, ...rest }: TourAnchorProps) {
  const ref = useRef<View | null>(null);

  useEffect(() => {
    const slot = ref as { current: View | null };
    registerAnchor(id, slot);
    return () => unregisterAnchor(id, slot);
  }, [id]);

  // collapsable={false} keeps the native view in the tree so measureInWindow works.
  return (
    <View ref={ref} collapsable={false} {...rest}>
      {children}
    </View>
  );
}

export default TourAnchor;
