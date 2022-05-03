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
    orientation: number
}

export type MoveInfo = {
    card: Card,
    x: number,
    y: number
}

export type CardNullable = null | Card;

export type HexPosition = {
    xyPosition: Coords,
    ijPosition: Coords
}

export enum BoardFieldType {
    CARD = 'Card',
    UNREACHABLE = 'Unreachable',
    OBLIGATORY = 'Obligatory',
    GUARDED = 'Guarded',
    FREE = 'Free'
}