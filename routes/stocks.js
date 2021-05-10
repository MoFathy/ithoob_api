const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const FtpDeploy = require("ftp-deploy");
var ftpDeploy = new FtpDeploy();
const { FTPconfig } = require("../config/keys");
var config = FTPconfig;
const models = require("../models");
const Size = models.Size;
const Fabric = models.Fabric;
const moment = require("moment");
const ShoeColor = models.ShoeColor;

router.get("/sizes", (req, res) => {
  Size.findAll()
    .then((responses) => {
      res.status(200).json({
        status: true,
        sizes: responses.map((response) => {
          return {
            id: response["id"],
            name_ar: response["name_ar"],
            name_en: response["name_en"],
          };
        }),
      });
    })
    .catch((err) => {
      res.status(401).json({
        status: false,
        message: "Error while loading sizes",
        error: err,
      });
    });
});

router.post("/create_size", (req, res) => {
    Size.findOne({
    where: {
      name_en: req.body.name_en,
    },
  }).then((size) => {
    if (size) {
      return res.status(422).json({
        status: false,
        message: "This Size Name Already Exist !",
      });
    } else {
        Size.create({
        name_ar: req.body.name_ar,
        name_en: req.body.name_en,
      })
        .then((size) => {
          return res.status(200).json({
            status: true,
            message: "Success",
          });
        })
        .catch((err) => {
          return res.status(401).json({
            status: false,
            message: "error",
          });
        });
    }
  });
});

router.post("/delete_size", (req, res) => {
  coupon = Size.destroy({
    where: {
      id: req.body.id,
    },
  })
    .then((size) => {
      return res.status(200).json({
        status: true,
        message: "Success",
      });
    })
    .catch((err) => {
      return res.status(401).json({
        status: false,
        message: "error",
      });
    });
});

// Fabrics methods

router.get("/fabrics", (req, res) => {
  Fabric.findAll()
    .then((responses) => {
      res.status(200).json({
        status: true,
        fabrics: responses.map((response) => {
          return {
            id: response["id"],
            name_ar: response["name_ar"],
            name_en: response["name_en"],
          };
        }),
      });
    })
    .catch((err) => {
      res.status(401).json({
        status: false,
        message: "Error while loading sizes",
        error: err,
      });
    });
});

router.post("/create_fabric", (req, res) => {
  Fabric.findOne({
    where: {
      name_en: req.body.name_en,
    },
  }).then((fabric) => {
    if (fabric) {
      return res.status(422).json({
        status: false,
        message: "This Fabric Name Already Exist !",
      });
    } else {
      Fabric.create({
        name_ar: req.body.name_ar,
        name_en: req.body.name_en,
      })
        .then((fabric) => {
          return res.status(200).json({
            status: true,
            message: "Success",
          });
        })
        .catch((err) => {
          return res.status(401).json({
            status: false,
            message: "error",
          });
        });
    }
  });
});

router.post("/delete_fabric", (req, res) => {
  Fabric.destroy({
    where: {
      id: req.body.id,
    },
  })
    .then((fabric) => {
      return res.status(200).json({
        status: true,
        message: "Success",
      });
    })
    .catch((err) => {
      return res.status(401).json({
        status: false,
        message: "error",
      });
    });
});

// shoes colors part
router.get("/shoes_colors", (req, res) => {
  ShoeColor.findAll()
    .then((responses) => {
      return res.status(200).json({
        status: true,
        colors: responses.length >0 ? responses.map((response) => {
          return response.dataValues;
        }): [],
      });
    })
    .catch((err) => {
      res.status(401).json({
        status: false,
        message: "Error while loading shoes colors",
        error: err,
      });
    });
});

router.post("/create_shoe_color", (req, res) => {
  ShoeColor.findOne({
    where: {
      name_en: req.body.name_en,
    },
  }).then((color) => {
    if (color) {
      return res.status(422).json({
        status: false,
        message: "This color Name Already Exist !",
      });
    } else {
      ShoeColor.create({
        name_ar: req.body.name_ar,
        name_en: req.body.name_en,
        image: req.body.image
      })
        .then((color) => {
          return res.status(200).json({
            status: true,
            message: "Success",
          });
        })
        .catch((err) => {
          return res.status(401).json({
            status: false,
            message: "error",
          });
        });
    }
  });
});

router.post("/delete_shoe_color", (req, res) => {
  coupon = ShoeColor.destroy({
    where: {
      id: req.body.id,
    },
  })
    .then((color) => {
      return res.status(200).json({
        status: true,
        message: "Success",
      });
    })
    .catch((err) => {
      return res.status(401).json({
        status: false,
        message: "error",
      });
    });
});


module.exports = router;
