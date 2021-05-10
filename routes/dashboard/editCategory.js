const express = require("express");
const router = express.Router();
const ResponseSender = require("./ResponseSender")
const models = require("../../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const Category = models.Category;
const CategoryRelationship = models.CategoryRelationship;
const CategoryMetaRelationship = models.CategoryMetaRelationship;
const passport = require("passport");
const CategoryMeta = models.CategoryMeta;

function DeleteCategory(req, res) {
  return models.Category.update({available: false}, {where: {id: req.body.id}})
    .then(result => {
      ResponseSender.sendSuccess(res, "Category Deleted successfully")
    })
    .catch(error => {
      ResponseSender.sendDBError(res, "Database Encountered an Error")
    });
  // return models.sequelize.transaction(t => {
  //   return CategoryMetaRelationship.destroy(
  //     {where: {category_id: req.body.id}},
  //     {transaction: t}
  //   ).then(() => {
  //     return CategoryRelationship.destroy(
  //       {where: {child_id: req.body.id}},
  //       {transaction: t}
  //     ).then(() => {
  //       return Category.destroy(
  //         {where: {id: req.body.id}},
  //         {transaction: t}
  //       )
  //         .then(result => {
  //           ResponseSender.sendSuccess(res, "Category Data Deleted successfully")
  //         })
  //         .catch(error => {
  //           ResponseSender.sendDBError(res, "Database Encountered an Error")
  //           throw new Error(error); // to roll back
  //         });
  //     });
  //   });
  // });
}

function editCategory(req, res) {
  //upload all then add new metas to the DB
  return models.sequelize.transaction(t => {

    let catQuery = Category.update(req.body.data.mainData, {where: {id: req.body.data.mainData.id}, transaction: t});

    let catRelQueryArr = req.body.data.categoryRelations ? req.body.data.categoryRelations : [];
    req.body.data.categoryRelations.forEach(catRel => {
      catRelQueryArr.push(
        CategoryRelationship.update(catRel, {
          where: {id: catRel.id}, transaction: t
        })
      );
    });

    let catMetaRelQueryArr = req.body.data.categoryMetaRelations ? req.body.data.categoryMetaRelations : [];
    req.body.data.categoryMetaRelations.forEach(catMetaRel => {
      catMetaRelQueryArr.push(
        CategoryMetaRelationship.update(catMetaRel, {
          where: {id: catMetaRel.id}, transaction: t
        })
      );
    });

    let newMetas = req.body.data.newMetas ? req.body.data.newMetas : [];
    let newMetasQuery = CategoryMetaRelationship.bulkCreate(newMetas, {transaction: t});

    return Promise.all([catQuery, ...catRelQueryArr, ...catMetaRelQueryArr, newMetasQuery])
      .then(function (result) {
        //console.log(result);
        ResponseSender.sendSuccess(res, "Category Data updated successfully", "successObj", result)
      })
      .catch(function (error) {
        //console.log(error);
        ResponseSender.sendDBError(res, "Database Encountered an Error", error)
        throw new Error();
      });
  });
}

router.post(
  "/deleteCategory",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    //console.log(req.body);
    let validRequest = req.body.id != undefined || req.body.id != null;
    if (validRequest) {
      DeleteCategory(req, res);
    } else {
      ResponseSender.sendInvalidRequest(res, "Invalid request")
    }
  }
);
router.post(
  "/editCategory",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {
    //console.log(req.body);
    let validRequest = req.body.data && req.body.data.mainData && (req.body.data.mainData.id != undefined || req.body.data.mainData.id != null);
    if (validRequest) {
      editCategory(req, res);
    } else {
      ResponseSender.sendInvalidRequest(res, "Invalid request")
    }
  }
);

module.exports = router;
