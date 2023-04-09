import { MapSettingsData } from './map-settings-data';

export interface MapData {
    name: string;
    scenarioMap: string;
    fogOfWar: string;
    mapWithFogOfWar: string;
    dmNotes: string;
    playerNotes: string;
    settings: MapSettingsData;
}
