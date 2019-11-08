#!/usr/bin/env ts-node

import { connect } from "amqplib"
import * as config from "../config"

async function start() {
  const { hostname, logger, username, password, port } = config

  // Prepare connection
  const connection = await connect({ hostname, port, username, password })
  const channel = await connection.createConfirmChannel()

  // Parse arguments
  const severities = process.argv.slice(2)

  // Prepare exchange and queue
  await channel.assertExchange(logger, "direct", { durable: false })
  const queue = await channel.assertQueue("", { exclusive: true })
  const queueName = queue.queue
  for (let i = 0; i < severities.length; i++) {
    console.log(` Binded queue ${queueName} to ${logger} with routing: ${severities[i]}`)
    await channel.bindQueue(queueName, logger, severities[i])
  }

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
