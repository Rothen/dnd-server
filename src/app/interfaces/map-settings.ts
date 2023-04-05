
import { Vector2d } from 'konva/lib/types';
import { Token } from './token';

export interface MapSettings {
    id: string;
    dmNotesPosition?: Vector2d;
    playerNotesPosition?: Vector2d;
    width: number;
    height: number;
    pixelPerUnit: number;
    tokens: Token[];
}
