const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

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

//READ JSON FILE
const tour = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
);
//console.log(tour);
//import data into DB
const importData = async () => {
  try {
    await Tour.create(tour);
    console.log('Data Successfully Loaded');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

//delete all data from DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data Successfully Deleted');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
