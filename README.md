# secure-gossip

> Secure, transport agnostic, message gossip protocol.

Any peer in the network can publish messages, which will eventually propogate
out to the entire network via rounds of gossip between each node's peers.

## Security

Each published message is signed with the peer's private key, using
[ssb-keys](https://github.com/ssbc/ssb-keys). This means messages cannot be
forged -- you can be sure that the messages you receive are from the peer that
it claims to be, even if it came in from an intermediary.

## Example

Let's create a line of 3 peers and watch a published message propogate through
them:

```js
var gossip = require('secure-gossip')

var peer1 = gossip()
var peer2 = gossip()
var peer3 = gossip()

var p1 = peer1.createPeerStream()
var p2_1 = peer2.createPeerStream()
var p2_2 = peer2.createPeerStream()
var p3 = peer3.createPeerStream()

// 3 peers in a line, with peer-2 in the middle
p1.pipe(p2_1).pipe(p1)
p2_2.pipe(p3).pipe(p2_2)

// have p1 publish, and watch it propogate to p2 and then p3
peer1.publish({
  data: 'hello warld'
})

peer1.on('message', function (msg, info) {
  console.log('p1 message', msg, 'from', info.public)
})

peer2.on('message', function (msg, info) {
  console.log('p2 message', msg, 'from', info.public)
})

peer3.on('message', function (msg, info) {
  console.log('p3 message', msg, 'from', info.public)
})
```

outputs

```
p2 message { data: "hello warld" } from UHXoKlI2blLU0GaAC3G2sUSGBUOWY7yYpN7DhWQI2/Y=.ed25519

p3 message { data: "hello warld" }  from UHXoKlI2blLU0GaAC3G2sUSGBUOWY7yYpN7DhWQI2/Y=.ed25519

```

## API

```js
var gossip = require('secure-gossip')
```

### var peer = gossip(opts={})

Returns a new gossiping peer. Accepts various options via `opts`:

- `keys` - uses keypair `keys` for message signing. You can generate these keys
  yourself (using [`ssb-keys`](https://github.com/ssbc/ssb-keys)), or, if not
  given, a fresh keypair will be generated for you.
- `interval`- how often to perform gossip with peers, in milliseconds. Defaults
  to 100ms. If set to `-1`, no automatic gossip will occur and you'll need to
  run `peer.gossip()` manually.

### peer.createPeerStream()

Returns a new duplex stream that can be used to exchange gossip with another
peer.

**Remember**: create a new peer stream *per pair of peers*!

### peer.publish(msg)

Publish a signed message to all of your peers.

### peer.gossip()

Initiate a round of gossip manually, forwarding all stored messages to peers.

### peer.stop()

Stops gossiping (clears the internal `setInterval` timer).

### peer.on('message', function (msg, info) {})

Event fired when a message is received from a peer.

- `msg` is the original payload from the peer
- `info` is an object, currently only having the field `public`,
  which is a string of the sender's public key


## install

With [npm](https://npmjs.org/) installed, run

```
$ npm install secure-gossip
```

## license

ISC
