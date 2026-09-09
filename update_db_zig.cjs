async function run() {
  const { db } = await import('./dist/server.js');
  // wait, the server doesn't export db directly but I can just use db instance if I can import it.
}
