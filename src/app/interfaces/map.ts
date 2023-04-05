import { MapSettings } from "./map-settings";

export interface Map {
    name: string;
    scenarioMap: string;
    fogOfWar: string;
    mapWithFogOfWar: string;
    dmNotes: string;
    playerNotes: string;
    settings: MapSettings;
}