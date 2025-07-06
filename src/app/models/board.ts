export type Cell = {
  x: number;
  y: number;
  type: 'path' | 'home' | 'start' | 'safe' | 'normal';
  color?: string;
  piece?: {
    playerId: number;
    color: string;
    id: string;
    position: number;
  };
};

