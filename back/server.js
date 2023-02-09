/*****************************************************************/
/**************** Import des modules necessaires ****************/

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require('helmet');
const rateLimite = require("express-rate-limit")



/*************************************************************/
/***************** Initialisation de l' API *****************/

const app = express();

app.use(cors({
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE' , '0PTIONS'],
  allowedHeaders: "Origin, X-Requested-With, x-access-token, role, Content, Accept, Content-Type, Authorization"
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const limiter = rateLimite({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
  message: "Pour plus de requêtes essayez plus tard"
})

/********************************************************************/
/***************** Import des modules du routage *******************/
 
const user_router = require("./routes/users");
const sauce_router = require("./routes/sauces");
const path = require("path");



/*******************************************************************/
/************************ Mis en place du routage *****************/

app.get("/", (req, res) => res.send("Je suis encore online!!!!!"));

app.use(helmet({
  //Seules les demandes provenant du même site peuvent lire la ressource
  crossOriginResourcePolicy: { policy: "same-site" }
}));

app.use(limiter)

app.use('/images', express.static(path.join(__dirname, 'images')))

app.use("/api/auth", user_router);

app.use("/api/sauces", sauce_router);


app.all("*", (req, res) => res.status(501).send("Mauvaise recherche"));
//  app.use(helmet())




/*************************************************************/
/******************************* Start du serveur  ***********/

mongoose
  .connect(process.env.DB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(process.env.SERVER_PORT, () => {
      console.log(
        `Le serveur marche sur le port ${process.env.SERVER_PORT || "3000"}`
      );
      console.log("Connexion à MongoDB réussie !");
    });
  })
  

  .catch(() => console.log("Connexion à MongoDB échouée !"));
