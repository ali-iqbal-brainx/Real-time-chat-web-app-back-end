require('dotenv').config()
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
const port = process.env.PORT || 4000;



app.use(express.json({ limit: '50mb' }));
const corsOrigin ={
    origin:'http://localhost:3000', //or whatever port your frontend is using
    credentials:true,            
    optionSuccessStatus:200
}
app.use(cors(corsOrigin));


app.use('/api/v1', require("./routes/v1/index.js"));

app.listen(port, () => {
    console.log(`app listening on port ${port}`);
});



