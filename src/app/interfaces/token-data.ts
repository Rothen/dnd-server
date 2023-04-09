import { Vector2d } from 'konva/lib/types';

export interface TokenData {
    id: string;
    type: 'player' | 'npc' | 'enemy';
    name: string;
    position: Vector2d;
    size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
    hide: boolean;
    maxHealth?: number;
    health?: number;
}
