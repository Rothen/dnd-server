import { Vector2d } from 'konva/lib/types';
import { TokenData } from '../interfaces/token-data';
import Konva from 'konva';
import { WhiteBoard } from '../helpers/white-board';
import { Subscription, fromEvent, throttleTime, Subject } from 'rxjs';

interface Size {
    width: number;
    height: number;
    scale: number;
}

export class Token {
    /*eslint max-len: ["error", { "code": 800 }]*/
    public static visibility = 'M480.118 726Q551 726 600.5 676.382q49.5-49.617 49.5-120.5Q650 485 600.382 435.5q-49.617-49.5-120.5-49.5Q409 386 359.5 435.618q-49.5 49.617-49.5 120.5Q310 627 359.618 676.5q49.617 49.5 120.5 49.5Zm-.353-58Q433 668 400.5 635.265q-32.5-32.736-32.5-79.5Q368 509 400.735 476.5q32.736-32.5 79.5-32.5Q527 444 559.5 476.735q32.5 32.736 32.5 79.5Q592 603 559.265 635.5q-32.736 32.5-79.5 32.5ZM480 856q-146 0-264-83T40 556q58-134 176-217t264-83q146 0 264 83t176 217q-58 134-176 217t-264 83Z';
    public static visibilityOff = 'M816 992 648 827q-35 14-79 21.5t-89 7.5q-146 0-265-81.5T40 556q20-52 55.5-101.5T182 360L56 234l42-43 757 757-39 44ZM480 726q14 0 30-2.5t27-7.5L320 499q-5 12-7.5 27t-2.5 30q0 72 50 121t120 49Zm278 40L629 637q10-16 15.5-37.5T650 556q0-71-49.5-120.5T480 386q-22 0-43 5t-38 16L289 296q35-16 89.5-28T485 256q143 0 261.5 81.5T920 556q-26 64-67 117t-95 93ZM585 593 443 451q29-11 60-4.5t54 28.5q23 23 32 51.5t-4 66.5Z';

    public tokenData: TokenData;
    public pixelPerUnit: number;
    public whiteBoard: WhiteBoard;
    public inDmMode: boolean;
    public onTokenSelect: Subject<Token> = new Subject();
    public onTokenChange: Subject<Token> = new Subject();

    private tokenName: Konva.Text;
    private coinGroup: Konva.Group;
    private iconGroup: Konva.Group;
    private visibilityIcon: Konva.Path;
    private visibilityOffIcon: Konva.Path;
    private tokenGroup: Konva.Group;
    private tokenChip = new Konva.Circle();

    private isDrawen = false;

    private dragEndSubscription: Subscription;
    private dragMoveSubscription: Subscription;
    private coinGroupClickSubscription: Subscription;
    private iconGroupSubscription: Subscription;

    constructor(tokenData: TokenData, pixelPerUnit: number, whiteBoard: WhiteBoard, inDmMode: boolean) {
        this.tokenData = tokenData;
        this.pixelPerUnit = pixelPerUnit;
        this.whiteBoard = whiteBoard;
        this.inDmMode = inDmMode;
    }

    public destroy(): void {
        this.removeEventListeners();
        this.tokenGroup.destroy();
        this.onTokenSelect.complete();
        this.onTokenChange.complete();
    }

    public draw(): void {
        if (!this.isDrawen) {
            this.createDrawing();
            this.isDrawen = true;
        }
        this.updateDrawing();
    }

    public getPosition(): Vector2d {
        return this.tokenGroup.position();
    }

    private createDrawing(): void {
        const scale: Vector2d = { x: 1, y: 1 };
        const { size, fontSize } = this.calculateSize(this.tokenData, this.pixelPerUnit);
        const color = this.getColor(this.tokenData);

        this.createCoinGroup(this.tokenData, scale, size, fontSize, color);
        this.createIconGroup(this.tokenData, scale, size);

        if (!this.tokenData.position) {
            this.tokenData.position = this.whiteBoard.getVisibleCenter();
        }

        this.tokenGroup = new Konva.Group({
            width: size.width,
            height: size.height,
            draggable: true,
            x: this.tokenData.position.x,
            y: this.tokenData.position.y,
            scale,
            id: this.tokenData.id
        });

        this.tokenGroup.add(this.coinGroup);
        this.tokenGroup.add(this.iconGroup);

        this.whiteBoard.pointerLayer.add(this.tokenGroup);
        this.addEventListeners();
    }

    private updateDrawing(): void {
        const scale: Vector2d = { x: 1, y: 1 };
        const { size, fontSize } = this.calculateSize(this.tokenData, this.pixelPerUnit);
        const color = this.getColor(this.tokenData);

        if (this.inDmMode) {
            if (this.tokenData.hide) {
                this.visibilityIcon.opacity(0);
                this.visibilityOffIcon.opacity(1);
            } else {
                this.visibilityIcon.opacity(1);
                this.visibilityOffIcon.opacity(0);
            }
        } else {
            if (this.tokenData.hide) {
                this.tokenGroup.hide();
            } else {
                this.tokenGroup.show();
            }
            this.visibilityIcon.opacity(0);
            this.visibilityOffIcon.opacity(0);
        }

        this.tokenGroup.scale(scale);
        this.coinGroup.scale(scale);
        this.tokenChip.fill(color);
        this.tokenChip.width(size.width);
        this.tokenChip.height(size.height);
        this.tokenName.width(size.width);
        this.tokenName.height(size.height);
        this.tokenGroup.width(size.width);
        this.tokenGroup.height(size.height);
        this.tokenName.fontSize(fontSize);
        this.tokenName.offsetX(size.width / 2);
        this.tokenName.offsetY(size.height / 2);
        this.tokenName.text(this.tokenData.name.charAt(0));
        this.tokenGroup.x(this.tokenData.position.x);
        this.tokenGroup.y(this.tokenData.position.y);
        this.iconGroup.width(size.width);
        this.iconGroup.height(size.height);
        this.iconGroup.scale(scale);
        this.visibilityIcon.x(-this.visibilityIcon.getClientRect().width / 2);
        this.visibilityIcon.y(-size.height / 2 - 12 * 3);
        this.visibilityOffIcon.x(-this.visibilityOffIcon.getClientRect().width / 2);
        this.visibilityOffIcon.y(-size.height / 2 - 12 * 3);
    }

    private addEventListeners(): void {
        this.dragEndSubscription = fromEvent(this.tokenGroup, 'dragend').subscribe(res => {
            this.tokenData.position = this.tokenGroup.position();
            this.onTokenSelect.next(this);
            this.onTokenChange.next(this);
        });
        this.dragMoveSubscription = fromEvent(this.tokenGroup, 'dragmove').pipe(
            throttleTime(1000 / 60)
        ).subscribe(res => {
            this.tokenData.position = this.tokenGroup.position();
            this.onTokenSelect.next(this);
            this.onTokenChange.next(this);
        });
        this.coinGroupClickSubscription = fromEvent(this.coinGroup, 'click').subscribe(res => {
            this.onTokenSelect.next(this);
        });
        this.iconGroupSubscription = fromEvent(this.iconGroup, 'click').subscribe(event => {
            this.tokenData.hide = !this.tokenData.hide;
            if (this.tokenData.hide) {
                this.visibilityIcon.opacity(0);
                this.visibilityOffIcon.opacity(1);
            } else {
                this.visibilityIcon.opacity(1);
                this.visibilityOffIcon.opacity(0);
            }

            this.onTokenSelect.next(this);
            this.onTokenChange.next(this);
        });
    }

    private removeEventListeners(): void {
        if (this.dragEndSubscription) {
            this.dragEndSubscription.unsubscribe();
        }
        if (this.dragMoveSubscription) {
            this.dragMoveSubscription.unsubscribe();
        }
        if (this.coinGroupClickSubscription) {
            this.coinGroupClickSubscription.unsubscribe();
        }
        if (this.iconGroupSubscription) {
            this.iconGroupSubscription.unsubscribe();
        }
    }

    private createCoinGroup(token: TokenData, scale: Vector2d, size: Size, fontSize: number, color: string): void {
        this.coinGroup = new Konva.Group({
            width: size.width,
            height: size.height,
            listening: true,
            scale,
            name: 'coin'
        });
        this.tokenChip = new Konva.Circle({
            fill: color,
            width: size.width,
            height: size.height,
            stroke: 'black'
        });
        this.tokenName = new Konva.Text({
            fontStyle: 'bold',
            text: token.name.charAt(0),
            fontSize,
            verticalAlign: 'middle',
            align: 'center',
            width: size.width,
            height: size.height,
            offsetX: size.width / 2,
            offsetY: size.height / 2
        });

        this.coinGroup.add(this.tokenChip);
        this.coinGroup.add(this.tokenName);
    }

    private createIconGroup(token: TokenData, scale: Vector2d, size: Size): void {
        this.iconGroup = new Konva.Group({
            width: size.width,
            height: size.height,
            listening: true,
            scale,
            name: 'icon'
        });

        const iconsScale = 3;
        this.visibilityIcon = new Konva.Path({
            data: Token.visibility,
            fill: 'white',
            scaleX: 0.01 * iconsScale,
            scaleY: 0.01 * iconsScale,
            stroke: 'black',
            strokeWidth: 100,
            fillAfterStrokeEnabled: true,
            x: 0,
            y: 0,
            id: 'visibilityIcon',
            listening: true,
            opacity: token.hide ? 0 : 1
        });

        this.visibilityOffIcon = new Konva.Path({
            data: Token.visibilityOff,
            fill: 'white',
            scaleX: 0.01 * iconsScale,
            scaleY: 0.01 * iconsScale,
            stroke: 'black',
            strokeWidth: 100,
            fillAfterStrokeEnabled: true,
            x: 0,
            y: 0,
            id: 'visibilityOffIcon',
            listening: true,
            opacity: token.hide ? 1 : 0
        });

        this.visibilityIcon.x(-this.visibilityIcon.getClientRect().width / 2);
        this.visibilityIcon.y(-size.height / 2 - 12 * iconsScale);
        this.iconGroup.add(this.visibilityIcon);

        this.visibilityOffIcon.x(-this.visibilityOffIcon.getClientRect().width / 2);
        this.visibilityOffIcon.y(-size.height / 2 - 12 * iconsScale);
        this.iconGroup.add(this.visibilityOffIcon);
    }

    private calculateSize(token: TokenData, pixelPerUnit: number): { size: { width: number; height: number; scale: number }; fontSize: number } {
        const size = {
            width: pixelPerUnit,
            height: pixelPerUnit,
            scale: 1
        };
        let fontSize = pixelPerUnit * 0.7;

        switch (token.size) {
            case 'tiny':
                size.width *= 0.5;
                size.height *= 0.5;
                size.scale = 0.5;
                fontSize *= 0.5;
                break;
            case 'small':
                size.width *= 1;
                size.height *= 1;
                size.scale = 1;
                fontSize *= 1;
                break;
            case 'medium':
                size.width *= 1;
                size.height *= 1;
                size.scale = 1;
                fontSize *= 1;
                break;
            case 'large':
                size.width *= 2;
                size.height *= 2;
                size.scale = 2;
                fontSize *= 2;
                break;
            case 'huge':
                size.width *= 3;
                size.height *= 3;
                size.scale = 3;
                fontSize *= 3;
                break;
            case 'gargantuan':
                size.width *= 4;
                size.height *= 4;
                size.scale = 4;
                fontSize *= 4;
                break;
        }

        return { size, fontSize };
    }

    private getColor(token: TokenData): string {
        let color = 'green';

        if (token.type === 'npc') {
            color = 'bisque';
        } else if (token.type === 'enemy') {
            color = 'red';
        }

        return color;
    }
}
