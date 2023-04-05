import Konva from 'konva';
import { Vector2d } from 'konva/lib/types';
import { fromEvent, Subscription, first, Subject, throttleTime } from 'rxjs';
import { Map } from '../interfaces/map';
import { Token } from '../interfaces/token';
import { MapSettings } from '../interfaces/map-settings';

export class WhiteBoard {
    public stage: Konva.Stage;
    public backLayer: Konva.Layer;
    public fogOfWarLayer: Konva.Layer;
    public mapLayer: Konva.Layer;
    public mapWithFogOfWarLayer: Konva.Layer;
    public dmNotesLayer: Konva.Layer;
    public playerNotesLayer: Konva.Layer;
    public pointerLayer: Konva.Layer;
    public tokenSelected: Subject<Token> = new Subject();
    public map: Map;
    public tokensChanged: Subject<Token> = new Subject();
    public inDmMode: boolean;

    protected subscriptions: Subscription[] = [];

    constructor(containerId: string) {
        Konva.dragButtons = [2];
        this.initStage(containerId);
        this.initLayers();
    }

    public loadMap(map: Map, inDmMode: boolean) {
        this.inDmMode = inDmMode;
        const force = !this.map || this.map.settings.id !== map.settings.id;
        this.reset(force);
        this.map = map;
        if (force) {
            this.stage.absolutePosition({
                x: (window.innerWidth - this.map.settings.width) / 2,
                y: (window.innerHeight - this.map.settings.height) / 2
            });
        }

        this.updateScenarioMap(this.map.scenarioMap);
        this.updateFogOfWar(this.map.fogOfWar);
        this.updateMapWithFogOfWar(this.map.mapWithFogOfWar);
        this.updateDmNotes(this.map.dmNotes);
        this.updatePlayerNotes(this.map.playerNotes);
        this.updateSettings(this.map.settings);
        this.updateTokens(this.map.settings.tokens);
    }

    public updateTokens(tokens: Token[]): void {
        this.pointerLayer.destroyChildren();
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions = [];
        tokens.forEach(token => {
            this.drawToken(token);
        });
        this.fixTokenEvents(tokens);
    }

    public reset(force: boolean): void {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions = [];
        this.backLayer.destroyChildren();
        this.fogOfWarLayer.destroyChildren();
        this.mapLayer.destroyChildren();
        this.mapWithFogOfWarLayer.destroyChildren();
        this.dmNotesLayer.destroyChildren();
        this.playerNotesLayer.destroyChildren();
        this.pointerLayer.destroyChildren();

        if (force) {
            this.stage.scale({ x: 1, y: 1 });
            this.stage.absolutePosition({ x: 0, y: 0 });
        }
    }

    public initStage(containerId: string): void {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.stage = new Konva.Stage({
            width,
            height,
            container: containerId
        });

        this.stage.draggable(true);

        this.stage.on('dragend', (e) => {
            const position = e.currentTarget.position();
        });

        window.addEventListener('resize', event => this.stage.size({ width: window.innerWidth, height: window.innerHeight }));

        const scaleBy = 1.1;
        this.stage.on('wheel', (e) => {
            e.evt.preventDefault();

            const oldScale = this.stage.scaleX();
            const pointer = this.stage.getPointerPosition() as Vector2d;

            const mousePointTo = {
                x: (pointer.x - this.stage.x()) / oldScale,
                y: (pointer.y - this.stage.y()) / oldScale,
            };

            // how to scale? Zoom in? Or zoom out?
            let direction = e.evt.deltaY > 0 ? 1 : -1;

            // when we zoom on trackpad, e.evt.ctrlKey is true
            // in that case lets revert direction
            if (e.evt.ctrlKey) {
                direction = -direction;
            }

            const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

            this.stage.scale({ x: newScale, y: newScale });

            const newPos = {
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
            };
            this.stage.position(newPos);
        });
    }

    public initLayers(): void {
        this.backLayer = new Konva.Layer();
        this.fogOfWarLayer = new Konva.Layer();
        this.mapLayer = new Konva.Layer();
        this.mapWithFogOfWarLayer = new Konva.Layer();
        this.dmNotesLayer = new Konva.Layer();
        this.playerNotesLayer = new Konva.Layer();
        this.pointerLayer = new Konva.Layer();

        this.stage.add(this.backLayer);
        this.stage.add(this.fogOfWarLayer);
        this.stage.add(this.mapLayer);
        this.stage.add(this.mapWithFogOfWarLayer);
        this.stage.add(this.dmNotesLayer);
        this.stage.add(this.playerNotesLayer);
        this.stage.add(this.pointerLayer);

        this.backLayer.draw();
        this.fogOfWarLayer.draw();
        this.mapLayer.draw();
        this.mapWithFogOfWarLayer.draw();
        this.dmNotesLayer.draw();
        this.playerNotesLayer.draw();
        this.pointerLayer.draw();
    }

    public getScenarioMapDataURL(): string {
        const pos = this.stage.getPosition();
        const scale = this.stage.scale() as Vector2d;
        const rec = {
            x: pos.x,
            y: pos.y,
            width: this.map.settings.width * scale.x,
            height: this.map.settings.height * scale.y,
            pixelRatio: 1 / scale.y
        };
        return this.backLayer.toDataURL(rec);
    }

    public getFogOfWarDataURL(): string {
        const pos = this.stage.getPosition();
        const scale = this.stage.scale() as Vector2d;
        const rec = {
            x: pos.x,
            y: pos.y,
            width: this.map.settings.width * scale.x,
            height: this.map.settings.height * scale.y,
            pixelRatio: 1 / scale.y
        };
        return this.fogOfWarLayer.toDataURL(rec);
    }

    public getDmNotesDataURL(): string {
        const pos = this.stage.getPosition();
        const scale = this.stage.scale() as Vector2d;
        const rec = {
            x: 0,
            y: 0,
            width: 0 * scale.x,
            height: 0 * scale.y,
            pixelRatio: 1 / scale.y
        };
        return this.dmNotesLayer.toDataURL(rec);
    }

    public getPlayerNotesDataURL(): string {
        const pos = this.stage.getPosition();
        const scale = this.stage.scale() as Vector2d;
        const rec = {
            x: 0,
            y: 0,
            width: 0 * scale.x,
            height: 0 * scale.y,
            pixelRatio: 1 / scale.y
        };
        return this.playerNotesLayer.toDataURL(rec);
    }

    public updatePlayerNotes(playerNotes: string): void {
        this.updateLayer(this.playerNotesLayer, playerNotes);
    }

    public updateScenarioMap(scenarioMap: string): void {
        this.updateLayer(this.backLayer, scenarioMap);
        this.updateLayer(this.mapLayer, scenarioMap, 0.4);
    }

    public updateFogOfWar(fogOfWar: string): void {
        this.updateLayer(this.fogOfWarLayer, fogOfWar);
    }

    public updateDmNotes(dmNotes: string): void {
        this.updateLayer(this.dmNotesLayer, dmNotes);
    }

    public updateMapWithFogOfWar(mapWithFogOfWar: string): void {
        this.updateLayer(this.mapWithFogOfWarLayer, mapWithFogOfWar);
    }

    public updateSettings(mapSettings: MapSettings): void {
        this.updateTokens(mapSettings.tokens);
    }

    protected updateLayer(layer: Konva.Layer, image: string, opacity: number = 1): void {
        if (opacity === undefined || opacity === null) {
            opacity = 1;
        }

        const htmlImage = new Image();

        fromEvent(htmlImage, 'load').pipe(first()).subscribe(_ => {
            layer.add(new Konva.Image({ image: htmlImage, opacity }));
        });

        htmlImage.src = image;
    }

    protected drawToken(token: Token): void {
        if (!this.inDmMode && token.hide) {
            return;
        }
        const scale: Vector2d = { x: 1, y: 1 };
        const size = {
            width: this.map.settings.pixelPerUnit,
            height: this.map.settings.pixelPerUnit
        };
        let fontSize = this.map.settings.pixelPerUnit * 0.7;
        const opacity = (token.hide) ? 0.7 : 1;

        switch (token.size) {
            case 'tiny':
                size.width *= 0.5;
                size.height *= 0.5;
                fontSize *= 0.5;
                break;
            case 'small':
                size.width *= 1;
                size.height *= 1;
                fontSize *= 1;
                break;
            case 'medium':
                size.width *= 1;
                size.height *= 1;
                fontSize *= 1;
                break;
            case 'large':
                size.width *= 2;
                size.height *= 2;
                fontSize *= 2;
                break;
            case 'huge':
                size.width *= 3;
                size.height *= 3;
                fontSize *= 3;
                break;
            case 'gargantuan':
                size.width *= 4;
                size.height *= 4;
                fontSize *= 4;
                break;
        }

        const tokenGroup = new Konva.Group({
            width: size.width,
            height: size.height,
            listening: true,
            draggable: true,
            x: token.position.x,
            y: token.position.y,
            scale,
            id: token.id, opacity
        });

        let color = 'green';

        if (token.type === 'npc') {
            color = 'bisque';
        } else if (token.type === 'enemy') {
            color = 'red';
        }

        tokenGroup.add(new Konva.Circle({
            fill: color,
            width: size.width,
            height: size.height,
            scale
        }));
        tokenGroup.add(new Konva.Text({
            fontStyle: 'bold',
            text: token.name.charAt(0),
            fontSize,
            verticalAlign: 'middle',
            align: 'center',
            width: size.width,
            height: size.height,
            x: -size.width / 2 * scale.x,
            y: -size.height / 2 * scale.y,
            scale
        }));

        this.pointerLayer.add(tokenGroup);
    }

    private fixTokenEvents(tokens: Token[]): void {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions = [];
        const playerNotesChildren = this.pointerLayer.getChildren();

        for (const token of tokens) {
            const tokenGroup = playerNotesChildren.find(tokenGroupEl => tokenGroupEl.id() === token.id);

            if (tokenGroup) {
                this.subscriptions.push(fromEvent(tokenGroup, 'dragend').subscribe(res => {
                    token.position = tokenGroup.position();
                    this.tokensChanged.next(token);
                }));
                this.subscriptions.push(fromEvent(tokenGroup, 'dragmove').pipe(
                    throttleTime(1000 / 60)
                ).subscribe(res => {
                    token.position = tokenGroup.position();
                    this.tokensChanged.next(token);
                }));
                this.subscriptions.push(fromEvent(tokenGroup, 'click').subscribe(res => {
                    this.tokenSelected.next(token);
                }));
            }
        }
    }
}
