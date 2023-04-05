import { HasEventTargetAddRemove } from 'rxjs/internal/observable/fromEvent';
import { DrawService } from '../services/draw/draw.service';
import { Layer } from 'konva/lib/Layer';
import { Vector2d } from 'konva/lib/types';
import { WhiteBoard } from './white-board';
import { Observable, forkJoin, from, map } from 'rxjs';
import Konva from 'konva';
import { Synchronize } from '../services/synchronize/synchronize';

export abstract class Drawer {
    protected drawService: DrawService;
    protected eventElement: HasEventTargetAddRemove<MouseEvent>;
    protected synchronize: Synchronize;
    protected whiteBoard: WhiteBoard;
    protected layer: Layer;
    protected copySize: Vector2d;

    abstract name: string;
    abstract id: string;
    abstract icon: string;

    constructor(
        drawService: DrawService,
        eventElement: HasEventTargetAddRemove<MouseEvent>,
        synchronize: Synchronize,
        whiteBoard: WhiteBoard,
        layer: Layer,
        copySize: Vector2d) {

        this.drawService = drawService;
        this.eventElement = eventElement;
        this.synchronize = synchronize;
        this.whiteBoard = whiteBoard;
        this.layer = layer;
        this.copySize = copySize;
    }

    public activate(): void {
        this.drawService.setPaintMode(this);
        this.drawService.setCanvas(
            this.eventElement,
            this.whiteBoard.stage,
            this.layer,
            this.copySize
        ).subscribe(_ => this.done());
    }

    abstract done(): void;
}

export class FogDrawer extends Drawer {
    public name = 'Paint Fog';
    public id = 'paint_fog';
    public icon = 'auto_fix_normal';

    public done(): void {
        const observable = this.createMapWithFogOfWarDataURL();

        observable.subscribe(mapWithFogOfWar => {
            this.whiteBoard.map.fogOfWar = this.whiteBoard.getFogOfWarDataURL();
            this.whiteBoard.map.mapWithFogOfWar = mapWithFogOfWar;

            this.synchronize.updateFogOfWar(this.whiteBoard.map.name, this.whiteBoard.map.fogOfWar);
            this.synchronize.updateMapWithFogOfWar(this.whiteBoard.map.name, this.whiteBoard.map.mapWithFogOfWar);
            return this.whiteBoard.map;
        });
    }

    private createMapWithFogOfWarDataURL(): Observable<string> {
        const pos = this.whiteBoard.stage.getPosition();
        const scale = this.whiteBoard.stage.scale() as Vector2d;
        const rec = {
            x: pos.x,
            y: pos.y,
            width: this.whiteBoard.map.settings.width * scale.x,
            height: this.whiteBoard.map.settings.height * scale.y,
            pixelRatio: 1 / scale.y
        };
        const observables = [
            from(this.whiteBoard.backLayer.toImage(rec)),
            from(this.whiteBoard.fogOfWarLayer.toImage(rec))
        ];

        return forkJoin(observables).pipe(map(res => {
            const group = new Konva.Group();

            group.add(new Konva.Image({ image: res[0] as any }));
            group.add(new Konva.Image({ image: res[1] as any }));

            return group.toDataURL();
        }));
    }
}

export class FogEraser extends FogDrawer {
    public name = 'Erase Fog';
    public id = 'erase_fog';
    public icon = 'auto_fix_off';
}

export class PlayerNotesDrawer extends Drawer {
    public name = 'Draw';
    public id = 'draw';
    public icon = 'draw';

    public done(): void {
        this.whiteBoard.map.playerNotes = this.whiteBoard.getPlayerNotesDataURL();
        this.synchronize.updatePlayerNotes(this.whiteBoard.map.name, this.whiteBoard.map.playerNotes);
    }
}
