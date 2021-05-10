const express = require("express");
const router = express.Router();
const models = require("../../models");
const { FabricStock, Category } = models;
const passport = require("passport");

router.get(
  "/get-fabricstocks",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    FabricStock.findAll({
      include: [{ association: "Category"}]
    })
      .then(fabrics => {
        res.status(200).json({
          status: true,
          fabrics: fabrics.map(fabric => ({
            id: fabric.id,
            code: fabric.code,
            type: fabric.type,
            amount: fabric.amount,
            category: fabric.Category ? {
              id: fabric.Category.id,
              name: fabric.Category.name,
              name_en: fabric.Category.name_en,

            }: {}
          }))
        });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: "error in getting fabrics"
        });
      });
  }
);


router.get(
  "/get-fabricstocks-lite",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    FabricStock.findAll()
      .then(fabrics => {
        res.status(200).json({
          status: true,
          fabrics: fabrics.map(fabric => ({
            id: fabric.id,
            code: fabric.code,
            type: fabric.type,
            amount: fabric.amount
          }))
        });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: "error in getting fabrics"
        });
      });
  }
);

router.post(
  "/add-fabricstock",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    const { code, type, amount, category_id } = req.body;
    Category.findOne({ where: { id: category_id } })
      .then(category => {
        FabricStock.create({
          code,
          type,
          amount
        })
          .then(fabric => {
            return fabric.setCategory(category);
          })
          .then(fabric => {
            res.status(200).json({
              status: true,
              message: "fabric added successfully",
              id: fabric.id
            });
          });
      })
      .catch(err => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: "error in adding fabric"
        });
      });
  }
);

router.delete(
  "/delete-fabricstock",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (!req.body.fabricId) {
      return res.status(200).json({
        status: false,
        message: "please add fabricId"
      })
    }
    FabricStock.destroy({
      where: {
        id: req.body.fabricId
      }
    })
      .then(() => {
        res.status(200).json({
          status: true,
          message: "deleted successfully"
        });
      })
      .catch(err => {
        //console.log(err)
        res.status(200).json({
          status: false,
          message: "error in deleting"
        });
      });
  }
);

router.put("/update-fabricstock", passport.authenticate("jwt-admin", { session: false}), (req, res) => {
  if (!req.body.fabricId) {
    return res.status(200).json({
      status: false,
      message: "please add fabricId"
    })
  }
  const {code, amount, categoryId, fabricId} = req.body;
  FabricStock.update({
    code,
    amount,
    category_id: categoryId
  }, {
    where: {
      id: fabricId
    }
  }).then(() => {
    res.status(200).json({
      status: true,
      message: "updated successfully"
    })
  }).catch(err => {
    res.status(200).json({
      status: false,
      message: "Error in updating"
    })
  })
})

router.post("/categories-stocks", (req, res) => {
  let titleKey = req.body.language == 1 ? "title_en" : "title";
  let nameKey = req.body.language == 1 ? "name_en" : "name";
  Category.findOne({
    where: {
      type: "category"
    },
    include: [
      {
        model: models.Category,
        as: "Children",
        include: [
          { model: models.Category, as: "Children"},
          { model: models.CategoryMeta, as: "Metas" } 
        ]
      },

    ]
  }).then(category => {
      res.status(200).json({
        categories: category.Children.map(main => {
          var metaObject = {};
          main.Metas.forEach(meta => {
            metaObject[meta.type] =
              meta.category_meta_relationship.value;
          });
          return {
            categoryId: main.id,
            ...metaObject,
            
            subCategory: main.Children.map(sub => {
             
              return {
                id: sub.id,
                name: sub[nameKey],
              };
            })
          };
        }).find(i => i.stock_type == "fabric"),
        status: true
      });
    })
    .catch(err => {
      //console.log(err)
      res.status(200).json({
        status: false,
        message: "Error in loading categories"
      });
    });
});


module.exports = router;