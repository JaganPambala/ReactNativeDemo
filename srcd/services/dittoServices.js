import { Ditto, TransportConfig } from "@dittolive/ditto";
import { Platform } from 'react-native';

class DittoServiceClass {
    static instance = null;
    static initPromise = null;

    constructor() {
        throw new Error('Use DittoService.getInstance()');
    }

    static getInstance() {
        if (this.instance) return Promise.resolve(this.instance);
        if (this.initPromise) return this.initPromise; 

        this.initPromise = (async () => {
            const ditto = new Ditto({
                appID: "e8efa4e5-acb9-4fd6-b64c-639c18a879d7",
                type: 'onlinePlayground',
                token: '1fd1e8b1-f64e-49e0-ba60-624b4ff1ec2b',
                customAuthURL: "https://i83inp.cloud.dittolive.app",
            });

            try {
                const transport = new TransportConfig();
                // enable peer-to-peer transports
                if (transport.peerToPeer) {
                    if (transport.peerToPeer.bluetoothLE) transport.peerToPeer.bluetoothLE.isEnabled = true;
                    if (transport.peerToPeer.lan) {
                        transport.peerToPeer.lan.isEnabled = true;
                        transport.peerToPeer.lan.isMdnsEnabled = true;
                    }
                    if (Platform.OS === 'ios' && transport.peerToPeer.awdl) transport.peerToPeer.awdl.isEnabled = true;
                }

                // ensure websocket URL
                if (!transport.connect) transport.connect = {};
                if (!Array.isArray(transport.connect.websocketURLs)) transport.connect.websocketURLs = [];
                if (!transport.connect.websocketURLs.includes('wss://i83inp.cloud.dittolive.app')) {
                    transport.connect.websocketURLs.push('wss://i83inp.cloud.dittolive.app');
                }

                // apply transport config
                if (typeof ditto.setTransportConfig === 'function') {
                    ditto.setTransportConfig(transport);
                } else if (typeof ditto.updateTransportConfig === 'function') {
                    // fallback for older SDKs
                    ditto.updateTransportConfig((config) => {
                        config.connect = transport.connect || config.connect;
                        if (transport.peerToPeer) config.peerToPeer = transport.peerToPeer;
                    });
                }
            } catch (e) {
                console.warn('transport config failed', e);
            }

            try {
                await ditto.store.execute("ALTER SYSTEM SET DQL_STRICT_MODE = false");
            } catch (e) {
                console.warn('ALTER SYSTEM failed', e);
            }

            // try {
            //     if (ditto.presence && typeof ditto.presence.observe === 'function') {
            //         ditto.presence.observe((graph) => {
            //             console.log('Remote peers:', graph.remotePeers);
            //         });
            //     }
            // } catch (e) {
            //     console.warn('presence.observe failed', e);
            // }

            // do NOT block init on cloud connect; start sync in background
           ditto.sync.start(); ///active  

            // register subscription for tasks collection to keep it in sync
            try {
                ditto.sync.registerSubscription("SELECT * FROM tasks");
            } catch (e) {
                console.warn('registerSubscription for tasks failed', e);
            }

            this.instance = ditto;
            return ditto;
        })().finally(() => {
            this.initPromise = null;
        });

        return this.initPromise;
    }

    static getDittoInstance() {
        if (!this.instance) throw new Error('Ditto instance not initialized. Call getInstance first.');
        return this.instance;
    }

    // static getTasksCollection() {
    //     if (!this.instance) throw new Error('Ditto instance not initialized. Call getInstance first.');
    //     return this.instance.store.collection('tasks');
    // }

    // static async bulkInsertOnConflictUpdate(collection, documents) {
    //     if (!documents || documents.length === 0) return;
    //     const query = `INSERT INTO ${collection} DOCUMENTS`;
    //     const queryArguments = {};
    //     let queryParams = '';
    //     for (let i = 0; i < documents.length; i++) {
    //         const name = `doc${i}`;
    //         queryArguments[name] = documents[i];
    //         queryParams += ` (:${name}),`;
    //     }
    //     queryParams = queryParams.replace(/.$/, '');

    //     try {
    //         const ditto = await this.getInstance();
    //         const queryResult = await ditto.store.execute(`${query} ${queryParams} ON ID CONFLICT DO UPDATE`, queryArguments);
    //         if (queryResult && typeof queryResult.mutatedDocumentIDsV2 === 'function') return queryResult.mutatedDocumentIDsV2();
    //         if (queryResult && typeof queryResult.mutatedDocumentIDs === 'function') return queryResult.mutatedDocumentIDs();
    //         return null;
    //     } catch (error) {
    //         console.error(`${query} ${queryParams}, ${JSON.stringify(queryArguments)}`);
    //         console.error(error);
    //         throw error;
    //     }
    // }
}

const DittoService = {
    getInstance: () => DittoServiceClass.getInstance(),
    // bulkInsertOnConflictUpdate: (collection, documents) => DittoServiceClass.bulkInsertOnConflictUpdate(collection, documents),
    // getTasksCollection: () => DittoServiceClass.getTasksCollection(),
    getDittoInstance: () => DittoServiceClass.getDittoInstance(),
    connectCloudAsync: () => DittoServiceClass.connectCloudAsync(),
};

export default DittoService;



 