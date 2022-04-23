import { AccountId, PrivateKey, Client, Hbar } from "@hashgraph/sdk";

require("dotenv").config();

export type Config = {
    serverId: AccountId,
    serverPrivateKey: PrivateKey,
    serverClient: Client,

    player0Id: AccountId,
    player0PrivateKey: PrivateKey,
    player0Client: Client,

    player1Id: AccountId,
    player1PrivateKey: PrivateKey,
    player1Client: Client,
}

export const getConfig = (): Config => {
    const serverId = AccountId.fromString(process.env.SERVER_ID);
    const serverPrivateKey = PrivateKey.fromString(process.env.SERVER_PRIVATE_KEY)
    const serverClient = Client.forTestnet().setOperator(serverId, serverPrivateKey)

    const player0Id = AccountId.fromString(process.env.PLAYER0_ID)
    const player0PrivateKey = PrivateKey.fromString(process.env.PLAYER0_PRIVATE_KEY)
    const player0Client = Client.forTestnet().setOperator(player0Id, player0PrivateKey)

    const player1Id = AccountId.fromString(process.env.PLAYER1_ID)
    const player1PrivateKey = PrivateKey.fromString(process.env.PLAYER1_PRIVATE_KEY)
    const player1Client = Client.forTestnet().setOperator(player1Id, player1PrivateKey)

    serverClient.setMaxQueryPayment(new Hbar(1))
    player0Client.setMaxQueryPayment(new Hbar(1))
    player1Client.setMaxQueryPayment(new Hbar(1))

    return {
        serverId: serverId,
        serverPrivateKey: serverPrivateKey,
        serverClient: serverClient,
        player0Id: player0Id,
        player0PrivateKey: player0PrivateKey,
        player0Client: player0Client,
        player1Id: player1Id,
        player1PrivateKey: player1PrivateKey,
        player1Client: player1Client
    }
}
