const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

//connecting to mongodb using mongoose
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  //LOCAL
  //.connect(process.env.DATABASE_LOCAL, {
  //CLOUD
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB Connection Succesful'));
//port number & START SERVER
const port = process.env.port || 3000;
const server = app.listen(port, () =>
  console.log(`App running on port ${port}.....`)
);

process.on('uncaughtException', (err) => {
  console.log('Unhandled Rejection at: Promise');
  console.log(err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection at');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
