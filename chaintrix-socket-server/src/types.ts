
export type RoomGame = {
    players: Array<Player>,
    playerNPlaying: number,
}

export type Player = {
    socketID: string,
    betPDA: string,
    clicks: number
}