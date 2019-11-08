#!/usr/bin/env ts-node

import { connect, Options, ConfirmChannel } from "amqplib"

const config = {
  username: `localdev`,
  password: `ayylmao123`,
  hostname: `localhost`,
  port: 5672,
  queue: `tasks`
}

const createSender = (
  channel: ConfirmChannel,
  queue: string,
  options?: Options.Publish
) => async (message: Buffer) => {
  channel.sendToQueue(queue, message, options)
  await channel.waitForConfirms()
}

async function main() {
  const message = process.argv.slice(2).join(" ")
  // if (!message) throw "Empty message!"
  const { hostname, queue, username, password, port } = config
  const connection = await connect({ hostname, port, username, password })
  const channel = await connection.createConfirmChannel()
  await channel.assertQueue(queue, { durable: true })
  const send = createSender(channel, queue, { persistent: true })
  for (let i = 0; i < 10; i++) {
    const rand = 3 + Math.floor(Math.random() * 8)
    const message = ` Message #${i + 1} (${".".repeat(rand)})`
    await send(Buffer.from(message))
    console.log(` [x] Sent ${message}`)
  }
  await send(Buffer.from(message))
  await connection.close()
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(e => {
    console.error(e)
  })
