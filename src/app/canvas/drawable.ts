export interface Drawable<T> {
    draw(): void;
    update(data: T): void;
    destroy(): void;
}