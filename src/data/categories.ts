import { Location, Airplane, Building, Box, Car, Map1 } from 'iconsax-react-native';

export const categories = [
  { 
    id: 1, 
    name: 'Plan', 
    icon: Location,
    color: '#7C3AED', // Purple
    bgColor: '#7C3AED15',
  },
  { 
    id: 2, 
    name: 'Flight', 
    icon: Airplane,
    color: '#3B82F6', // Blue
    bgColor: '#3B82F615',
  },
  { 
    id: 3, 
    name: 'Hotel', 
    icon: Building,
    color: '#F97316', // Orange
    bgColor: '#F9731615',
  },
  { 
    id: 4, 
    name: 'Package', 
    icon: Box,
    color: '#EC4899', // Pink
    bgColor: '#EC489915',
  },
  { 
    id: 5, 
    name: 'Car', 
    icon: Car,
    color: '#22C55E', // Green
    bgColor: '#22C55E15',
  },
  { 
    id: 6, 
    name: 'Experiences', 
    icon: Map1,
    color: '#EAB308', // Yellow/Gold
    bgColor: '#EAB30815',
  },
];
