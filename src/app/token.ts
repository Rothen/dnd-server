import { Vector2d } from "konva/lib/types";

export interface Token {
    type: 'player' | 'npc' | 'enemy';
    name: string;
    position: Vector2d;
    size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
}