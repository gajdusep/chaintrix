import { Socket } from "socket.io";
import { GameRoom } from "./types";

export type RoomObjects = { [key: string]: GameRoom }

export const getGameRoomID = (socket: Socket): string | null => {
    if (socket.rooms.size != 2) return null
    let answer = null
    socket.rooms.forEach(item => {
        if (item != socket.id) { answer = item };
    })
    return answer;
}

export const getNewTimer = (room: GameRoom, callback: any) => {
    const timer = setInterval(() => {
        room.remainingTime = room.remainingTime - 1
        if (room.remainingTime <= 0) {
            clearInterval(timer)
            callback()
        }
    }, 1000);

    return timer;
}
