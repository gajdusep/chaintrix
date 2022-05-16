import { AccountId, PrivateKey, Client, Hbar } from "@hashgraph/sdk";

require("dotenv").config();

export type Config = {
    serverId: AccountId,
    serverPrivateKey: PrivateKey,
    serverClient: Client
}

export const getConfig = (): Config => {
    const serverId = AccountId.fromString(process.env.SERVER_ID);
    const serverPrivateKey = PrivateKey.fromString(process.env.SERVER_PRIVATE_KEY)
    const serverClient = Client.forTestnet().setOperator(serverId, serverPrivateKey)

    serverClient.setMaxQueryPayment(new Hbar(1))

    return {
        serverId: serverId,
        serverPrivateKey: serverPrivateKey,
        serverClient: serverClient
    }
}
