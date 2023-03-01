require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = 4000;


app.listen(port, () => {
    console.log(`app listening on port ${port}`);
});



