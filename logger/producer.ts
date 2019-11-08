#!/usr/bin/env ts-node

import { connect, Options, ConfirmChannel } from "amqplib"
import * as config from "../config"

const createPublisher = (channel: ConfirmChannel, exchange: string, options?: Options.Publish) => async (
  routingKey: string,
  content: Buffer
) => {
  channel.publish(exchange, routingKey, content, options)
  await channel.waitForConfirms()
}

async function start() {
  const { hostname, logger, username, password, port } = config

  // Prepare connection
  const connection = await connect({ hostname, port, username, password })
  const channel = await connection.createConfirmChannel()

  // Assert exchange
  await channel.assertExchange(logger, "direct", { durable: false })

  const publish = createPublisher(channel, logger, { persistent: false })

  // Parse arguments
  const args = process.argv.slice(2)
  const severity = args.shift() || "info"
  const message = args ? args.join(" ") : `Empty message`

  // Publish message
  await publish(severity, Buffer.from(message))

  await connection.close()
}

start().catch(e => {
  console.error(e)
})
