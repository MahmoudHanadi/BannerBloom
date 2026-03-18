import type {
  BackgroundConfig,
  BannerElement,
  CTAConfig,
  LogoConfig,
} from '../types/banner';

export const createDefaultElements = (): BannerElement[] => [
  {
    id: '1',
    type: 'text',
    content: 'BannerBloom',
    x: 10,
    y: 10,
    width: 80,
    height: 20,
    rotation: 0,
    aspectRatioLocked: true,
    aspectRatio: 4,
    style: {
      color: '#000000',
      fontSize: '100px',
      fontWeight: 'bold',
      textAlign: 'center',
      fontFamily: 'Inter',
    },
  },
  {
    id: '2',
    type: 'shape',
    content: '#19C37D',
    x: 30,
    y: 40,
    width: 40,
    height: 40,
    rotation: 0,
    aspectRatioLocked: false,
    aspectRatio: 1,
    shapeType: 'rectangle',
  },
];

export const createNewProjectElements = (): BannerElement[] => [
  {
    id: '1',
    type: 'text',
    content: 'Your campaign headline',
    x: 10,
    y: 40,
    width: 80,
    height: 20,
    rotation: 0,
    aspectRatioLocked: true,
    aspectRatio: 4,
    style: {
      color: '#000000',
      fontSize: '100px',
      fontWeight: 'bold',
      textAlign: 'center',
      fontFamily: 'Inter',
    },
  },
];

export const createDefaultBackground = (): BackgroundConfig => ({
  type: 'solid',
  value: '#F8FBF9',
});

export const createDefaultLogo = (): LogoConfig | null => null;

export const createDefaultCTA = (): CTAConfig | null => null;
