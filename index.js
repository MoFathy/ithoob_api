const express = require("express");
const fs = require('fs');
const http = require('http');
const https = require('https');
// console.log('Http: ', http);

const compression = require('compression');
const bodyParser = require("body-parser");
const models = require("./models");
const categories = require("./routes/categories");
const products = require("./routes/products");
const users = require("./routes/users");
const measurements = require("./routes/measurements");
const carts = require("./routes/carts");
const partners = require("./routes/partners");
const contact = require("./routes/contact");

const orders = require("./routes/orders");
const contents = require("./routes/contents");
const coupons = require("./routes/coupons");
const stocks = require("./routes/stocks");
const login = require("./routes/login");
const signup = require("./routes/signup");
const updating = require("./routes/updating");
const admins = require('./routes/dashboard/admins')
const dashboardProducts = require('./routes/dashboard/products')
const promotions = require('./routes/mobile/promotions')
const addCategory = require('./routes/dashboard/addCategory')//Ehab
const getAllCategoryData = require('./routes/dashboard/getAllCategoryData')//Ehab
const editCategory = require('./routes/dashboard/editCategory')//Ehab
const partnersDashboard = require('./routes/dashboard/partners')//Ehab
const placesDashboard = require('./routes/dashboard/places')//Ehab
const bannerDashboard = require('./routes/dashboard/banner')
const threeStepsSection = require('./routes/dashboard/threeStepsSection')
const usersDashboard = require('./routes/dashboard/users')//Ehab
const measurementsDashboard = require('./routes/dashboard/measurements')//Ehab
const ordersDashboard = require('./routes/dashboard/orders')//Ehab
const faq = require('./routes/dashboard/faq')//Ehab
const contactEmails = require('./routes/dashboard/contactEmails')//Ehab
const contactDashboard = require("./routes/dashboard/contact");
// const fabricsDashboard = require("./routes/dashboard/fabrics");
const BroadcastSMS = require("./routes/dashboard/BroadcastSMS");
const Info = require("./routes/dashboard/info");
const UsersCarts = require("./routes/dashboard/carts")
const Home = require("./routes/dashboard/home")
// const dotEnvResult = require('dotenv').config()
require('newrelic'); // to monit timeout
const timeout = require('connect-timeout'); // to kill timeout process on dyno level

const passport = require("passport");
const cors = require("cors");
const app = express();
app.use(compression());
app.use(cors());
// app.use(timeout('30s'));
// app.use(bodyParser.json());
app.use(bodyParser.json({limit: "50mb"}));
// app.use(haltOnTimedout);
app.use(
  bodyParser.urlencoded({
    limit: "50mb", extended: true, parameterLimit:50000
  })
);
// app.use(haltOnTimedout);

function haltOnTimedout (req, res, next) {
  if (!req.timedout) next()
}

app.use(passport.initialize());

require('./config/passport')(passport);

app.use("/api",categories);
app.use("/api",products);
app.use("/api",users);
app.use("/api",measurements);
app.use("/api",carts);
app.use("/api",partners);
app.use("/api",contact);
app.use("/api",orders);
app.use("/api",contents);
app.use("/api",coupons);
app.use("/api",stocks);
app.use("/api",login);
app.use("/api",signup);
app.use("/api",updating);
app.use("/api/dashboard",admins);
app.use("/api/dashboard",dashboardProducts);
app.use("/api/mobile",promotions);
app.use("/api/mobile",promotions);

app.use("/api/dashboard",addCategory);
app.use("/api/dashboard",getAllCategoryData);
app.use("/api/dashboard",editCategory);
app.use("/api/dashboard",partnersDashboard);
app.use("/api/dashboard",placesDashboard);
app.use("/api/dashboard",usersDashboard);
app.use("/api/dashboard",measurementsDashboard);
app.use("/api/dashboard",ordersDashboard);
app.use("/api/dashboard",faq);
app.use("/api/dashboard",contactEmails);
require("./config/passport")(passport);

app.use("/api", categories);
app.use("/api", products);
app.use("/api", users);
app.use("/api", measurements);
app.use("/api", carts);
app.use("/api", partners);
app.use("/api", contact);
app.use("/api", orders);
app.use("/api", contents);
app.use("/api", coupons);
app.use("/api", stocks);
app.use("/api", login);
app.use("/api", signup);
app.use("/api", updating);
app.use("/api/dashboard", admins);
app.use("/api/dashboard", dashboardProducts);
app.use("/api/mobile", promotions);
app.use("/api/mobile", promotions);
app.use("/api/dashboard", contactDashboard);
app.use("/api/dashboard", addCategory);
app.use("/api/dashboard", getAllCategoryData);
app.use("/api/dashboard", editCategory);
app.use("/api/dashboard", partnersDashboard);
app.use("/api/dashboard", placesDashboard);
app.use("/api/dashboard", bannerDashboard);
app.use("/api/dashboard", threeStepsSection);
app.use("/api/dashboard", usersDashboard);
app.use("/api/dashboard", measurementsDashboard);
app.use("/api/dashboard", ordersDashboard);
// app.use("/api/dashboard", fabricsDashboard);
app.use("/api/dashboard", BroadcastSMS);
app.use("/api/dashboard", Info);
app.use("/api/dashboard", UsersCarts);
app.use("/api/dashboard", Home)

const PORT = process.env.PORT || 5001;

// Certificate
// const privateKey = fs.readFileSync('/etc/letsencrypt/live/ithoob.com/privkey.pem', 'utf8');
// const certificate = fs.readFileSync('/etc/letsencrypt/live/ithoob.com/cert.pem', 'utf8');
// const ca = fs.readFileSync('/etc/letsencrypt/live/ithoob.com/chain.pem', 'utf8');

// const credentials = {
//     key: privateKey,
//     cert: certificate,
//     ca: ca
// };

// // Starting both http & https servers
const httpServer = http.createServer(app);
// const httpsServer = https.createServer(credentials, app);


// sync all tables "models" and start the app
models.sequelize.sync({ force: false }).then(() => {
/*
  app.listen(PORT, () => {
    console.log("listening on port " + PORT);
  });
*/

  httpServer.listen(5001, () => {
     console.log('HTTP Server running on port 5001');
  });

  // httpsServer.listen(5002, () => {
  //    console.log('HTTPS Server running on port 5002');
  // });

});




