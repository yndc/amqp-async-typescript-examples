#!/usr/bin/env ts-node

import { connect, Connection } from "amqplib";

const config = {
  username: `localdev`,
  password: `ayylmao123`,
  hostname: `localhost`,
  port: 5672,
  queue: `tasks`
};

let connection: Connection;

async function start() {
  const { hostname, queue, username, password, port } = config;
  connection = await connect({ hostname, port, username, password });
  const channel = await connection.createConfirmChannel();
  await channel.assertQueue(queue);
  await channel.prefetch(1);
  console.log(` [x] Waiting for messages... (Press CTRL+C to stop)`);
  await channel.consume(queue, message => {
    const content = message.content.toString();
    if (!content) return;
    console.log(` [x] Received message: ${content}`);
    const delay = (content.split(".").length - 1) * 1000;

    // Simulate a heavy workload
    setTimeout(function() {
      channel.ack(message);
      console.log(` [x] ${content} Done`);
    }, delay);
  });
}

start().catch(e => {
  console.error(e);
});

process.on("beforeExit", () => {
  connection.close();
  console.log(` [CONSUMER] Stopped listening, closing.`);
});
