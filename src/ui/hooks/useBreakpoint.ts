import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'tablet';

export const useBreakpoint = (): Breakpoint => {
  const { width } = useWindowDimensions();

  if (width >= 1024) return 'tablet';
  if (width >= 768) return 'lg';
  if (width >= 640) return 'md';
  return 'sm';
};
