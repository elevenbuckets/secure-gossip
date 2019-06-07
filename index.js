'use strict';

const debug = require('debug')('secure-gossip')
const split = require('split')
const ssbkeys = require('ssb-keys')
const Duplex = require('readable-stream').Duplex
const EventEmitter = require('events')
const pumpify = require('pumpify')

class Gossip extends EventEmitter {
	constructor(opts) {
		super();

  		opts = opts || {};

  		if (!opts.keys) { opts.keys = ssbkeys.generate() }

  		let interval = opts.interval || 100;
  		this.keys = opts.keys
  		this.store = []
  		this.peers = []
  		this.seq = 0

  		this.seqs = {}

		this.__data_filter = (copy) => { return true; } // place holder

		this.createPeerStream = () =>
		{
			let stream = new Duplex({ read: (n) => {}, write: (rawChunk, enc, next) => 
				{
					try {
						let chunk = JSON.parse(rawChunk);

        					if (chunk.public === this.keys.public) {
          						debug('got one of my own messages; discarding')
        					} else if (ssbkeys.verifyObj(chunk, chunk.data) && this.__data_filter(chunk.data)) {
          						if (this.seqs[chunk.public] === undefined || this.seqs[chunk.public] < chunk.seq) {
            							this.seqs[chunk.public] = chunk.seq
            							this.store.push(rawChunk + '\n')
            							debug('current seq for', chunk.public, 'is', this.seqs[chunk.public])
            							let copy = { ...chunk.data };
            							delete copy.signature
            							this.emit('message', copy, {public: chunk.public})
          						} else {
            							debug('old gossip; discarding')
          						}
						} else {
          						debug('received message with bad signature! discarding')
						}
					} catch (e) {
        					debug('bad json (or end of stream)')
					}

      					next()
				}
			})

  			stream = pumpify(split(), stream)

  			this.peers.push(stream)

  			return stream
		}

		this.publish = (msg) => 
		{
			let data = msg;
  			msg = {
    				data: ssbkeys.signObj(this.keys, data),
    				public: this.keys.public,
    				seq: this.seq++,
  			}

  			this.store.push(JSON.stringify(msg) + '\n')
		}		

		this.gossip = () =>
		{
			this.peers.map((peer) => {
				this.store.map((chunk) => {
					peer.push(chunk);
				})
			})

			this.store = [];
		}

  		this.interval = interval === -1 ? null : setInterval(this.gossip, interval);

		this.stop = () =>
		{
			if (this.interval) clearInterval(this.interval);
		}

	}
}

module.exports = Gossip
