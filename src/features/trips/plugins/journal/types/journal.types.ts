export enum LayoutType {
  MIXED = 'mixed', // 1 large + 2 small + 1 wide
  GRID = 'grid', // 2 large + 1 wide
  HERO = 'hero', // 1 full-width
}

export enum BlockType {
  TEXT = 'text',
  IMAGE = 'image',
  GALLERY = 'gallery',
  MAP = 'map',
  AUDIO = 'audio',
}

export enum BlockSize {
  LARGE = 'large',
  SMALL = 'small',
  MEDIUM = 'medium',
  WIDE = 'wide',
  TALL = 'tall',
  HERO = 'hero',
}

export interface TextContent {
  text: string;
  wordCount: number;
}

export interface ImageContent {
  uri: string;
  caption?: string;
}

export interface GalleryContent {
  images: { uri: string; caption?: string }[];
}

export interface MapContent {
  latitude: number;
  longitude: number;
  locationName: string;
}

export interface AudioContent {
  uri: string;
  duration: number; // seconds
}

export type BlockContent = 
  | { type: BlockType.TEXT; data: TextContent }
  | { type: BlockType.IMAGE; data: ImageContent }
  | { type: BlockType.GALLERY; data: GalleryContent }
  | { type: BlockType.MAP; data: MapContent }
  | { type: BlockType.AUDIO; data: AudioContent };

export interface ContentBlock {
  id: string;
  position: number;
  size: BlockSize;
  content: BlockContent | null; // null means empty slot
}

export interface JournalEntry {
  id: string;
  tripId: string;
  title: string;
  date: Date;
  layout: LayoutType;
  blocks: ContentBlock[];
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LayoutTemplate {
  type: LayoutType;
  name: string;
  blocks: { size: BlockSize; position: number }[];
}
