import { Injectable } from '@angular/core';
import { Subject, Subscription, from, fromEvent } from 'rxjs';
import Konva from 'konva';
import { Vector2d } from 'konva/lib/types';
import { HasEventTargetAddRemove } from 'rxjs/internal/observable/fromEvent';
import { MenuItem } from '../../interfaces/menu-item';
import { Drawer } from '../../helpers/drawer';

@Injectable({
    providedIn: 'root'
})
export class DrawService {
    public globalCompositeOperation: 'source-over' | 'destination-out' = 'source-over';

    private eventElement: HasEventTargetAddRemove<MouseEvent> | ArrayLike<HasEventTargetAddRemove<MouseEvent>>;
    private stage: Konva.Stage;
    private layer: Konva.Layer;
    private copySize: Vector2d;

    private colour = {
        r: 130,
        g: 130,
        b: 130
    };
    private strokeWidth = 50;
    private BUTTON = 0b01;
    private latestPoint: number[];
    private drawing = false;

    private mousedownSubscription: Subscription;
    private mouseupSubscription: Subscription;
    private mouseoutSubscription: Subscription;
    private mouseenterSubscription: Subscription;
    private mousemoveSubscription: Subscription;
    public strokeEndSubject: Subject<void> = new Subject();

    constructor() { }

    public setCanvas(eventElement: HasEventTargetAddRemove<MouseEvent> | ArrayLike<HasEventTargetAddRemove<MouseEvent>>, stage: Konva.Stage, layer: Konva.Layer, copySize: Vector2d): Subject<void> {
        this.eventElement = eventElement;
        this.stage = stage;
        this.layer = layer;
        this.copySize = copySize;

        this.unsubscribe();

        this.mousedownSubscription = fromEvent(this.eventElement, 'mousedown').subscribe(event => this.mouseDown(event));
        this.mouseupSubscription = fromEvent(this.eventElement, 'mouseup').subscribe(event => this.endStroke(event));
        this.mouseoutSubscription = fromEvent(this.eventElement, 'mouseout').subscribe(event => this.endStroke(event));
        this.mouseenterSubscription = fromEvent(this.eventElement, 'mouseenter').subscribe(event => this.mouseEnter(event));
        this.mousemoveSubscription = fromEvent(this.eventElement, 'mousemove').subscribe(event => this.mouseMove(event));

        return this.strokeEndSubject;
    }

    public setPaintMode(paintMode: Drawer): void {
        this.globalCompositeOperation = (paintMode.id === 'paint_fog') ? 'source-over' : 'destination-out';
    }

    public setPenSize(penSize: MenuItem): void {
        switch (penSize.id) {
            case 'small':
                this.strokeWidth = 5;
                break;
            case 'medium':
                this.strokeWidth = 25;
                break;
            case 'large':
                this.strokeWidth = 50;
                break;
            case 'huge':
                this.strokeWidth = 100;
                break;
        }
    }

    private unsubscribe(): void {
        if (this.mousedownSubscription) this.mousedownSubscription.unsubscribe();
        if (this.mouseupSubscription) this.mouseupSubscription.unsubscribe();
        if (this.mouseoutSubscription) this.mouseoutSubscription.unsubscribe();
        if (this.mouseenterSubscription) this.mouseenterSubscription.unsubscribe();
        if (this.mousemoveSubscription) this.mousemoveSubscription.unsubscribe();
    }

    private continueStroke(newPoint: number[]) {
        let stroke: Konva.Path = new Konva.Path({
            data: `M${this.latestPoint[0]} ${this.latestPoint[1]} ${newPoint[0]} ${newPoint[1]}`,
            lineCap: 'round',
            stroke: `rgb(${this.colour.r}, ${this.colour.g}, ${this.colour.b})`,
            strokeWidth: this.strokeWidth,
            lineJoin: 'round',
            globalCompositeOperation: this.globalCompositeOperation
        });
        this.layer.add(stroke);
        this.latestPoint = newPoint;
    }

    private startStroke(point: number[]) {
        this.drawing = true;
        this.latestPoint = point;
    }

    private mouseMove(evt: MouseEvent) {
        if (!this.drawing) {
            return;
        }
        const pointer = this.stage.getRelativePointerPosition();
        this.continueStroke([pointer.x, pointer.y]);
    }

    private mouseDown(evt: MouseEvent) {
        if (evt.button != 0) {
            return;
        }
        if (this.drawing) {
            return;
        }
        evt.preventDefault();
        const pointer = this.stage.getRelativePointerPosition();
        this.startStroke([pointer.x, pointer.y]);
    }

    private mouseEnter(evt: MouseEvent) {
        if (!((this.BUTTON & evt.buttons) === this.BUTTON) || this.drawing) {
            return;
        }
        this.mouseDown(evt);
    }

    private endStroke(evt: MouseEvent) {
        if (!this.drawing) {
            return;
        }
        this.drawing = false;

        const position = this.stage.getPosition();
        const scale = this.stage.scale() as Vector2d;
        const rec = { x: position.x, y: position.y, width: this.copySize.x * scale.x, height: this.copySize.y * scale.y, pixelRatio: 1 / scale.x };

        from(this.layer.toImage(rec)).subscribe(res => {
            this.layer.destroyChildren();
            this.layer.add(new Konva.Image({ image: res as any }));
            this.strokeEndSubject.next();
        });
    }
}
