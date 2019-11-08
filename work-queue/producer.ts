#!/usr/bin/env ts-node

import { connect, Options, ConfirmChannel } from "amqplib"
import config from "../config"

const createSender = (
  channel: ConfirmChannel,
  queue: string,
  options?: Options.Publish
) => async (message: Buffer) => {
  channel.sendToQueue(queue, message, options)
  await channel.waitForConfirms()
}

async function main() {
  const { hostname, queue, username, password, port } = config
  const connection = await connect({ hostname, port, username, password })
  const channel = await connection.createConfirmChannel()
  await channel.assertQueue(queue, { durable: true })
  const send = createSender(channel, queue, { persistent: true })
  for (let i = 0; i < 10; i++) {
    const rand = 3 + Math.floor(Math.random() * 8)
    const message = `Message #${i + 1} (${".".repeat(rand)})`
    await send(Buffer.from(message))
    console.log(` [x] Sent ${message}`)
  }
  await connection.close()
}

main().catch(e => {
  console.error(e)
})
