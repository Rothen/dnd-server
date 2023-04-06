import Konva from 'konva';
import { Vector2d } from 'konva/lib/types';
import { fromEvent, Subscription, first, Subject, throttleTime } from 'rxjs';
import { Map } from '../interfaces/map';
import { Token } from '../interfaces/token';
import { MapSettings } from '../interfaces/map-settings';
import { TokenDrawer } from './token-drawer';
import { DistanceDrawer } from './distance-drawer';

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
    public selectedToken: Token;
    public selectedTokenGroup: Konva.Group;

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

    public getVisibleCenter(): Vector2d {
        return this.getVisiblePoint({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }

    public getVisiblePoint(windowPoint: Vector2d): Vector2d {
        return {
            x: (windowPoint.x - this.stage.x()) / this.stage.scaleX(),
            y: (windowPoint.y - this.stage.y()) / this.stage.scaleY(),
        };
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
        if (!token.position) {
            token.position = this.getVisibleCenter();
        }

        const tokenGroup = TokenDrawer.drawToken(token, this.map.settings.pixelPerUnit);

        this.pointerLayer.add(tokenGroup);
    }

    private fixTokenEvents(tokens: Token[]): void {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions = [];
        const pointerChildren = this.pointerLayer.getChildren();

        for (const token of tokens) {
            const tokenGroup = pointerChildren.find(tokenGroupEl => tokenGroupEl.id() === token.id);

            if (tokenGroup) {
                this.subscriptions.push(fromEvent(tokenGroup, 'dragend').subscribe(res => {
                    token.position = tokenGroup.position();
                    this.selectedToken = token;
                    this.selectedTokenGroup = tokenGroup as Konva.Group;
                    this.drawDistances();
                    this.tokensChanged.next(token);
                }));
                this.subscriptions.push(fromEvent(tokenGroup, 'dragmove').pipe(
                    throttleTime(1000 / 60)
                ).subscribe(res => {
                    token.position = tokenGroup.position();
                    this.selectedToken = token;
                    this.selectedTokenGroup = tokenGroup as Konva.Group;
                    this.drawDistances();
                    this.tokensChanged.next(token);
                }));
                this.subscriptions.push(fromEvent(tokenGroup, 'click').subscribe(res => {
                    this.tokenSelected.next(token);
                    this.selectedToken = token;
                    this.selectedTokenGroup = tokenGroup as Konva.Group;
                    this.drawDistances();
                }));
            }
        }
    }

    private drawDistances(): void {
        this.pointerLayer.getChildren(function (node) {
            return node.getClassName() === 'Group' && node.id() === '';
        }).forEach(distanceLine => distanceLine.destroy())
        const tokenGroups = this.pointerLayer.getChildren(function (node) {
            return node.getClassName() === 'Group' && node.id() !== '';
        });
        const posA = this.selectedTokenGroup.position();

        for (const tokenGroup of tokenGroups) {
            tokenGroup.zIndex(2);
            if (tokenGroup === this.selectedTokenGroup) {
                continue;
            }

            const lineGroup = DistanceDrawer.draw(posA, tokenGroup.position(), this.map.settings.pixelPerUnit);
            this.pointerLayer.add(lineGroup);
            lineGroup.zIndex(0);
        }
    }
}
