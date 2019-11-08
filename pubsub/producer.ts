#!/usr/bin/env ts-node

import { connect, Options, ConfirmChannel } from "amqplib"
import * as config from "../config"

const createPublisher = (
  channel: ConfirmChannel,
  exchange: string,
  routingKey: string,
  options?: Options.Publish
) => async (content: Buffer) => {
  channel.publish(exchange, routingKey, content, options)
  await channel.waitForConfirms()
}

async function start() {
  const { hostname, pubsubExchange, username, password, port } = config
  const connection = await connect({ hostname, port, username, password })
  const channel = await connection.createConfirmChannel()
  await channel.assertExchange(pubsubExchange, "fanout", { durable: true })
  const publish = createPublisher(channel, pubsubExchange, "", { persistent: true })
  const message = process.argv.slice(2).join(" ") || "Hello"
  await publish(Buffer.from(message))
  console.log(` [x] Sent ${message}`)

  await connection.close()
}

start().catch(e => {
  console.error(e)
})
