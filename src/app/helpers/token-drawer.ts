import Konva from 'konva';
import { Token } from '../interfaces/token';
import { Vector2d } from 'konva/lib/types';

export class TokenDrawer {
    public static visibility = 'M480.118 726Q551 726 600.5 676.382q49.5-49.617 49.5-120.5Q650 485 600.382 435.5q-49.617-49.5-120.5-49.5Q409 386 359.5 435.618q-49.5 49.617-49.5 120.5Q310 627 359.618 676.5q49.617 49.5 120.5 49.5Zm-.353-58Q433 668 400.5 635.265q-32.5-32.736-32.5-79.5Q368 509 400.735 476.5q32.736-32.5 79.5-32.5Q527 444 559.5 476.735q32.5 32.736 32.5 79.5Q592 603 559.265 635.5q-32.736 32.5-79.5 32.5ZM480 856q-146 0-264-83T40 556q58-134 176-217t264-83q146 0 264 83t176 217q-58 134-176 217t-264 83Z';
    public static visibilityOff = 'M816 992 648 827q-35 14-79 21.5t-89 7.5q-146 0-265-81.5T40 556q20-52 55.5-101.5T182 360L56 234l42-43 757 757-39 44ZM480 726q14 0 30-2.5t27-7.5L320 499q-5 12-7.5 27t-2.5 30q0 72 50 121t120 49Zm278 40L629 637q10-16 15.5-37.5T650 556q0-71-49.5-120.5T480 386q-22 0-43 5t-38 16L289 296q35-16 89.5-28T485 256q143 0 261.5 81.5T920 556q-26 64-67 117t-95 93ZM585 593 443 451q29-11 60-4.5t54 28.5q23 23 32 51.5t-4 66.5Z';
    
    static drawToken(token: Token, pixelPerUnit: number): Konva.Group {
        const scale: Vector2d = { x: 1, y: 1 };
        const { size, fontSize } = this.calculateSize(token, pixelPerUnit);
        const color = this.getColor(token);
        const visibilityPath = (token.hide) ? this.visibilityOff : this.visibility;

        const coinGroup = this.createCoinGroup(token, scale, size, fontSize, color);
        const iconGroup = this.createIconGroup(token, scale, size);

        const overallGroup = new Konva.Group({
            width: size.width,
            height: size.height,
            draggable: true,
            x: token.position.x,
            y: token.position.y,
            scale,
            id: token.id
        });

        overallGroup.add(coinGroup);
        overallGroup.add(iconGroup);

        return overallGroup;
    }

    private static createCoinGroup(token: Token, scale: Vector2d, size: { width: number; height: number; scale: number }, fontSize: number, color: string): Konva.Group {
        const coinGroup = new Konva.Group({
            width: size.width,
            height: size.height,
            listening: true,
            scale,
            name: 'coin'
        });

        coinGroup.add(new Konva.Circle({
            fill: color,
            width: size.width,
            height: size.height,
            stroke: 'black'
        }));

        coinGroup.add(new Konva.Text({
            fontStyle: 'bold',
            text: token.name.charAt(0),
            fontSize,
            verticalAlign: 'middle',
            align: 'center',
            width: size.width,
            height: size.height,
            offsetX: size.width / 2,
            offsetY: size.height / 2
        }));

        return coinGroup;
    }

    private static createIconGroup(token: Token, scale: Vector2d, size: { width: number; height: number; scale: number }): Konva.Group {
        const iconGroup = new Konva.Group({
            width: size.width,
            height: size.height,
            listening: true,
            scale,
            name: 'icon'
        });

        const iconsScale = 3;
        const visibilityIcon = new Konva.Path({
            data: this.visibility,
            fill: 'white',
            scaleX: 0.01 * iconsScale,
            scaleY: 0.01 * iconsScale,
            stroke: 'black',
            strokeWidth: 100,
            fillAfterStrokeEnabled: true,
            x: 0,
            y: 0,
            id: 'visibilityIcon',
            listening: true
        });

        const visibilityOffIcon = new Konva.Path({
            data: this.visibilityOff,
            fill: 'white',
            scaleX: 0.01 * iconsScale,
            scaleY: 0.01 * iconsScale,
            stroke: 'black',
            strokeWidth: 100,
            fillAfterStrokeEnabled: true,
            x: 0,
            y: 0,
            id: 'visibilityOffIcon',
            listening: true
        });

        visibilityIcon.x(-visibilityIcon.getClientRect().width / 2);
        visibilityIcon.y(-size.height / 2 - 12 * iconsScale)
        iconGroup.add(visibilityIcon);

        visibilityOffIcon.x(-visibilityOffIcon.getClientRect().width / 2);
        visibilityOffIcon.y(-size.height / 2 - 12 * iconsScale)
        iconGroup.add(visibilityOffIcon);
        
        return iconGroup;
    }

    private static calculateSize(token: Token, pixelPerUnit: number): { size: { width: number; height: number; scale: number }; fontSize: number} {
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

    private static getColor(token: Token): string {
        let color = 'green';

        if (token.type === 'npc') {
            color = 'bisque';
        } else if (token.type === 'enemy') {
            color = 'red';
        }

        return color;
    }
}
