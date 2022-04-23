export type Coords = {
    x: number,
    y: number
}

export enum PathColor {
    Red = 'R',
    Green = 'G',
    Blue = 'B',
    Yellow = 'Y'
}

export type Card = {
    cardID: string,
    orientation: number,
    pattern: string, // should be string or some better structure?
}

export type CardNullable = null | Card;

export type HexPosition = {
    xyPosition: Coords,
    ijPosition: Coords
}
