// File: data/locations.js
export const fireSuppressionUnits = [
  {
    id: 'UNIT-KALTIM-01',
    name: 'PLTD Batakan',
    region: 'Kalimantan Timur',
    coordinates: [-1.2379, 116.8529],
    status: 'SAFE',
    sensors: { T: 32, CO: 15, SM: 0 }
  },
  {
    id: 'UNIT-BDG-04',
    name: 'PLN Pusharlis Dayeuhkolot',
    region: 'Bandung, Jawa Barat',
    coordinates: [-6.9945, 107.6300],
    status: 'WARNING',
    sensors: { T: 45, CO: 40, SM: 5 }
  },
  {
    id: 'UNIT-SMG-02',
    name: 'Gardu Induk Semarang',
    region: 'Semarang, Jawa Tengah',
    coordinates: [-7.0051, 110.4381],
    status: 'SAFE',
    sensors: { T: 35, CO: 20, SM: 0 }
  }
];