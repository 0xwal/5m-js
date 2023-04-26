const isServer = IsDuplicityVersion();

if (isServer) {
  return require('./server.js');
}

return require('./client.js');
