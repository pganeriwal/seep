import { webConnect } from './peer.js';
import { game } from './game-seep.js';

var app = Vue.createApp({// Vue 3.0
    data() {
        return {
            peerId: "",
            message: 'Please wait for your Peer Id:',
            otherPeerId: otherPeerId,
            messageForPeer: "",
            totalPlayers: 4,
            table: null,
        };
    },
    methods: {
        connectToOtherPeer: function () {
            const ret = webConnect.connectToOtherPeer(this.otherPeerId);
            if (ret && ret.error) {
                this.message = ret.error;
            }
        },
        sendMessageToPeers: function () {
            const ret = webConnect.sendMessageToPeers(this.messageForPeer);
        },
        test() {
            game.test();
        },
        init() {
            game.init(this.totalPlayers);
            game.addPlayer({ id: 1 });
            game.addPlayer({ id: 2 });
            game.addPlayer({ id: 3 });
            game.addPlayer({ id: 4 });

            this.table = game._table;
        }
    },
    computed: {
        looseCardsOnTable() {
            return this.table && this.table.cards;
        },
    },
});
app.use(Quasar);
app.mount('#app');