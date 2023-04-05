import { Subject } from 'rxjs';
import { MapSettings } from '../../interfaces/map-settings';
import { Map } from '../../interfaces/map';

export interface StringUpdate {
    mapName: string;
    value: string;
}

export interface MapSettingsUpdate {
    mapName: string;
    value: MapSettings;
}

export abstract class Synchronize {
    public mapUpdateRecieved: Subject<Map> = new Subject();
    public scenarioMapUpdateRecieved: Subject<StringUpdate> = new Subject();
    public fogOfWarUpdateRecieved: Subject<StringUpdate> = new Subject();
    public mapWithFogOfWarUpdateRecieved: Subject<StringUpdate> = new Subject();
    public dmNotesUpdateRecieved: Subject<StringUpdate> = new Subject();
    public playerNotesUpdateRecieved: Subject<StringUpdate> = new Subject();
    public settingsUpdateRecieved: Subject<MapSettingsUpdate> = new Subject();

    protected handleUpdate(data: any): void {
        switch (data.update) {
            case 'map':
                this.mapUpdateRecieved.next(data.value);
                break;
            case 'scenario_map':
                this.scenarioMapUpdateRecieved.next(data.value);
                break;
            case 'fog_of_war':
                this.fogOfWarUpdateRecieved.next(data.value);
                break;
            case 'map_with_fog_of_war':
                this.mapWithFogOfWarUpdateRecieved.next(data.value);
                break;
            case 'dm_notes':
                this.dmNotesUpdateRecieved.next(data.value);
                break;
            case 'player_notes':
                this.playerNotesUpdateRecieved.next(data.value);
                break;
            case 'settings':
                this.settingsUpdateRecieved.next(data.value);
                break;
        }
    }

    abstract updateMap(map: Map): void;
    abstract updateScenarioMap(mapName: string, scenarioMap: string): void;
    abstract updateFogOfWar(mapName: string, fogOfWar: string): void;
    abstract updateMapWithFogOfWar(mapName: string, mapWithFogOfWar: string): void;
    abstract updateDmNotes(mapName: string, dmNotes: string): void;
    abstract updatePlayerNotes(mapName: string, playerNotes: string): void;
    abstract updateSettings(mapName: string, mapSettings: MapSettings): void;
}