/******************************************************/
/******************* Import des modules nécéssaires ***/

const jwt = require("jsonwebtoken");

/****************************************************/
/**************  Verification de la validité du token ****/

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;
    //rajout de l'objet userId à l'ojet rêquete
    req.auth = {
      userId: userId,
    };
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};
