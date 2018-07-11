// eslint-disable-next-line import/no-namespace
import * as driver from 'bigchaindb-driver'
import Connection from './connection'
import OrmObject from './ormobject'

export default class Orm {
    constructor(connectionUrl, headers) {
        this.connection = new Connection(connectionUrl, headers)
        this.appId = ''
        if (headers && headers.app_id) {
            this.appId = headers.app_id
        }
        this.models = []
        this.driver = driver
    }
    define(modelName, payload, modelSchema) {
        this.models[modelName] = new OrmObject(
            modelName,
            modelSchema,
            payload,
            this.connection,
            this.appId
        )
    }
}
