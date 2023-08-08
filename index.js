require('dotenv').config()

const mongoose = require('mongoose');

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
  }
}

connectToDatabase();

// mongoose.set("debug", true);

const express = require('express');
// const session = require('express-session')
const app = express();
const userRoute = require('./routes/userRoute');
const bodyParser = require('body-parser');
const adminRoute = require('./routes/adminRoute');



app.set('view engine','ejs')


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Add this line to parse URL-encoded bodies



app.use('/',adminRoute)
app.use('/', userRoute);
app.use('*',(req,res)=>{
  res.render('user/error404')
})

app.listen(3001, () => {
  console.log('http://localhost:3001/');
});



