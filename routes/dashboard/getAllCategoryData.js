const express = require("express");
const router = express.Router();
const ResponseSender = require("./ResponseSender")
const models = require("../../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const Category = models.Category;
const CategoryRelationship = models.CategoryRelationship;
const CategoryMetaRelationship = models.CategoryMetaRelationship;
const CategoryMeta = models.CategoryMeta;
const CategoryMetaOption = models.CategoryMetaOption;
const passport = require("passport");

router.get(
  "/getAllParentCategories/:categoryType",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    let catType = req.params.categoryType.toLowerCase().trim();
    let queries = [];
    let whereObj = catType == "general"
      ? {
        [Op.or]: [{type: catType}, {type: "category"}],
        available: true
      }
      : {
        type: catType,
        available: true
      }

    Category.findAll({
      where: whereObj,
      include: [{
        model: Category, as: "Children",
        attributes: ["id", "name_en", "available"],
        include: [{
          model: Category, as: "Children",
          attributes: ["id", "name_en", "available"],
          include: [{
            model: Category, as: "Children",
            attributes: ["id", "name_en", "available"]
          }]
        }]
      }, {
        model: Category, as: "Parents",
        attributes: ["id", "name_en", "available"],
        include: [{
          model: Category, as: "Parents",
          attributes: ["id", "name_en", "available"]
        }]
      }]
    }).then(results => {
      results.forEach((lvl0) => {
        lvl0.Children = lvl0.Children ? lvl0.Children.filter((itx) => {return itx.available}) : [];

        lvl0.Children.forEach((lvl1) => {
          lvl1.Parents = lvl1.Parents ? lvl1.Parents.filter((itx) => {return itx.available}) : [];
          
          catType == "akmam"? lvl1.Children = lvl1.Children ? lvl1.Children.filter((itx) => {return itx.available}) : [] : null

          lvl1.Parents.forEach((lvl2) => {
            lvl2.Parents = lvl2.Parents ? lvl2.Parents.filter((itx) => {return itx.available}) : [];

            catType == "akmam"? lvl2.Children = lvl2.Children ? lvl2.Children.filter((itx) => {return itx.available}) : [] : null
          })
        })
      })
      let responseObj = [];

      if (catType == "akmam") {
        results.forEach((result) => {
          result.Children.forEach(child => {
            responseObj.push({id: child.id, name_en: child.name_en})
            child.Children.forEach(lvl1Children => {
              responseObj.push({id: lvl1Children.id, name_en: lvl1Children.name_en})
              lvl1Children.Children.forEach(lvl2Children => {
                responseObj.push({id: lvl2Children.id, name_en: lvl2Children.name_en})
              })
            })
          })
          responseObj.push({id: result.id, name_en: result.name_en})
        })
      }

      else if (catType == "betana") {
        results.forEach((result) => {
          responseObj.push({id: result.id, name_en: result.name_en})
        })
      }
      else if (catType == "general") {
        results.forEach((result) => {
          let parent2parent = false;
          if (result.Parents.length) {
            result.Parents.forEach((par) => {
              if (par.Parents.length) {
                parent2parent = true;
              }
            })
          }
          if (!parent2parent) {responseObj.push({id: result.id, name_en: result.name_en})}
        })
      }
      else {
        results.forEach((result) => {
          result.Children.forEach(child => {
            responseObj.push({id: child.id, name_en: child.name_en})
          })
          responseObj.push({id: result.id, name_en: result.name_en})
        })
      }
      ResponseSender.sendSuccess(res, "Parent Categories retrived successfully", "parentCategories", responseObj);
    }).catch(error => {
      //console.log(error);
      return ResponseSender.sendDBError(res, "Database Error", error)
    });
  }
);

router.get(
  "/getAllCategories/:categoryType",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    let catType = req.params.categoryType.toLowerCase().trim();
    let queries = [];
    if (catType == "parent_fabrics") {
      Category.findOne({
        where: {
          type: "fabric",
          available: true
        },
        include: [{
          model: Category, as: "Children",
          attributes: ["id", "name_en", "available"]
        }]
      }).then(result => {

        result.Children = result.Children ? result.Children.filter((itx) => {return itx.available}) : [];

        let responseObj = [{id: result.id, name_en: result.name_en}];
        result.Children.forEach(child => {
          responseObj.push({id: child.id, name_en: child.name_en})
        })
        ResponseSender.sendSuccess(res, "Parent Fabrics retrived successfully", "parentFabrics", responseObj);
      }).catch(error => {
        //console.log(error);
        return ResponseSender.sendDBError(res, "Database Error", error)
      });
    }
    else {
      queries.push(Category.findAll({
        attributes: ["id", "name_en"], where: {
          type: catType,
          available: true
        }
      }));
      if (catType != "general")
        queries.push(CategoryRelationship.findAll({
          where: {type: catType},
          include: [{
            model: Category, as: "Children",
            attributes: ["id", "name_en", "available"],
            where: {type: "child"}
          }]
        }));

      Promise.all(queries).then(results => {
        if (queries.length > 1) {
          results[1].forEach((itx) => {
            itx.Children = itx.Children ? itx.Children.available ? itx.Children : undefined : undefined;
          })
          results[1] = results[1].filter((itx) => {return itx.Children})
        }
        let response = [];
        if (catType == "general" || catType == "color") {
          response.push(...results[0]);
        }
        if (catType != "general")
          results[1].forEach((elem) => {
            response.push(elem.Children);
          })
        return ResponseSender.sendSuccess(res, `All ${catType} retrieved successfully`, catType, response)
      }).catch(error => {
        //console.log(error);
        return ResponseSender.sendDBError(res, "Database Error", error)
      });
    }
  }
);

router.post(
  "/getAllMetas",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    CategoryMeta.findAll({where: {[Op.not]: {type: "slug"}}}).then(
      allMetas => {
        let optionsQueries = [];
        allMetas.forEach(meta => {
          optionsQueries.push(
            CategoryMetaOption.findAll({where: {category_meta_id: meta.id}})
          );
        });
        Promise.all(optionsQueries)
          .then(results => {
            res.status(200).send({
              message: "Metas retrieved successfully",
              success: true,
              metas: allMetas,
              metasOptions: results
            });
          })
          .catch(error => {
            return ResponseSender.sendDBError(res, "Database Error", error)
          });
      }
    );
  }
);

router.post(
  "/getAllCategoryData",
  passport.authenticate("jwt-admin", {session: false}),

  (req, res) => {
    //console.log(req.body);
    let validRequest = req.body.id != undefined || req.body.id != null;
    if (validRequest) {
      let queries = [];
      let categoryData = {};
      queries.push(Category.findOne({
        where: {
          id: req.body.id,
          available: true
        }, attributes: [`id`, `name`, `name_en`, `title`, `title_en`, `type`]
      }));
      queries.push(CategoryRelationship.findAll({where: {child_id: req.body.id}, include: [{model: Category, as: 'Parents', attributes: ['id', 'name_en']}]}));
      queries.push(CategoryMetaRelationship.findAll({where: {category_id: req.body.id}}));
      Promise.all(queries)
        .then(results => {
          categoryData.mainData = results[0];
          categoryData.categoryRelations = results[1];
          categoryData.categoryMetaRelations = results[2];
          return ResponseSender.sendSuccess(res, "Category Data retrieved successfully", "data", categoryData)
        })
        .catch(error => {
          //console.log(error)
          return ResponseSender.sendDBError(res, "Database Error", error)
        });
    } else {
      return ResponseSender.sendInvalidRequest(res, "Invalid Request")
    }
  }
);

module.exports = router;
