import type { Tile } from '../simulation/types';
export function generateWorld(seed: number): Tile[] {
  return Array.from({ length: 400 }, (_, id) => {
    const x = id % 20, y = Math.floor(id / 20);
    const n = ((Math.imul(id + 31, 2654435761) ^ seed) >>> 0) % 100;
    const road = x % 5 === 0 || y % 5 === 0;
    const district = x < 10 ? (y < 10 ? 'Distrito financiero' : 'Barrio residencial') : (y < 10 ? 'Centro comercial' : 'Distrito industrial');
    const kind = road ? 'road' : ((x === 8 && y === 8) || (x === 9 && y === 8) || n < 18) ? 'available' : n < 32 ? 'park' : x >= 10 && y >= 10 ? 'industrial' : n < 64 ? 'residential' : 'commercial';
    const traffic = 70 + ((x * 7 + y * 13 + seed) % 61 + 61) % 61;
    return { id, x, y, kind, district, traffic, price: 200000 + Math.max(0, traffic - 100) * 1000, owned: false };
  });
}
