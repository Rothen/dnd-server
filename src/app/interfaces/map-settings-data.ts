
import { Vector2d } from 'konva/lib/types';
import { TokenData } from './token-data';

export interface MapSettingsData {
    id: string;
    dmNotesPosition?: Vector2d;
    playerNotesPosition?: Vector2d;
    width: number;
    height: number;
    pixelPerUnit: number;
    tokens: TokenData[];
}
