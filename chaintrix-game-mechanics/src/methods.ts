import { Card } from "./CustomTypes";

export const mod = (n: number, m: number): number => {
    return ((n % m) + m) % m;
}

export const flipParity = (n: number): number => {
    return (n + 1) % 2
}

export const getRandomCard = (): Card => {
    const someCardID = (Math.floor(Math.random() * (6 - 1 + 1)) + 1).toString();
    // const someCardID = "4"

    const someCard: Card = {
        cardID: someCardID,
        orientation: 0,
    }
    console.log(`wait what: ${JSON.stringify(someCard)}`)
    return someCard;
}

export const getRotatedCard = (card: Card, rotation: number): Card => {
    return {
        cardID: card.cardID,
        orientation: mod(rotation, 6)
    }
}

export const create2DArray = <T,>(defaultValue: T, height: number, width: number): Array<Array<T>> => {
    const arrayToReturn = []
    for (let i = 0; i < height; i++) {
        const subArray = []
        for (let j = 0; j < width; j++) {
            subArray.push(defaultValue)
        }
        arrayToReturn.push(subArray)
    }
    return arrayToReturn;
}