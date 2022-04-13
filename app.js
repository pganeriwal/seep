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
            players: [],
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
            this.players = Object.values(game._players);
            this.table = game._table;
        },
        init() {
            this.players = [];
            game.init(this.totalPlayers);

            for (let id = 1; id <= this.totalPlayers; id++) {
                const player = { id };
                this.players.push(player);
                game.addPlayer(player);
            }

            this.table = game._table;
        }
    },
    computed: {
        looseCardsOnTable() {
            return this.table && this.table.cards;
        },
        housesOnTable() {
            return this.table && this.table.houses;
        },
    },
});
app.use(Quasar);
app.mount('#app');