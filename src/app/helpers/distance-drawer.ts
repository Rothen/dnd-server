import Konva from 'konva';
import { Vector2d } from 'konva/lib/types';

export class DistanceDrawer {
    public static draw(from: Vector2d, to: Vector2d, pixelPerUnit: number): Konva.Group {
        const left = (from.x < to.x) ? from : to;
        const right = (from.x >= to.x) ? from : to;
        const dist = Math.sqrt(Math.pow(from.x - to.x, 2) + Math.pow(from.y - to.y, 2));
        const distInFeet = dist / pixelPerUnit * 5;
        const distInMeter = distInFeet * 0.3048;
        const height = 40;
        const fontSize = 16;
        const textOffset = 5;

        const lineGroup = new Konva.Group({
            x: left.x,
            y: left.y - height / 2,
            width: dist,
            height
        });
        lineGroup.add(new Konva.Line({
            points: [0, height / 2, dist, height / 2],
            stroke: 'black'
        }));
        lineGroup.add(new Konva.Text({
            fontStyle: 'bold',
            text: `${distInMeter.toFixed(2)}m`,
            fontSize,
            align: 'center',
            width: dist,
            height,
            offsetY: textOffset - 6,
            fillAfterStrokeEnabled: true,
            stroke: 'black',
            fill: 'white'
        }));
        lineGroup.add(new Konva.Text({
            fontStyle: 'bold',
            text: `${distInFeet.toFixed(2)}ft`,
            fontSize,
            verticalAlign: 'middle',
            align: 'center',
            width: dist,
            height,
            offsetY: -textOffset - 8,
            fillAfterStrokeEnabled: true,
            stroke: 'black',
            fill: 'white'
        }));

        this.rotateAroundPoint(lineGroup, this.getRotation(left, right, dist), left);

        return lineGroup;
    }

    private static getRotation(left: Vector2d, right: Vector2d, dist: number): number {
        let rotation = 0;

        if (left.y > right.y) {
            const G = (right.y - left.y);
            rotation = Math.asin(G / dist) * 180 / Math.PI;
        } else {
            const G = (left.y - right.y);
            rotation = -Math.asin(G / dist) * 180 / Math.PI;
        }

        return rotation;
    }

    private static rotateAroundPoint(shape: Konva.Group, angleDegrees: number, point: Vector2d) {
        // sin + cos require radians
        const angleRadians = angleDegrees * Math.PI / 180;

        const x =
            point.x +
            (shape.x() - point.x) * Math.cos(angleRadians) -
            (shape.y() - point.y) * Math.sin(angleRadians);
        const y =
            point.y +
            (shape.x() - point.x) * Math.sin(angleRadians) +
            (shape.y() - point.y) * Math.cos(angleRadians);

        // move the rotated shape in relation to the rotation point.
        shape.position({ x, y });

        // rotate the shape in place around its natural rotation point
        shape.rotation(shape.rotation() + angleDegrees);
    }
}
