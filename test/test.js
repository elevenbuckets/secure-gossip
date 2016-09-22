var gossip = require('../index')
var tap = require('tap')
var block = require('block-stream2')

tap.test('3 peers in a line', function (t) {
  t.plan(4)

  var peer1 = gossip()
  var peer2 = gossip()
  var peer3 = gossip()

  var p1 = peer1.createPeerStream()
  var p21 = peer2.createPeerStream()
  var p22 = peer2.createPeerStream()
  var p3 = peer3.createPeerStream()

  p1.pipe(p21).pipe(p1)
  p3.pipe(p22).pipe(p3)

  var msg = {
    data: 'hello warld'
  }

  peer3.publish(msg)

  var p1c = 0
  var p2c = 0

  peer1.on('message', function (msg, info) {
    t.equal(p1c++, 0)
    t.equal(info.public, peer3.keys.public)
  })

  peer2.on('message', function (msg, info) {
    t.equal(p2c++, 0)
    t.equal(info.public, peer3.keys.public)
  })

  peer3.on('message', function (msg, info) {
    t.fail('peer3 saw their own message!')
  })

  t.tearDown(function() {
    peer1.stop()
    peer2.stop()
    peer3.stop()
  })
})

tap.test('4 peers in a loop', function (t) {
  t.plan(9)

  var peer1 = gossip()
  var peer2 = gossip()
  var peer3 = gossip()
  var peer4 = gossip()

  var p11 = peer1.createPeerStream()
  var p12 = peer1.createPeerStream()

  var p21 = peer2.createPeerStream()
  var p22 = peer2.createPeerStream()

  var p31 = peer3.createPeerStream()
  var p32 = peer3.createPeerStream()

  var p41 = peer4.createPeerStream()
  var p42 = peer4.createPeerStream()

  // peer1 to 2 and 4
  p11.pipe(p21).pipe(p11)
  p12.pipe(p41).pipe(p12)

  // peer2 to 3
  p22.pipe(p31).pipe(p22)

  // peer3 to 4
  p32.pipe(p42).pipe(p32)

  var originalMsg = { foo: 'hello warld' }

  peer1.publish(originalMsg)

  var p2c = 0
  var p3c = 0
  var p4c = 0

  peer1.on('message', function (msg, info) {
    t.fail()
  })

  peer2.on('message', function (msg, info) {
    t.equal(p2c++, 0)
    t.deepEqual(msg, originalMsg)
    t.equal(info.public, peer1.keys.public)
  })

  peer3.on('message', function (msg, info) {
    t.equal(p3c++, 0)
    t.deepEqual(msg, originalMsg)
    t.equal(info.public, peer1.keys.public)
  })

  peer4.on('message', function (msg, info) {
    t.equal(p4c++, 0)
    t.deepEqual(msg, originalMsg)
    t.equal(info.public, peer1.keys.public)
  })

  t.tearDown(function() {
    peer1.stop()
    peer2.stop()
    peer3.stop()
    peer4.stop()
  })
})

tap.test('2 peers with stream breaks', function (t) {
  t.plan(3)

  var peer1 = gossip()
  var peer2 = gossip()

  var p1 = peer1.createPeerStream()
  var p2 = peer2.createPeerStream()

  p1.pipe(block(5)).pipe(p2).pipe(p1)

  var original = {
    data: 'gosh I really hope this packet arrives in one piece!'
  }

  peer1.publish(original)

  var p1c = 0

  peer2.on('message', function (msg, info) {
    t.equal(p1c++, 0)
    t.deepEqual(msg, original)
    t.equal(info.public, peer1.keys.public)
  })

  peer1.on('message', function (msg, info) {
    t.fail('peer1 saw their own message!')
  })

  t.tearDown(function() {
    peer1.stop()
    peer2.stop()
  })
})

tap.test('broken connection', function (t) {
  var peer1 = gossip()
  var peer2 = gossip()

  var p1 = peer1.createPeerStream()
  var p2 = peer2.createPeerStream()

  p1.pipe(p2).pipe(p1)

  var original = {
    data: 'bust'
  }

  peer1.publish(original)

  var p1c = 0

  peer2.on('message', function (msg, info) {
    p2.end()
    t.done()
  })

  peer1.on('message', function (msg, info) {
    t.fail('peer1 saw their own message!')
  })

  t.tearDown(function() {
    peer1.stop()
    peer2.stop()
  })
})
