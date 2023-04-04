import Konva from "konva";
import { Vector2d } from "konva/lib/types";
import { from, forkJoin, Observable, map, fromEvent, Subscription, first, Subject } from "rxjs";
import { Map } from "./map";
import { StorageService } from "./storage.service";
import { Token } from "./token";
import { EventEmitter } from "@angular/core";

export class WhiteBoard {
    public stage: Konva.Stage;
    public backLayer: Konva.Layer;
    public fogOfWarLayer: Konva.Layer;
    public mapLayer: Konva.Layer;
    public dmNotesLayer: Konva.Layer;
    public playerNotesLayer: Konva.Layer;
    public pointerLayer: Konva.Layer;
    public tokenSelected: Subject<Token> = new Subject();

    public width = 0;
    public height = 0;

    public map: Map;
    private storageService: StorageService;

    private subscriptions: Subscription[] = [];

    constructor(containerId: string, storageService: StorageService) {
        this.storageService = storageService;
        this.initStage(containerId);
        this.initLayers();
    }

    public initMap(map: HTMLImageElement, name: string): Observable<Map> {
        this.reset();
        this.stage.absolutePosition({ x: (window.innerWidth - map.naturalWidth) / 2, y: (window.innerHeight - map.naturalHeight) / 2 });
        this.backLayer.add(new Konva.Image({ image: map }));
        this.fogOfWarLayer.add(new Konva.Rect({ width: map.naturalWidth, height: map.naturalHeight, fill: '#828282' }));
        this.mapLayer.add(new Konva.Image({ image: map, opacity: 0.4 }));

        this.map = {
            name: name,
            scenarioMap: this.backLayer.toDataURL({x: 0, y: 0, width: map.naturalWidth, height: map.naturalHeight}),
            settings: {
                width: map.naturalWidth,
                height: map.naturalHeight,
                tokens: []
            }
        } as any

        return this.store();
    }

    public loadMap(map: Map) {
        this.reset();
        this.map = map;
        this.stage.absolutePosition({ x: (window.innerWidth - map.settings.width) / 2, y: (window.innerHeight - map.settings.height) / 2 });

        const mapImage = new Image();
        const fogOfWarImage = new Image();
        const dmNotesImage = new Image();
        const playerNotesImage = new Image();

        fromEvent(mapImage, 'load').pipe(first()).subscribe(_ => {
            this.backLayer.add(new Konva.Image({ image: mapImage }));
            this.mapLayer.add(new Konva.Image({ image: mapImage, opacity: 0.4 }));
        });
        fromEvent(fogOfWarImage, 'load').pipe(first()).subscribe(_ => {
            this.fogOfWarLayer.add(new Konva.Image({ image: fogOfWarImage }));
        });
        fromEvent(dmNotesImage, 'load').pipe(first()).subscribe(_ => {
            this.dmNotesLayer.add(new Konva.Image({ image: dmNotesImage }));
        });
        fromEvent(playerNotesImage, 'load').pipe(first()).subscribe(_ => {
            this.playerNotesLayer.add(new Konva.Image({ image: playerNotesImage }));
        });

        this.map.settings.tokens.forEach(token => {
            this.generateToken(token);
        });

        mapImage.src = map.scenarioMap;
        fogOfWarImage.src = map.fogOfWar;
        dmNotesImage.src = map.dmNotes;
        playerNotesImage.src = map.playerNotes;
    }

    public updateTokens(): void {
        if (this.map && this.map.settings.tokens) {
            this.pointerLayer.destroyChildren();
            this.subscriptions.forEach(subscription => subscription.unsubscribe());
            this.subscriptions = [];
            this.map.settings.tokens.forEach(token => {
                this.generateToken(token);
            });
            this.store().subscribe();
        }
    }

    private generateToken(token: Token): void {
        const scale: Vector2d = { x: 0.5, y: 0.5 };
        const size = { width: 100, height: 100 };
        let fontSize = 50;

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

        const tokenGroup = new Konva.Group({ width: size.width, height: size.height, listening: true, draggable: true, x: token.position.x, y: token.position.y, scale: scale });
        let color = 'green';
        
        if (token.type === 'npc') {
            color = 'bisque';
        } else if (token.type === 'enemy') {
            color = 'red';
        }

        tokenGroup.add(new Konva.Circle({ fill: color, width: size.width, height: size.height, scale: scale }));
        tokenGroup.add(new Konva.Text({ fontStyle: 'bold', text: token.name.charAt(0), fontSize: fontSize, verticalAlign: 'middle', align: 'center', width: size.width, height: size.height, x: -size.width/2*scale.x, y: -size.height/2*scale.y, scale: scale }));
        this.subscriptions.push(fromEvent(tokenGroup, 'dragend').subscribe(res => {
            token.position = tokenGroup.position();
            this.storageService.storeSettingsFile(this.map.name, this.map.settings);
        }));
        this.subscriptions.push(fromEvent(tokenGroup, 'click').subscribe(res => {
            this.tokenSelected.next(token);
        }));
        this.pointerLayer.add(tokenGroup);
    }

    public reset(): void {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions = [];
        this.backLayer.destroyChildren();
        this.fogOfWarLayer.destroyChildren();
        this.mapLayer.destroyChildren();
        this.dmNotesLayer.destroyChildren();
        this.playerNotesLayer.destroyChildren();
        this.pointerLayer.destroyChildren();
        this.stage.scale({ x: 1, y: 1 });
        this.stage.absolutePosition({ x: 0, y: 0 });
    }

    public initStage(containerId: string): void {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.stage = new Konva.Stage({
            width: width,
            height: height,
            container: containerId
        });
        Konva.dragButtons = [2];

        this.stage.draggable(true);

        this.stage.on('dragend', (e) => {
            const position = e.currentTarget.position();
        });

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
        this.dmNotesLayer = new Konva.Layer();
        this.playerNotesLayer = new Konva.Layer();
        this.pointerLayer = new Konva.Layer();

        this.stage.add(this.backLayer);
        this.stage.add(this.fogOfWarLayer);
        this.stage.add(this.mapLayer);
        this.stage.add(this.dmNotesLayer);
        this.stage.add(this.playerNotesLayer);
        this.stage.add(this.pointerLayer);

        this.backLayer.draw();
        this.fogOfWarLayer.draw();
        this.mapLayer.draw();
        this.dmNotesLayer.draw();
        this.playerNotesLayer.draw();
        this.pointerLayer.draw();
    }
    
    public store(): Observable<Map> {
        return this.getMapWithFogOfWarDataURL().pipe(map(mapWithFogOfWar => {
            this.map.scenarioMap = this.getScenarioMapDataURL();
            this.map.fogOfWar = this.getFogOfWarDataURL();
            this.map.mapWithFogOfWar = mapWithFogOfWar;
            this.map.dmNotes = this.getDmNotesDataURL();
            this.map.playerNotes = this.getPlayerNotesDataURL();

            this.storageService.storeMap(this.map);
            return this.map;
        }));
    }

    public getScenarioMapDataURL(): string {
        const pos = this.stage.getPosition();
        const scale = this.stage.scale() as Vector2d;
        const rec = { x: pos.x, y: pos.y, width: this.map.settings.width * scale.x, height: this.map.settings.height * scale.y, pixelRatio: 1 / scale.y };
        return this.backLayer.toDataURL(rec);
    }

    public getFogOfWarDataURL(): string {
        const pos = this.stage.getPosition();
        const scale = this.stage.scale() as Vector2d;
        const rec = { x: pos.x, y: pos.y, width: this.map.settings.width * scale.x, height: this.map.settings.height * scale.y, pixelRatio: 1 / scale.y };
        return this.fogOfWarLayer.toDataURL(rec);
    }

    public getMapWithFogOfWarDataURL(): Observable<string> {
        const pos = this.stage.getPosition();
        const scale = this.stage.scale() as Vector2d;
        const rec = { x: pos.x, y: pos.y, width: this.map.settings.width * scale.x, height: this.map.settings.height * scale.y, pixelRatio: 1 / scale.y };
        const observables = [
            from(this.backLayer.toImage(rec)),
            from(this.fogOfWarLayer.toImage(rec))
        ];

        return forkJoin(observables).pipe(map(res => {
            const layer = new Konva.Layer();

            layer.add(new Konva.Image({ image: res[0] as any }));
            layer.add(new Konva.Image({ image: res[1] as any }));

            return layer.toDataURL();
        }));
    }

    public getDmNotesDataURL(): string {
        const pos = this.stage.getPosition();
        const scale = this.stage.scale() as Vector2d;
        const rec = { x: 0, y: 0, width: 0 * scale.x, height: 0 * scale.y, pixelRatio: 1 / scale.y };
        return this.dmNotesLayer.toDataURL(rec);
    }

    public getPlayerNotesDataURL(): string {
        const pos = this.stage.getPosition();
        const scale = this.stage.scale() as Vector2d;
        const rec = { x: 0, y: 0, width: 0 * scale.x, height: 0 * scale.y, pixelRatio: 1 / scale.y };
        return this.playerNotesLayer.toDataURL(rec);
    }
}