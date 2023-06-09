import Konva from 'konva';
import { Vector2d } from 'konva/lib/types';
import { fromEvent, Subscription, first, Subject } from 'rxjs';
import { MapData } from '../interfaces/map-data';
import { TokenData } from '../interfaces/token-data';
import { MapSettingsData } from '../interfaces/map-settings-data';

export class WhiteBoard {
    public stage: Konva.Stage;
    public backLayer: Konva.Layer;
    public fogOfWarLayer: Konva.Layer;
    public mapLayer: Konva.Layer;
    public mapWithFogOfWarLayer: Konva.Layer;
    public dmNotesLayer: Konva.Layer;
    public playerNotesLayer: Konva.Layer;
    public pointerLayer: Konva.Layer;
    public tokenSelected: Subject<TokenData> = new Subject();
    public map: MapData;
    public tokensChanged: Subject<TokenData> = new Subject();
    public inDmMode: boolean;
    public selectedToken: TokenData;
    public selectedTokenGroup: Konva.Group;

    protected subscriptions: Subscription[] = [];

    constructor(containerId: string) {
        Konva.dragButtons = [2];
        this.initStage(containerId);
        this.initLayers();
    }

    public loadMap(map: MapData, inDmMode: boolean) {
        /*this.inDmMode = inDmMode;
        const force = !this.map || this.map.settings.id !== map.settings.id;
        this.reset(force);
        this.map = map;
        if (force) {
            this.stage.absolutePosition({
                x: (window.innerWidth - this.map.settings.width) / 2,
                y: (window.innerHeight - this.map.settings.height) / 2
            });
        }*/

        /*this.updateScenarioMap(this.map.scenarioMap);
        this.updateFogOfWar(this.map.fogOfWar);
        this.updateMapWithFogOfWar(this.map.mapWithFogOfWar);
        this.updateDmNotes(this.map.dmNotes);
        this.updatePlayerNotes(this.map.playerNotes);*/
        /*this.updateSettings(this.map.settings);
        this.updateTokens(this.map.settings.tokens);*/
    }

    public updateTokens(tokens: TokenData[]): void {
        this.pointerLayer.destroyChildren();
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions = [];
        tokens.forEach(token => {
            this.drawToken(token);
        });
        this.fixTokenEvents(tokens);
        if (this.selectedToken) {
            console.log('here');
            const foundToken = tokens.find(token => token.id === this.selectedToken.id);

            if (foundToken && (!foundToken.hide || this.inDmMode)) {
                console.log('here1');
                this.selectedToken = foundToken;
                this.selectedTokenGroup = this.playerNotesLayer.getChildren(node => node.id() === foundToken.id)[0] as Konva.Group;
            } else {
                console.log('here2');
                this.selectedToken = null;
                this.selectedTokenGroup = null;
            }
        }

        this.updateDistances();
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
        Konva.hitOnDragEnabled = true;
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

        let lastCenter = null;
        let lastDist = 0;

        function getCenter(p1, p2) {
            return {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2,
            };
        }

        this.stage.on('touchmove', e => {
            e.evt.preventDefault();
            const touch1 = e.evt.touches[0];
            const touch2 = e.evt.touches[1];

            if (touch1 && touch2) {
                // if the stage was under Konva's drag&drop
                // we need to stop it, and implement our own pan logic with two pointers
                if (this.stage.isDragging()) {
                    this.stage.stopDrag();
                }

                const p1 = {
                    x: touch1.clientX,
                    y: touch1.clientY,
                };
                const p2 = {
                    x: touch2.clientX,
                    y: touch2.clientY,
                };

                if (!lastCenter) {
                    lastCenter = getCenter(p1, p2);
                    return;
                }
                const newCenter = getCenter(p1, p2);

                const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

                if (!lastDist) {
                    lastDist = dist;
                }

                // local coordinates of center point
                const pointTo = {
                    x: (newCenter.x - this.stage.x()) / this.stage.scaleX(),
                    y: (newCenter.y - this.stage.y()) / this.stage.scaleX(),
                };

                const scale = this.stage.scaleX() * (dist / lastDist);

                this.stage.scaleX(scale);
                this.stage.scaleY(scale);

                // calculate new position of the stage
                const dx = newCenter.x - lastCenter.x;
                const dy = newCenter.y - lastCenter.y;

                const newPos = {
                    x: newCenter.x - pointTo.x * scale + dx,
                    y: newCenter.y - pointTo.y * scale + dy,
                };

                this.stage.position(newPos);

                lastDist = dist;
                lastCenter = newCenter;
            }
        });

        this.stage.on('touchend', function() {
            lastDist = 0;
            lastCenter = null;
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

    public updateSettings(mapSettings: MapSettingsData): void {
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

    public updateDistances(): void {
        /*this.pointerLayer.getChildren(node =>
            node.getClassName() === 'Group' && node.id() === '')
        .forEach(distanceLine => distanceLine.destroy());
        const tokenGroups = this.pointerLayer.getChildren(node => node.getClassName() === 'Group' && node.id() !== '');

        if (!this.selectedTokenGroup) {
            return;
        }

        const posA = this.selectedTokenGroup.position();

        for (const tokenGroup of tokenGroups) {
            tokenGroup.zIndex(2);
            if (tokenGroup === this.selectedTokenGroup) {
                continue;
            }

            const lineGroup = DistanceDrawer.draw(posA, tokenGroup.position(), this.map.settings.pixelPerUnit);
            this.pointerLayer.add(lineGroup);
            lineGroup.zIndex(0);
        }*/
    }

    public updateLayer(layer: Konva.Layer, image: string, opacity: number = 1): void {
        if (opacity === undefined || opacity === null) {
            opacity = 1;
        }

        const htmlImage = new Image();

        fromEvent(htmlImage, 'load').pipe(first()).subscribe(_ => {
            layer.add(new Konva.Image({ image: htmlImage, opacity }));
        });

        htmlImage.src = image;
    }

    protected drawToken(token: TokenData): void {
        /*if (!this.inDmMode && token.hide) {
            return;
        }
        if (!token.position) {
            token.position = this.getVisibleCenter();
        }

        const tokenGroup = TokenDrawer.drawToken(token, this.map.settings.pixelPerUnit);
        if (!this.inDmMode) {
            const iconGroup: Konva.Group = tokenGroup.getChildren(node =>
                node.getClassName() === 'Group' && node.name() === 'icon')[0] as Konva.Group;
            iconGroup.hide();
        }
        this.pointerLayer.add(tokenGroup);*/
    }

    private fixTokenEvents(tokens: TokenData[]): void {
        /*this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions = [];
        const pointerChildren = this.pointerLayer.getChildren(node => node.getClassName() === 'Group' && node.id() !== '');

        for (const token of tokens) {
            const tokenGroup: Konva.Group = pointerChildren.find(tokenGroupEl => tokenGroupEl.id() === token.id) as Konva.Group;

            if (tokenGroup) {
                const coinGroup: Konva.Group = tokenGroup.getChildren(node =>
                    node.getClassName() === 'Group' && node.name() === 'coin'
                )[0] as Konva.Group;
                const iconGroup: Konva.Group = tokenGroup.getChildren(node =>
                    node.getClassName() === 'Group' && node.name() === 'icon'
                )[0] as Konva.Group;

                const visibilityIcon = iconGroup.getChildren(node =>
                    node.getClassName() === 'Path' && node.id() === 'visibilityIcon'
                )[0];
                const visibilityOffIcon = iconGroup.getChildren(node =>
                    node.getClassName() === 'Path' && node.id() === 'visibilityOffIcon'
                )[0];

                this.subscriptions.push(fromEvent(tokenGroup, 'dragend').subscribe(res => {
                    token.position = tokenGroup.position();
                    this.selectedToken = token;
                    this.selectedTokenGroup = tokenGroup as Konva.Group;
                    this.updateDistances();
                    this.tokensChanged.next(token);
                }));
                this.subscriptions.push(fromEvent(tokenGroup, 'dragmove').pipe(
                    throttleTime(1000 / 60)
                ).subscribe(res => {
                    token.position = tokenGroup.position();
                    this.selectedToken = token;
                    this.selectedTokenGroup = tokenGroup as Konva.Group;
                    this.updateDistances();
                    this.tokensChanged.next(token);
                }));
                this.subscriptions.push(fromEvent(coinGroup, 'click').subscribe(res => {
                    this.tokenSelected.next(token);
                    this.selectedToken = token;
                    this.selectedTokenGroup = tokenGroup as Konva.Group;
                    this.updateDistances();
                }));
                this.subscriptions.push(fromEvent(iconGroup, 'click').subscribe(event => {
                    event.preventDefault();
                    token.hide = !token.hide;
                    if (token.hide) {
                        visibilityIcon.opacity(0);
                        visibilityOffIcon.opacity(1);
                    } else {
                        visibilityIcon.opacity(1);
                        visibilityOffIcon.opacity(0);
                    }
                    this.selectedToken = token;
                    this.selectedTokenGroup = tokenGroup as Konva.Group;
                    this.updateDistances();
                    this.tokensChanged.next(token);
                }));
            }
        }*/
    }
}
