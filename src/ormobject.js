import uuid from 'uuid/v4'

// The likelihood to generate a vanity address that is 11 times "Burn" is extremely low:
// - https://en.bitcoin.it/wiki/Vanitygen#Use_of_vanitygen_to_try_to_attack_addresses
const BURN_ADDRESS = 'BurnBurnBurnBurnBurnBurnBurnBurnBurnBurnBurn'

console.log("AFSFAFAFHFLAJFLKAJFLKAFJAL:FJA:LKFJNA:LFNAOPFNAFS")

export default class OrmObject {
    constructor(modelName, payload, modelSchema, connection, appId = '', transactionList = []) {
        this._name = modelName
        this._schema = modelSchema,
        this._payload = payload,
        this._connection = connection
        this._appId = appId
        if (transactionList.length) {
            this.transactionHistory = transactionList
            this.id = transactionList[0].asset.data[`${this._appId}-${this._name}`].id
            this.data = Object.assign({}, ...transactionList.map(tx => (tx.metadata)))
        }
    }

    retrieve(input) {
        const query = input || `"${this._appId}-${this._name}"`
        return this._connection.searchAssets(`"${query}"`)
            .then(assets =>
                Promise.all(assets.map(asset =>
                    this._connection.getSortedTransactions(asset.id)
                        .then(txList =>
                            new OrmObject(
                                this._name,
                                this._schema,
                                this._payload,
                                this._connection,
                                this._appId,
                                txList
                            )))))
    }

    create(inputs) {
        if (inputs === undefined) {
            console.error('inputs missing')
        }
        this._payload = inputs.payload
        const assetPayload = {}
        assetPayload[`${this._appId}-${this._name}`] = {
            'schema': this._schema,
            'id': `id:${this._appId}:${uuid()}`,
            'payload':this._payload
        }
        return this._connection
            .createTransaction(
                inputs.keypair.publicKey,
                inputs.keypair.privateKey,
                assetPayload,
                inputs.data
            )
            .then(tx => Promise.resolve(this._connection.getSortedTransactions(tx.id).then((txList) =>
                new OrmObject(
                    this._name,
                    this._schema,
                    this._payload,
                    this._connection,
                    this._appId,
                    txList
                ))))
    }

    append(inputs) {
        if (inputs === undefined) {
            console.error('inputs missing')
        }
        return this._connection
            .transferTransaction(
                this.transactionHistory[this.transactionHistory.length - 1],
                inputs.keypair.publicKey,
                inputs.keypair.privateKey,
                inputs.toPublicKey,
                inputs.data
            )
            .then(() =>
                Promise.resolve(this._connection.getSortedTransactions(this.transactionHistory[0].id)
                    .then((txList) =>
                        new OrmObject(
                            this._name,
                            this._schema,
                            this._payload,
                            this._connection,
                            this._appId,
                            txList
                        ))))
    }

    burn(inputs) {
        if (inputs === undefined) {
            console.error('inputs missing')
        }

        return this._connection
            .transferTransaction(
                this.transactionHistory[this.transactionHistory.length - 1],
                inputs.keypair.publicKey,
                inputs.keypair.privateKey,
                BURN_ADDRESS,
                { status: 'BURNED' }
            )
            .then(() =>
                Promise.resolve(this._connection.getSortedTransactions(this.transactionHistory[0].id)
                    .then((txList) =>
                        new OrmObject(
                            this._name,
                            this._schema,
                            this._payload,
                            this._connection,
                            this._appId,
                            txList
                        ))))
    }
}
