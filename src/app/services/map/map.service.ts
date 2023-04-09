import { Injectable } from '@angular/core';
import { MapData } from '../../interfaces/map-data';
import { WhiteBoard } from '../../helpers/white-board';
import { Token } from '../../canvas/token';
import { TokenData } from '../../interfaces/token-data';
import { Vector2d } from 'konva/lib/types';
import { Subject } from 'rxjs';
import { Distance } from '../../canvas/distance';
import { MapSettingsData } from '../../interfaces/map-settings-data';

@Injectable({
    providedIn: 'root'
})
export class MapService {
    public mapData: MapData;
    public tokens: Token[];
    public distances: Distance[];
    public whiteBoard: WhiteBoard;
    public inDmMode: boolean;

    public onTokenSelect: Subject<Token> = new Subject();
    public onTokenChange: Subject<Token> = new Subject();
    public onMapLoad: Subject<void> = new Subject();
    public selectedToken: Token;

    constructor() { }

    public setWhiteBoard(whiteBoard: WhiteBoard): void {
        this.whiteBoard = whiteBoard;
    }

    public setInDmMode(inDmMode: boolean): void {
        this.inDmMode = inDmMode;
        this.updateLayerVisibility();
    }

    public setSelectedToken(tokenData: TokenData): void {
        if (tokenData) {
            const token = this.tokens.find(token => token.tokenData.id === tokenData.id);
            if (token) {
                this.selectedToken = token;
            } else {
                this.selectedToken = null;
            }
        } else {
            this.selectedToken = null;
        }

        if (this.selectedToken) {
            this.distances.forEach(distance => {
                if (distance.tokens[0] == this.selectedToken || distance.tokens[1] == this.selectedToken) {
                    if (this.inDmMode || (!distance.tokens[0].tokenData.hide && !distance.tokens[1].tokenData.hide)) {
                        distance.lineGroup.show();
                    } else {
                        distance.lineGroup.hide();
                    }
                } else {
                    distance.lineGroup.hide();
                }
            });
        } else {
            this.distances.forEach(distance => distance.lineGroup.hide());
        }

        this.onTokenSelect.next(this.selectedToken);
    }

    public load(mapData: MapData): void {
        this.mapData = mapData;
        this.tokens = [];
        this.distances = [];

        this.whiteBoard.reset(true);
        this.whiteBoard.stage.absolutePosition({
            x: (window.innerWidth - this.mapData.settings.width) / 2,
            y: (window.innerHeight - this.mapData.settings.height) / 2
        });

        this.mapData.settings.tokens.forEach(tokenData => this.addToken(tokenData));

        this.draw();

        this.onMapLoad.next();
    }

    public draw(): void {
        this.updateScenarioMap();
        this.updateFogOfWar();
        this.updateMapWithFogOfWar();
        this.updateDmNotes();
        this.updatePlayerNotes();
        this.tokens.forEach(token => token.draw());
    }

    public update(mapSettingsData: MapSettingsData): void {
        const newTokenDatas = this.getNewTokenDatas(mapSettingsData.tokens);
        const tokensToDelete = this.getTokensToDelete(mapSettingsData.tokens);

        this.mapData.settings = mapSettingsData;

        newTokenDatas.forEach(tokenData => {
            console.log('new token');
            this.addToken(tokenData);
        });

        tokensToDelete.forEach(token => {
            this.removeToken(token.tokenData);
        });

        this.mapData.settings.tokens.forEach(tokenData => this.updateToken(tokenData));
        this.updateDistances();
    }

    public destroy(): void {
        this.tokens.forEach(token => token.destroy());
        this.whiteBoard.backLayer.destroyChildren();
        this.whiteBoard.mapLayer.destroyChildren();
        this.whiteBoard.fogOfWarLayer.destroyChildren();
        this.whiteBoard.mapWithFogOfWarLayer.destroyChildren();
        this.whiteBoard.dmNotesLayer.destroyChildren();
        this.whiteBoard.playerNotesLayer.destroyChildren();
        this.mapData = null;
    }

    public updateToken(tokenData: TokenData): void {
        const foundTokenIndes = this.tokens.findIndex(token => token.tokenData.id === tokenData.id);

        if (foundTokenIndes >= 0) {
            this.tokens[foundTokenIndes].tokenData = tokenData;
            this.tokens[foundTokenIndes].draw();
        }
    }

    public addTokenToMap(tokenData: TokenData): void {
        this.mapData.settings.tokens.push(tokenData);
        this.addToken(tokenData);
    }

    public removeTokenFromMap(tokenData: TokenData): void {
        const index = this.mapData.settings.tokens.findIndex(token => token.id === tokenData.id);

        if (index >= 0) {
            this.mapData.settings.tokens.splice(index, 1);
            this.removeToken(tokenData);
        }
    }

    public updateScenarioMap(): void {
        this.whiteBoard.updateLayer(this.whiteBoard.backLayer, this.mapData.scenarioMap);
        this.whiteBoard.updateLayer(this.whiteBoard.mapLayer, this.mapData.scenarioMap, 0.4);
    }

    public updateFogOfWar(): void {
        this.whiteBoard.updateLayer(this.whiteBoard.fogOfWarLayer, this.mapData.fogOfWar);
    }

    public updateMapWithFogOfWar(): void {
        this.whiteBoard.updateLayer(this.whiteBoard.mapWithFogOfWarLayer, this.mapData.mapWithFogOfWar);
    }

    public updateDmNotes(): void {
        this.whiteBoard.updateLayer(this.whiteBoard.dmNotesLayer, this.mapData.dmNotes);
    }

    public updatePlayerNotes(): void {
        this.whiteBoard.updateLayer(this.whiteBoard.playerNotesLayer, this.mapData.playerNotes);
    } public getScenarioMapDataURL(): string {
        const pos = this.whiteBoard.stage.getPosition();
        const scale = this.whiteBoard.stage.scale() as Vector2d;
        const rec = {
            x: pos.x,
            y: pos.y,
            width: this.mapData.settings.width * scale.x,
            height: this.mapData.settings.height * scale.y,
            pixelRatio: 1 / scale.y
        };
        return this.whiteBoard.backLayer.toDataURL(rec);
    }

    public getFogOfWarDataURL(): string {
        const pos = this.whiteBoard.stage.getPosition();
        const scale = this.whiteBoard.stage.scale() as Vector2d;
        const rec = {
            x: pos.x,
            y: pos.y,
            width: Math.ceil(this.mapData.settings.width * scale.x),
            height: Math.ceil(this.mapData.settings.height * scale.y),
            pixelRatio: 1 / scale.y
        };
        return this.whiteBoard.fogOfWarLayer.toDataURL(rec);
    }

    public getDmNotesDataURL(): string {
        const pos = this.whiteBoard.stage.getPosition();
        const scale = this.whiteBoard.stage.scale() as Vector2d;
        const rec = {
            x: 0,
            y: 0,
            width: 0 * scale.x,
            height: 0 * scale.y,
            pixelRatio: 1 / scale.y
        };
        return this.whiteBoard.dmNotesLayer.toDataURL(rec);
    }

    public getPlayerNotesDataURL(): string {
        const pos = this.whiteBoard.stage.getPosition();
        const scale = this.whiteBoard.stage.scale() as Vector2d;
        const rec = {
            x: 0,
            y: 0,
            width: 0 * scale.x,
            height: 0 * scale.y,
            pixelRatio: 1 / scale.y
        };
        return this.whiteBoard.playerNotesLayer.toDataURL(rec);
    }

    private updateDistances(): void {
        this.distances.forEach(distance => {
            const tokenA = this.tokens.find(token => token.tokenData.id === distance.tokens[0].tokenData.id);
            const tokenB = this.tokens.find(token => token.tokenData.id === distance.tokens[1].tokenData.id);

            if (tokenA && tokenB) {
                distance.tokens = [tokenA, tokenB];
            }

            distance.draw();

            if (distance.tokens[0] == this.selectedToken || distance.tokens[1] == this.selectedToken) {
                if (this.inDmMode || (!distance.tokens[0].tokenData.hide && !distance.tokens[1].tokenData.hide)) {
                    distance.lineGroup.show();
                } else {
                    distance.lineGroup.hide();
                }
            } else {
                distance.lineGroup.hide();
            }
        });
    }

    private updateLayerVisibility(): void {
        if (this.inDmMode) {
            this.whiteBoard.mapWithFogOfWarLayer.hide();
            this.whiteBoard.backLayer.show();
            this.whiteBoard.fogOfWarLayer.show();
            this.whiteBoard.mapLayer.show();
            this.whiteBoard.dmNotesLayer.show();
        } else {
            this.whiteBoard.mapWithFogOfWarLayer.show();
            this.whiteBoard.backLayer.hide();
            this.whiteBoard.fogOfWarLayer.hide();
            this.whiteBoard.mapLayer.hide();
            this.whiteBoard.dmNotesLayer.hide();
        }
    }

    private getNewTokenDatas(tokenDatas: TokenData[]): TokenData[] {
        const newTokenData: TokenData[] = [];

        for (const tokenData of tokenDatas) {
            const foundToken = this.tokens.find(token => token.tokenData.id === tokenData.id);

            if (!foundToken) {
                newTokenData.push(tokenData);
            }
        }

        return newTokenData;
    }

    private getTokensToDelete(tokenDatas: TokenData[]): Token[] {
        const tokensToDelete: Token[] = [];

        for (const token of this.tokens) {
            const foundTokenData = tokenDatas.find(tokenData => tokenData.id === token.tokenData.id);

            if (!foundTokenData) {
                tokensToDelete.push(token);
            }
        }

        return tokensToDelete;
    }

    private addToken(tokenData: TokenData): void {
        const newToken = new Token(tokenData, this.mapData.settings.pixelPerUnit, this.whiteBoard, this.inDmMode);
        newToken.onTokenChange.subscribe(token => {
            this.onTokenChange.next(token);
            this.updateDistances();
        });
        newToken.onTokenSelect.subscribe(token => this.setSelectedToken(token.tokenData));
        newToken.draw();
        this.tokens.forEach(token => {
            const distance = new Distance([newToken, token], this.mapData.settings.pixelPerUnit, this.whiteBoard, this.inDmMode);
            this.distances.push(distance);
            this.updateDistances();
        });
        this.tokens.push(newToken);
    }

    private removeToken(tokenData: TokenData): void {
        const foundTokenIndes = this.tokens.findIndex(token => token.tokenData.id === tokenData.id);

        if (foundTokenIndes >= 0) {
            this.tokens[foundTokenIndes].destroy();
            this.tokens.splice(foundTokenIndes, 1);

            const distancesToKeep: Distance[] = [];

            this.distances.forEach(distance => {
                if (distance.tokens[0].tokenData.id === tokenData.id || distance.tokens[1].tokenData.id === tokenData.id) {
                    distance.destroy();
                } else {
                    distancesToKeep.push(distance);
                }
            });

            this.distances = distancesToKeep;
        }
    }
}
