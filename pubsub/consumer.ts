#!/usr/bin/env ts-node

import { connect } from "amqplib"
import config from "../config"

async function start() {
  const { hostname, pubsubExchange, username, password, port } = config
  const connection = await connect({ hostname, port, username, password })
  const channel = await connection.createConfirmChannel()
  await channel.assertExchange(pubsubExchange, "fanout", { durable: true })
  const queue = await channel.assertQueue("", { exclusive: true })
  const queueName = queue.queue
  await channel.bindQueue(queueName, pubsubExchange, "")
  console.log(` Binded queue ${queueName} to ${pubsubExchange}`)
  console.log(` [x] Waiting for messages... (Press CTRL+C to stop)`)
  await channel.consume(
    queueName,
    message => {
      const content = message.content.toString()
      console.log(content)
      channel.ack(message)
    },
    { noAck: false }
  )
}

start().catch(e => {
  console.error(e)
})
