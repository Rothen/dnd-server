import { Subject } from 'rxjs';
import { MapSettings } from '../../interfaces/map-settings';
import { Map } from '../../interfaces/map';

export interface MapUpdate {
    update: string;
    mapName: string;
    value: Map;
}

export interface StringUpdate {
    update: string;
    mapName: string;
    value: string;
}

export interface MapSettingsUpdate {
    update: string;
    mapName: string;
    value: MapSettings;
}

export abstract class Synchronize {
    public mapUpdateRecieved: Subject<MapUpdate> = new Subject();
    public scenarioMapUpdateRecieved: Subject<StringUpdate> = new Subject();
    public fogOfWarUpdateRecieved: Subject<StringUpdate> = new Subject();
    public mapWithFogOfWarUpdateRecieved: Subject<StringUpdate> = new Subject();
    public dmNotesUpdateRecieved: Subject<StringUpdate> = new Subject();
    public playerNotesUpdateRecieved: Subject<StringUpdate> = new Subject();
    public settingsUpdateRecieved: Subject<MapSettingsUpdate> = new Subject();

    protected handleUpdate(data: any): void {
        switch (data.update) {
            case 'map':
                this.mapUpdateRecieved.next(data);
                break;
            case 'scenario_map':
                this.scenarioMapUpdateRecieved.next(data);
                break;
            case 'fog_of_war':
                this.fogOfWarUpdateRecieved.next(data);
                break;
            case 'map_with_fog_of_war':
                this.mapWithFogOfWarUpdateRecieved.next(data);
                break;
            case 'dm_notes':
                this.dmNotesUpdateRecieved.next(data);
                break;
            case 'player_notes':
                this.playerNotesUpdateRecieved.next(data);
                break;
            case 'settings':
                this.settingsUpdateRecieved.next(data);
                break;
        }
    }

    abstract startSynchronizing(): void;
    abstract stopSynchronizing(): void;
    abstract updateMap(map: Map): void;
    abstract updateScenarioMap(mapName: string, scenarioMap: string): void;
    abstract updateFogOfWar(mapName: string, fogOfWar: string): void;
    abstract updateMapWithFogOfWar(mapName: string, mapWithFogOfWar: string): void;
    abstract updateDmNotes(mapName: string, dmNotes: string): void;
    abstract updatePlayerNotes(mapName: string, playerNotes: string): void;
    abstract updateSettings(mapName: string, mapSettings: MapSettings): void;
}
