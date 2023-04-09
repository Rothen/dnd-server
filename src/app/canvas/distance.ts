import Konva from "konva";
import { Vector2d } from "konva/lib/types";
import { Token } from "./token";
import { WhiteBoard } from "../helpers/white-board";

export class Distance {
    public tokens: Token[];
    public pixelPerUnit: number;
    public whiteBoard: WhiteBoard;
    public inDmMode: boolean;
    
    private isDrawen: boolean = false;
    public lineGroup: Konva.Group;
    private distanceLine: Konva.Line;
    private distanceTextM: Konva.Text;
    private distanceTextFt: Konva.Text;

    constructor(tokens: Token[], pixelPerUnit: number, whiteBoard: WhiteBoard, inDmMode: boolean) {
        this.tokens = tokens;
        this.pixelPerUnit = pixelPerUnit;
        this.whiteBoard = whiteBoard;
        this.inDmMode = inDmMode;
    }

    public draw(): void {
        const dist = Math.sqrt(Math.pow(this.tokens[0].getPosition().x - this.tokens[1].getPosition().x, 2) + Math.pow(this.tokens[0].getPosition().y - this.tokens[1].getPosition().y, 2));
        const left = (this.tokens[0].getPosition().x < this.tokens[1].getPosition().x) ? this.tokens[0].getPosition() : this.tokens[1].getPosition();
        const right = (this.tokens[0].getPosition().x >= this.tokens[1].getPosition().x) ? this.tokens[0].getPosition() : this.tokens[1].getPosition();
        const height = 40;

        if (!this.isDrawen) {
            this.createDrawing(left, right, dist, height);
            this.isDrawen = true;
        }

        this.updateDrawing(left, right, dist, height);
    }

    private updateDrawing(left: Vector2d, right: Vector2d, dist: number, height: number): void {
        const distInFeet = dist / this.pixelPerUnit * 5;
        const distInMeter = distInFeet * 0.3048;

        /*if (this.inDmMode || (!this.tokens[0].tokenData.hide && !this.tokens[1].tokenData.hide)) {
            this.lineGroup.show();
        } else {
            this.lineGroup.hide();
        }*/

        this.lineGroup.x(left.x);
        this.lineGroup.y(left.y - height / 2);
        this.lineGroup.width(dist);

        this.distanceLine.points([0, height / 2, dist, height / 2]);

        this.distanceTextM.text(`${distInMeter.toFixed(2)}m`);
        this.distanceTextM.width(dist);
        this.distanceTextFt.text(`${distInFeet.toFixed(2)}ft`);
        this.distanceTextFt.width(dist);

        this.rotateAroundPoint(this.lineGroup, this.getRotation(left, right, dist), left);
    }

    private createDrawing(left: Vector2d, right: Vector2d, dist: number, height: number): void {
        const distInFeet = dist / this.pixelPerUnit * 5;
        const distInMeter = distInFeet * 0.3048;
        const fontSize = 16;
        const textOffset = 5;

        this.lineGroup = new Konva.Group({
            x: left.x,
            y: left.y - height / 2,
            width: dist,
            height
        });
        this.lineGroup.hide();

        this.distanceLine = new Konva.Line({
            points: [0, height / 2, dist, height / 2],
            stroke: 'black'
        });

        this.distanceTextM = new Konva.Text({
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
        });

        this.distanceTextFt = new Konva.Text({
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
        });

        this.lineGroup.add(this.distanceLine);
        this.lineGroup.add(this.distanceTextM);
        this.lineGroup.add(this.distanceTextFt);

        this.whiteBoard.pointerLayer.add(this.lineGroup);
        this.lineGroup.zIndex(0);
    }

    private getRotation(left: Vector2d, right: Vector2d, dist: number): number {
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

    private rotateAroundPoint(shape: Konva.Group, angleDegrees: number, point: Vector2d) {
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
        shape.rotation(angleDegrees);
    }
}