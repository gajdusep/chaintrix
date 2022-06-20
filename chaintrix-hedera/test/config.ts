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

    player2Id: AccountId,
    player2PrivateKey: PrivateKey,
    player2Client: Client,
}

const getIdAndKeyAndClient = (
    idEnv: string, privateKeyEnv: string
): [id: AccountId, pk: PrivateKey, client: Client] => {
    const accountId = AccountId.fromString(idEnv);
    const privateKey = PrivateKey.fromString(privateKeyEnv)
    const client = Client.forTestnet().setOperator(accountId, privateKey)
    return [
        accountId,
        privateKey,
        client
    ]
}

export const getConfig = (): Config => {

    const [serverId, serverPrivateKey, serverClient] = getIdAndKeyAndClient(process.env.SERVER_ID, process.env.SERVER_PRIVATE_KEY)
    const [player0Id, player0PrivateKey, player0Client] = getIdAndKeyAndClient(process.env.PLAYER0_ID, process.env.PLAYER0_PRIVATE_KEY)
    const [player1Id, player1PrivateKey, player1Client] = getIdAndKeyAndClient(process.env.PLAYER1_ID, process.env.PLAYER1_PRIVATE_KEY)
    const [player2Id, player2PrivateKey, player2Client] = getIdAndKeyAndClient(process.env.PLAYER2_ID, process.env.PLAYER2_PRIVATE_KEY)

    serverClient.setMaxQueryPayment(new Hbar(1))
    player0Client.setMaxQueryPayment(new Hbar(1))
    player1Client.setMaxQueryPayment(new Hbar(1))
    player2Client.setMaxQueryPayment(new Hbar(1))

    return {
        serverId: serverId,
        serverPrivateKey: serverPrivateKey,
        serverClient: serverClient,
        player0Id: player0Id,
        player0PrivateKey: player0PrivateKey,
        player0Client: player0Client,
        player1Id: player1Id,
        player1PrivateKey: player1PrivateKey,
        player1Client: player1Client,
        player2Id: player2Id,
        player2PrivateKey: player2PrivateKey,
        player2Client: player2Client
    }
}
