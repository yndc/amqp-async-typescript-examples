#!/usr/bin/env ts-node

import { connect } from "amqplib"
import config from "../config"

async function start() {
  const { hostname, queue, username, password, port } = config
  const connection = await connect({ hostname, port, username, password })
  const channel = await connection.createConfirmChannel()
  await channel.assertQueue(queue)
  await channel.prefetch(1)
  console.log(` [x] Waiting for messages... (Press CTRL+C to stop)`)
  await channel.consume(queue, message => {
    const content = message.content.toString()
    const delay = (content.split(".").length - 1) * 1000
    console.log(` [x] Received message: ${content}`)
    setTimeout(function() {
      channel.ack(message)
      console.log(` [x] ${content} Done`)
    }, delay)
  })
}

start().catch(e => {
  console.error(e)
})
