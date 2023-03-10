/************************************************************************/
/************************** Import des modules nécessaires **************/

const Sauce = require("../models/sauce");
const fs = require("fs");

/*********************************************************************************/
/*************************** Routage de la ressource Sauce ***********************/

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then((Sauces) => res.status(200).json(Sauces))

    .catch((err) =>
      res.status(500).json({ message: "Database error", error: err })
    );
};

exports.getSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => res.status(200).json(sauce))
    .catch((err) =>
      res.status(404).json({ message: "La sauce n'existe pas", error: err })
    );
};

exports.addSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce); //parser la chaine de caractéres envoyer par le front
  delete sauceObject._id;
  delete sauceObject._userId; //par mesure de securité supression de userId venant de la requete
  const laSauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    //generer  url de l'image
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  laSauce
    .save()
    .then(() => res.status(201).json({ message: "Sauce crée !" }))
    .catch((err) =>
      res.status(500).json({ message: "Le serveur ne marche pas", error: err })
    );
};

exports.updateSauce = (req, res, next) => {
  // creation d'un un objet et  verification si  req.file existe ou pas.
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce), //récupèration de l'objet en parsant la chaine de caractères
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`, //recreation de la variable imageUrl
      }
    : { ...req.body }; // si pas d'objet récupèration dans le corps de la requête

  //par mesure de securité on supprime le userId venant de la requête
  delete sauceObject._userId;

  Sauce.findOne({ _id: req.params.id }) //recuperer l'objet en BD
    .then((sauce) => {
      // Verification si le createur  de la sauce est bien le userId  connecté
      if (sauce.userId !== req.auth.userId) {
        res.status(401).json({ message: "Requête non autorisée !" });
      } else {
        // Récupération du contenu du fichier image dans la req
        const testFile = req.file;
        // S'il n'existe pas, mise  à jour des modifications
        if (!testFile) {
          // l'enregistrement à mettre a jour et l'objet
          Sauce.updateOne(
            { _id: req.params.id },
            { ...sauceObject, _id: req.params.id }
          )
            .then(() => res.status(200).json({ message: "Sauce modifiée!" }))
            .catch((error) => res.status(401).json({ error }));
        }
        // Si le fichier existe,suppression de  l'ancienne image dans le dossier 'images'
        else {
          // Récupération du nom du fichier
          const filename = sauce.imageUrl.split("/images/")[1];
          // Suppretion avec 'unlink' de  l'image dans le repertoire images, puis mise à jour des modifications
          fs.unlink(`images/${filename}`, () => {
            Sauce.updateOne(
              { _id: req.params.id },
              { ...sauceObject, _id: req.params.id }
            )
              .then(() => res.status(200).json({ message: "Sauce modifiée!" }))
              .catch((error) => res.status(401).json({ error }));
          });
        }
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Action non autorisée !" });
      } else {
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: "Sauce suprimé !" }))
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })

    .catch((error) => res.status(500).json({ error }));
};

exports.likeSauces = (req, res, next) => {
  const likeOrDislike = req.body.like;
  const sauceId = req.params.id;
  const currentUser = req.body.userId;

  Sauce.findOne({ _id: sauceId }).then((sauceLiked) => {
    switch (likeOrDislike) {
      case 1:
        //verification si l'utilisateur a deja liké la sauce

        if (!sauceLiked.usersLiked.includes(currentUser)) {
          Sauce.updateOne(
            { _id: sauceId },
            { $push: { usersLiked: currentUser }, $inc: { likes: +1 } }
          )
            .then(() => res.status(201).json({ message: "Sauce liké !" }))
            .catch((error) => res.status(400).json({ error }));
        } else {
          res
            .status(409)
            .json({ message: "Vous avez deja liké cette sauce !" });
        }
        break;

      case 0:
        if (sauceLiked.usersLiked.includes(currentUser)) {
          Sauce.updateOne(
            { _id: sauceId },
            { $pull: { usersLiked: currentUser }, $inc: { likes: -1 } }
          )
            .then(() => res.status(200).json({ message: "Like rétiré" }))
            .catch((error) => res.status(400).json({ error }));
        }
        if (sauceLiked.usersDisliked.includes(currentUser)) {
          Sauce.updateOne(
            { _id: sauceId },
            { $pull: { usersDisliked: currentUser }, $inc: { dislikes: -1 } }
          )
            .then(() => res.status(200).json({ message: "Dislike retiré !" }))
            .catch((error) => res.status(400).json({ error }));
        }
        break;

      case -1:
        if (!sauceLiked.usersDisliked.includes(currentUser)) {
          Sauce.updateOne(
            { _id: sauceId },
            { $push: { usersDisliked: currentUser }, $inc: { dislikes: +1 } }
          )
            .then(() => res.status(200).json({ message: "Sauce disliké !" }))
            .catch((error) => res.status(400).json({ error }));
        } else {
          res
            .status(409)
            .json({ message: "Vous avez déja disliké cette sauce" });
        }
        break;
      default:
        console.log("error");
    }
  });
};
