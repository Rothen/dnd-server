import Konva from 'konva';
import { Token } from '../interfaces/token';
import { Vector2d } from 'konva/lib/types';

export class TokenDrawer {
    static drawToken(token: Token, pixelPerUnit: number): Konva.Group {
        const scale: Vector2d = { x: 1, y: 1 };
        const { size, fontSize } = this.calculateSize(token, pixelPerUnit);
        const color = this.getColor(token);
        const opacity = (token.hide) ? 0.7 : 1;

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

        return tokenGroup;
    }

    private static calculateSize(token: Token, pixelPerUnit: number): { size: { width: number; height: number }; fontSize: number} {
        const size = {
            width: pixelPerUnit,
            height: pixelPerUnit
        };
        let fontSize = pixelPerUnit * 0.7;

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
