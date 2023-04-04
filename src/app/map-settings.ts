
import { Vector2d } from "konva/lib/types"
import { Token } from "./token";

export interface MapSettings {
    dmNotesPosition?: Vector2d;
    playerNotesPosition?: Vector2d;
    width: number;
    height: number;
    tokens: Token[];
}