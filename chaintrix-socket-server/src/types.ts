
export type RoomGame = {
    players: Array<Player>,
    playerNPlaying: number,
    solanaAcceptedBetAccount: string
}

export type Player = {
    playerAddress: string,
    socketID: string,
    betPDA: string,
    clicks: number
}
