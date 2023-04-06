import { Injectable } from '@angular/core';
import Konva from 'konva';
import { Map } from '../../interfaces/map';
import { Token } from '../../interfaces/token';
import { Observable, fromEvent, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MapService {
    constructor() { }

    public createMap(mapContent: Blob | MediaSource, name: string, pixelPerUnit: number): Observable<Map> {
        const mapImage = new Image();

        const observable = fromEvent(mapImage, 'load').pipe(map(res => {
            const scenarioMap = new Konva.Image({ image: mapImage });
            const fogOfWar = new Konva.Rect({ width: mapImage.naturalWidth, height: mapImage.naturalHeight, fill: '#828282' });
            const mapWithFogOfWar = new Konva.Group({ width: mapImage.naturalWidth, height: mapImage.naturalHeight });
            const dmNotes = new Konva.Rect({ width: 0, height: 0 });
            const playerNotes = new Konva.Rect({ width: 0, height: 0 });

            mapWithFogOfWar.add(scenarioMap);
            mapWithFogOfWar.add(fogOfWar);

            return {
                name,
                scenarioMap: scenarioMap.toDataURL({ x: 0, y: 0, width: mapImage.naturalWidth, height: mapImage.naturalHeight }),
                fogOfWar: fogOfWar.toDataURL({ x: 0, y: 0, width: mapImage.naturalWidth, height: mapImage.naturalHeight }),
                mapWithFogOfWar: mapWithFogOfWar.toDataURL({ x: 0, y: 0, width: mapImage.naturalWidth, height: mapImage.naturalHeight }),
                dmNotes: dmNotes.toDataURL(),
                playerNotes: playerNotes.toDataURL(),
                settings: {
                    id: this.createUUIDv4(),
                    width: mapImage.naturalWidth,
                    height: mapImage.naturalHeight,
                    pixelPerUnit,
                    tokens: []
                }
            };
        }));

        mapImage.src = URL.createObjectURL(mapContent);

        return observable;
    }

    public addToken(mapToAdd: Map, type: 'player' | 'npc' | 'enemy'): Token {
        const token: Token = {
            id: this.createUUIDv4(),
            name: '',
            size: 'medium',
            type,
            hide: true,
            position: null
        };

        mapToAdd.settings.tokens.push(token);

        return token;
    }

    public createUUIDv4(): string {
        let dt = new Date().getTime();
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            /*eslint no-bitwise: ["error", { "allow": ["|", "&"] }] */
            const r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            /*eslint no-bitwise: ["error", { "allow": ["|", "&"] }] */
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }
}
