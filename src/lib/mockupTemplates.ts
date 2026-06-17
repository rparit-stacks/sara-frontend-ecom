export type FabricTypeId = 'cotton' | 'silk' | 'linen' | 'polyester' | 'velvet';

export interface MockupTemplate {
  id: string;
  name: string;
  imageUrl: string;
  fileName: string;
  defaultFabric: FabricTypeId;
}

/** Studio Sara preset templates — user picks one, no upload needed */
export const MOCKUP_TEMPLATES: MockupTemplate[] = [
  {
    id: 'material-classic',
    name: 'Classic Material',
    imageUrl: '/mockups/Free_Material_Mockup_2.jpg',
    fileName: 'Free_Material_Mockup_2.jpg',
    defaultFabric: 'cotton',
  },
  {
    id: 'fabric-roll-54',
    name: 'Fabric Roll 5.4',
    imageUrl: '/mockups/5.4-o.avif',
    fileName: '5.4-o.avif',
    defaultFabric: 'silk',
  },
  {
    id: 'fabric-roll-55',
    name: 'Fabric Roll 5.5',
    imageUrl: '/mockups/5.5-o.avif',
    fileName: '5.5-o.avif',
    defaultFabric: 'linen',
  },
];

export const FABRIC_OPTIONS: { id: FabricTypeId; label: string }[] = [
  { id: 'cotton', label: 'Cotton' },
  { id: 'silk', label: 'Silk' },
  { id: 'linen', label: 'Linen' },
  { id: 'polyester', label: 'Polyester' },
  { id: 'velvet', label: 'Velvet' },
];

export const STUDIO_SARA_BRAND = 'Studio Sara';
