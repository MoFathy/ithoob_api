const express = require("express");
const router = express.Router();
const models = require("../../models");
const Sequelize = require("sequelize");
const ResponseSender = require('./ResponseSender');
const Op = Sequelize.Op;
const Category = models.Category;
const passport = require("passport");
const CategoryRelationship = models.CategoryRelationship;
const CategoryMeta = models.CategoryMeta;
const CategoryMetaRelationship = models.CategoryMetaRelationship;

router.post(
  "/addCategory",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {

    let validRequest =
      // req.body.name !== undefined &&
      req.body.name_en !== undefined &&
      req.body.title !== undefined &&
      req.body.title_en !== undefined //&&
      // req.body.parentCat !== undefined &&
      // req.body.sizeType !== undefined;
    if (validRequest) {
      addCategoryToDB(req, res, "general")
    } else {
      ResponseSender.sendInvalidRequest(res, "Invalid response, name, title_en, name_en");
    }
  }
);

router.post(
  "/addFabric",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {

    let validRequest = true
    // req.body.name !== undefined &&
    // req.body.name_en !== undefined &&
    // req.body.title !== undefined &&
    // req.body.title_en !== undefined &&
    // req.body.parentCat !== undefined &&
    // req.body.sizeType !== undefined;
    if (validRequest) {
      addCategoryToDB(req, res, "fabric")
    } else {
      ResponseSender.sendInvalidRequest(res, "Invalid response, name, title_en, name_en");
    }
  }
);
router.post(
  "/addYaka",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {

    let validRequest = true
    // req.body.name !== undefined &&
    // req.body.name_en !== undefined &&
    // req.body.title !== undefined &&
    // req.body.title_en !== undefined &&
    // req.body.parentCat !== undefined &&
    // req.body.sizeType !== undefined;
    if (validRequest) {
      addCategoryToDB(req, res, "yaka")
    } else {
      ResponseSender.sendInvalidRequest(res, "Invalid response, name, title_en, name_en");
    }
  }
);
router.post(
  "/addZarzour",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {

    let validRequest = true
    // req.body.name !== undefined &&
    // req.body.name_en !== undefined &&
    // req.body.title !== undefined &&
    // req.body.title_en !== undefined &&
    // req.body.parentCat !== undefined &&
    // req.body.sizeType !== undefined;
    if (validRequest) {
      addCategoryToDB(req, res, "zarzour")
    } else {
      ResponseSender.sendInvalidRequest(res, "Invalid response, name, title_en, name_en");
    }
  }
);
router.post(
  "/addAccessory",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {

    let validRequest = true
    // req.body.name !== undefined &&
    // req.body.name_en !== undefined &&
    // req.body.title !== undefined &&
    // req.body.title_en !== undefined &&
    // req.body.parentCat !== undefined &&
    // req.body.sizeType !== undefined;
    if (validRequest) {
      addCategoryToDB(req, res, "accessory")
    } else {
      ResponseSender.sendInvalidRequest(res, "Invalid response, name, title_en, name_en");
    }
  }
);
router.post(
  "/addBetana",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {

    let validRequest = true
    // req.body.name !== undefined &&
    // req.body.name_en !== undefined &&
    // req.body.title !== undefined &&
    // req.body.title_en !== undefined &&
    // req.body.parentCat !== undefined &&
    // req.body.sizeType !== undefined;
    if (validRequest) {
      addCategoryToDB(req, res, "betana")
    } else {
      ResponseSender.sendInvalidRequest(res, "Invalid response, name, title_en, name_en");
    }
  }
);
router.post(
  "/addAkmam",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {

    let validRequest = true
    // req.body.name !== undefined &&
    // req.body.name_en !== undefined &&
    // req.body.title !== undefined &&
    // req.body.title_en !== undefined &&
    // req.body.parentCat !== undefined &&
    // req.body.sizeType !== undefined;
    if (validRequest) {
      addCategoryToDB(req, res, "akmam")
    } else {
      ResponseSender.sendInvalidRequest(res, "Invalid response, name, title_en, name_en");
    }
  }
);


router.post(
  "/addColor",
  passport.authenticate("jwt-admin", {session: false}),
  (req, res) => {

    let validRequest = true
    // req.body.name !== undefined &&
    // req.body.name_en !== undefined &&
    // req.body.title !== undefined &&
    // req.body.title_en !== undefined &&
    // req.body.parentCat !== undefined &&
    validRequest = req.body.code !== undefined;
    if (validRequest) {
      addCategoryToDB(req, res, "color")
    } else {
      ResponseSender.sendInvalidRequest(res, "Invalid response, name, title_en, name_en, and code");
    }
  }
);

function findMetaId(metasArr, metaType) {
  return metasArr.find((elem) => {
    return elem.type.toLowerCase().trim() == metaType.toLowerCase().trim()
  })
}

function addCategoryToDB(req, res, type) {
  CategoryMeta.findAll({
    include: [{
      model: models.CategoryMetaOption
    }]
  }).then(metas => {
    switch (type) {
      case "general":
        return models.sequelize.transaction(t => {
          return Category.create({
            name: req.body.name,
            name_en: req.body.name_en,
            title: req.body.title,
            title_en: req.body.title_en,
            type: "general",
          }, {transaction: t})
            .then((newCategory) => {
              return Category.findOne({where: {[Op.or]: {name_en: "main", type: "category"}}})
                .then(mainCategory => {
                  let queries = [];


                  queries.push(CategoryRelationship.create({
                    type: "general", //check
                    child_id: String(newCategory.id),
                    parent_id: req.body.parentCat ? req.body.parentCat : mainCategory.id
                  }, {transaction: t}))

                  if (req.body.sizeType)
                    queries.push(CategoryMetaRelationship.create({
                      value: req.body.sizeType,
                      category_meta_id: findMetaId(metas, "sizeType").id,
                      category_id: String(newCategory.id)
                    }, {transaction: t}))

                  if (req.body.sizeMan)
                    queries.push(CategoryMetaRelationship.create({
                      value: req.body.sizeMan,
                      category_meta_id: findMetaId(metas, "size_man").id,
                      category_id: String(newCategory.id)
                    }, {transaction: t}))

                  if (req.body.measurementTableSource)
                    queries.push(CategoryMetaRelationship.create({
                      value: req.body.measurementTableSource,
                      category_meta_id: findMetaId(metas, "measurement-table").id,
                      category_id: newCategory.id
                    }, {transaction: t}))


                  if (req.body.imageSource)
                    queries.push(CategoryMetaRelationship.create({
                      value: req.body.imageSource,
                      category_meta_id: findMetaId(metas, "image").id,
                      category_id: newCategory.id
                    }, {transaction: t}))


                  if (req.body.description_en)
                    queries.push(CategoryMetaRelationship.create({
                      value: req.body.description_en,
                      category_meta_id: findMetaId(metas, "description_en").id,
                      category_id: newCategory.id
                    }, {transaction: t}))

                  if (req.body.description)
                    queries.push(CategoryMetaRelationship.create({
                      value: req.body.description,
                      category_meta_id: findMetaId(metas, "description").id,
                      category_id: newCategory.id
                    }, {transaction: t}))

                  let str = req.body.title_en.toLowerCase().replace(/\s/g, "-");

                  queries.push(CategoryMetaRelationship.findAll({where: {category_meta_id: 1, value: {[Op.regexp]: `^(${str})([0-9]+)?`}}}, {transaction: t}));
                  return Promise.all(queries)
                    .then((results) => {

                      let slugs = results[queries.length - 1];
                      return CategoryMetaRelationship.create({
                        value:
                          +slugs.length > 0
                            ? str + String(+slugs.length + 1)
                            : str,
                        category_meta_id: findMetaId(metas, "slug").id,
                        category_id: newCategory.id
                      }, {transaction: t})
                        .then(() => {
                          ResponseSender.sendSuccess(res, "Category was added successfully", "result", results);
                        }).catch(error => {
                          ResponseSender.sendDBError(res, "Couldn't Add Category", error);
                          throw new Error(error); // to roll back
                        });
                    })
                    .catch(error => {
                      ResponseSender.sendDBError(res, "Couldn't Add Category", error);
                      throw new Error(error); // to roll back
                    });

                })
                .catch(error => {
                  //console.log(error);
                  ResponseSender.sendDBError(res, "Couldn't Add Category", error);
                  throw new Error(error); // to roll back
                })

            })
            .catch(error => {
              ResponseSender.sendDBError(res, "Couldn't Add Category", error);
              throw new Error(error); // to roll back
            });

        });
      case "fabric":
        return models.sequelize.transaction(t => {
          return Category.create({
            name: req.body.name,
            name_en: req.body.name_en,
            title: req.body.title,
            title_en: req.body.title_en,
            type: "child",
          }, {transaction: t})
            .then((newCategory) => {

              let queries = [];

              if (req.body.parentCat)
                queries.push(CategoryRelationship.create({
                  type: "fabric",
                  child_id: String(newCategory.id),
                  parent_id: req.body.parentCat
                }, {transaction: t}))

              if (req.body.description)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.description,
                  category_meta_id: findMetaId(metas, "description").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.description_en)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.description_en,
                  category_meta_id: findMetaId(metas, "description_en").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.imageSource)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.imageSource,
                  category_meta_id: findMetaId(metas, "image").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.cost)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.cost,
                  category_meta_id: findMetaId(metas, "cost").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.two_row != null || req.body.two_row != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.two_row == true),
                  category_meta_id: findMetaId(metas, "two_row").id,
                  category_id: String(newCategory.id)
                }, {transaction: t}))

              if (req.body.withAccessory != null || req.body.withAccessory != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.withAccessory == true),
                  category_meta_id: findMetaId(metas, "withAccessory").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.multiSelect != null || req.body.multiSelect != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.multiSelect == true),
                  category_meta_id: findMetaId(metas, "multiSelect").id,
                  category_id: String(newCategory.id)
                }, {transaction: t}))



              return Promise.all(queries)
                .then((results) => {
                  ResponseSender.sendSuccess(res, "Fabric was added successfully", "result", results);
                })
                .catch(error => {
                  //console.log(error);
                  ResponseSender.sendDBError(res, "Couldn't Add Fabric", error);
                  throw new Error(error); // to roll back
                });
            })
            .catch(error => {
              //console.log(error);

              ResponseSender.sendDBError(res, "Couldn't Add Fabric", error);
              throw new Error(error); // to roll back
            });

        });
      case "color":
        return models.CategoryMeta.findOne({where: {type: "code"}, 
        include: [{model: models.CategoryMetaRelationship}]})
          .then((existingCodes) => {
            //console.log(existingCodes);
            if (!existingCodes.category_meta_relationships.find((cmr) => {return cmr.value == req.body.code})) {
              return models.sequelize.transaction(t => {
                return Category.create({
                  name: req.body.name,
                  name_en: req.body.name_en,
                  title: req.body.title,
                  title_en: req.body.title_en,
                  type: "color",
                }, {transaction: t})
                  .then((newCategory) => {

                    let queries = [];

                    if (req.body.parentCat)
                      queries.push(CategoryRelationship.create({
                        type: "fabric",
                        child_id: String(newCategory.id),
                        parent_id: req.body.parentCat
                      }, {transaction: t}))

                    if (req.body.description)
                      queries.push(CategoryMetaRelationship.create({
                        value: req.body.description,
                        category_meta_id: findMetaId(metas, "description").id,
                        category_id: newCategory.id
                      }, {transaction: t}))

                    if (req.body.description_en)
                      queries.push(CategoryMetaRelationship.create({
                        value: req.body.description_en,
                        category_meta_id: findMetaId(metas, "description_en").id,
                        category_id: newCategory.id
                      }, {transaction: t}))

                    if (req.body.imageSource)
                      queries.push(CategoryMetaRelationship.create({
                        value: req.body.imageSource,
                        category_meta_id: findMetaId(metas, "image").id,
                        category_id: newCategory.id
                      }, {transaction: t}))

                    if (req.body.max_quantity)
                      queries.push(CategoryMetaRelationship.create({
                        value: req.body.max_quantity,
                        category_meta_id: findMetaId(metas, "max_quantity").id,
                        category_id: newCategory.id
                      }, {transaction: t}))

                    if (req.body.two_row != null || req.body.two_row != undefined)
                      queries.push(CategoryMetaRelationship.create({
                        value: String(req.body.two_row == true),
                        category_meta_id: findMetaId(metas, "two_row").id,
                        category_id: String(newCategory.id)
                      }, {transaction: t}))

                    if (req.body.withAccessory != null || req.body.withAccessory != undefined)
                      queries.push(CategoryMetaRelationship.create({
                        value: String(req.body.withAccessory == true),
                        category_meta_id: findMetaId(metas, "withAccessory").id,
                        category_id: newCategory.id
                      }, {transaction: t}))

                    if (req.body.multiSelect != null || req.body.multiSelect != undefined)
                      queries.push(CategoryMetaRelationship.create({
                        value: String(req.body.multiSelect == true),
                        category_meta_id: findMetaId(metas, "multiSelect").id,
                        category_id: String(newCategory.id)
                      }, {transaction: t}))



                    if (req.body.fabric_type)
                      queries.push(CategoryMetaRelationship.create({
                        value: req.body.fabric_type,
                        category_meta_id: findMetaId(metas, "fabric_type").id,
                        category_id: newCategory.id
                      }, {transaction: t}))

                    if (req.body.code)
                      queries.push(CategoryMetaRelationship.create({
                        value: req.body.code,
                        category_meta_id: findMetaId(metas, "code").id,
                        category_id: newCategory.id
                      }, {transaction: t}))

                    return Promise.all(queries)
                      .then((results) => {
                        ResponseSender.sendSuccess(res, "color was added successfully", "result", results);
                      })
                      .catch(error => {
                        //console.log(error);
                        ResponseSender.sendDBError(res, "Couldn't Add color", error);
                        throw new Error(error); // to roll back
                      });
                  })
                  .catch(error => {
                    //console.log(error);
                    ResponseSender.sendDBError(res, "Couldn't Add color", error);
                    throw new Error(error); // to roll back
                  });
              });
            } else {
              ResponseSender.sendInvalidRequest(res, "Couldn't add color, code of the color must be unique");
            }
          }).catch(error => {
            //console.log(error);
            ResponseSender.sendDBError(res, "Couldn't Add color", error);
          });
      case "accessory":
        return models.sequelize.transaction(t => {
          return Category.create({
            name: req.body.name,
            name_en: req.body.name_en,
            title: req.body.title,
            title_en: req.body.title_en,
            type: "child",
          }, {transaction: t})
            .then((newCategory) => {

              let queries = [];

              if (req.body.parentCat)
                queries.push(CategoryRelationship.create({
                  type: "accessory",
                  child_id: String(newCategory.id),
                  parent_id: req.body.parentCat
                }, {transaction: t}))

              if (req.body.description)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.description,
                  category_meta_id: findMetaId(metas, "description").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.description_en)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.description_en,
                  category_meta_id: findMetaId(metas, "description_en").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.imageSource)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.imageSource,
                  category_meta_id: findMetaId(metas, "image").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.cost)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.cost,
                  category_meta_id: findMetaId(metas, "cost").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.two_row != null || req.body.two_row != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.two_row == true),
                  category_meta_id: findMetaId(metas, "two_row").id,
                  category_id: String(newCategory.id)
                }, {transaction: t}))

              if (req.body.withAccessory != null || req.body.withAccessory != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.withAccessory == true),
                  category_meta_id: findMetaId(metas, "withAccessory").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.multiSelect != null || req.body.multiSelect != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.multiSelect == true),
                  category_meta_id: findMetaId(metas, "multiSelect").id,
                  category_id: String(newCategory.id)
                }, {transaction: t}))



              return Promise.all(queries)
                .then((results) => {
                  ResponseSender.sendSuccess(res, "accessory was added successfully", "result", results);
                })
                .catch(error => {
                  //console.log(error);
                  ResponseSender.sendDBError(res, "Couldn't Add accessory", error);
                  throw new Error(error); // to roll back
                });
            })
            .catch(error => {
              //console.log(error);

              ResponseSender.sendDBError(res, "Couldn't Add accessory", error);
              throw new Error(error); // to roll back
            });

        });
      case "akmam":
        return models.sequelize.transaction(t => {
          return Category.create({
            name: req.body.name,
            name_en: req.body.name_en,
            title: req.body.title,
            title_en: req.body.title_en,
            type: "child",
          }, {transaction: t})
            .then((newCategory) => {

              let queries = [];

              if (req.body.parentCat)
                queries.push(CategoryRelationship.create({
                  type: "akmam",
                  child_id: String(newCategory.id),
                  parent_id: req.body.parentCat
                }, {transaction: t}))

              if (req.body.description)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.description,
                  category_meta_id: findMetaId(metas, "description").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.description_en)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.description_en,
                  category_meta_id: findMetaId(metas, "description_en").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.imageSource)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.imageSource,
                  category_meta_id: findMetaId(metas, "image").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.cost)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.cost,
                  category_meta_id: findMetaId(metas, "cost").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.two_row != null || req.body.two_row != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.two_row == true),
                  category_meta_id: findMetaId(metas, "two_row").id,
                  category_id: String(newCategory.id)
                }, {transaction: t}))

              if (req.body.withAccessory != null || req.body.withAccessory != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.withAccessory == true),
                  category_meta_id: findMetaId(metas, "withAccessory").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.multiSelect != null || req.body.multiSelect != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.multiSelect == true),
                  category_meta_id: findMetaId(metas, "multiSelect").id,
                  category_id: String(newCategory.id)
                }, {transaction: t}))



              return Promise.all(queries)
                .then((results) => {
                  ResponseSender.sendSuccess(res, "akmam was added successfully", "result", results);
                })
                .catch(error => {
                  //console.log(error);
                  ResponseSender.sendDBError(res, "Couldn't Add akmam", error);
                  throw new Error(error); // to roll back
                });
            })
            .catch(error => {
              //console.log(error);

              ResponseSender.sendDBError(res, "Couldn't Add akmam", error);
              throw new Error(error); // to roll back
            });

        });
      case "betana":
        return models.sequelize.transaction(t => {
          return Category.create({
            name: req.body.name,
            name_en: req.body.name_en,
            title: req.body.title,
            title_en: req.body.title_en,
            type: "child",
          }, {transaction: t})
            .then((newCategory) => {

              let queries = [];

              if (req.body.parentCat)
                queries.push(CategoryRelationship.create({
                  type: "betana",
                  child_id: String(newCategory.id),
                  parent_id: req.body.parentCat
                }, {transaction: t}))

              if (req.body.description)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.description,
                  category_meta_id: findMetaId(metas, "description").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.description_en)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.description_en,
                  category_meta_id: findMetaId(metas, "description_en").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.imageSource)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.imageSource,
                  category_meta_id: findMetaId(metas, "image").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.cost)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.cost,
                  category_meta_id: findMetaId(metas, "cost").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.two_row != null || req.body.two_row != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.two_row == true),
                  category_meta_id: findMetaId(metas, "two_row").id,
                  category_id: String(newCategory.id)
                }, {transaction: t}))

              if (req.body.withAccessory != null || req.body.withAccessory != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.withAccessory == true),
                  category_meta_id: findMetaId(metas, "withAccessory").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.multiSelect != null || req.body.multiSelect != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.multiSelect == true),
                  category_meta_id: findMetaId(metas, "multiSelect").id,
                  category_id: String(newCategory.id)
                }, {transaction: t}))



              return Promise.all(queries)
                .then((results) => {
                  ResponseSender.sendSuccess(res, "betana was added successfully", "result", results);
                })
                .catch(error => {
                  //console.log(error);
                  ResponseSender.sendDBError(res, "Couldn't Add betana", error);
                  throw new Error(error); // to roll back
                });
            })
            .catch(error => {
              //console.log(error);

              ResponseSender.sendDBError(res, "Couldn't Add betana", error);
              throw new Error(error); // to roll back
            });

        });
      case "zarzour":
        return models.sequelize.transaction(t => {
          return Category.create({
            name: req.body.name,
            name_en: req.body.name_en,
            title: req.body.title,
            title_en: req.body.title_en,
            type: "child",
          }, {transaction: t})
            .then((newCategory) => {

              let queries = [];

              if (req.body.parentCat)
                queries.push(CategoryRelationship.create({
                  type: "zarzour",
                  child_id: String(newCategory.id),
                  parent_id: req.body.parentCat
                }, {transaction: t}))

              if (req.body.description)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.description,
                  category_meta_id: findMetaId(metas, "description").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.description_en)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.description_en,
                  category_meta_id: findMetaId(metas, "description_en").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.imageSource)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.imageSource,
                  category_meta_id: findMetaId(metas, "image").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.cost)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.cost,
                  category_meta_id: findMetaId(metas, "cost").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.two_row != null || req.body.two_row != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.two_row == true),
                  category_meta_id: findMetaId(metas, "two_row").id,
                  category_id: String(newCategory.id)
                }, {transaction: t}))

              if (req.body.withAccessory != null || req.body.withAccessory != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.withAccessory == true),
                  category_meta_id: findMetaId(metas, "withAccessory").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.multiSelect != null || req.body.multiSelect != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.multiSelect == true),
                  category_meta_id: findMetaId(metas, "multiSelect").id,
                  category_id: String(newCategory.id)
                }, {transaction: t}))



              return Promise.all(queries)
                .then((results) => {
                  ResponseSender.sendSuccess(res, "zarzour was added successfully", "result", results);
                })
                .catch(error => {
                  //console.log(error);
                  ResponseSender.sendDBError(res, "Couldn't Add zarzour", error);
                  throw new Error(error); // to roll back
                });
            })
            .catch(error => {
              //console.log(error);

              ResponseSender.sendDBError(res, "Couldn't Add zarzour", error);
              throw new Error(error); // to roll back
            });

        });
      case "yaka":
        return models.sequelize.transaction(t => {
          return Category.create({
            name: req.body.name,
            name_en: req.body.name_en,
            title: req.body.title,
            title_en: req.body.title_en,
            type: "child",
          }, {transaction: t})
            .then((newCategory) => {

              let queries = [];

              if (req.body.parentCat)
                queries.push(CategoryRelationship.create({
                  type: "yaka",
                  child_id: String(newCategory.id),
                  parent_id: req.body.parentCat
                }, {transaction: t}))

              if (req.body.description)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.description,
                  category_meta_id: findMetaId(metas, "description").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.description_en)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.description_en,
                  category_meta_id: findMetaId(metas, "description_en").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.imageSource)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.imageSource,
                  category_meta_id: findMetaId(metas, "image").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.cost)
                queries.push(CategoryMetaRelationship.create({
                  value: req.body.cost,
                  category_meta_id: findMetaId(metas, "cost").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.two_row != null || req.body.two_row != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.two_row == true),
                  category_meta_id: findMetaId(metas, "two_row").id,
                  category_id: String(newCategory.id)
                }, {transaction: t}))

              if (req.body.withAccessory != null || req.body.withAccessory != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.withAccessory == true),
                  category_meta_id: findMetaId(metas, "withAccessory").id,
                  category_id: newCategory.id
                }, {transaction: t}))

              if (req.body.multiSelect != null || req.body.multiSelect != undefined)
                queries.push(CategoryMetaRelationship.create({
                  value: String(req.body.multiSelect == true),
                  category_meta_id: findMetaId(metas, "multiSelect").id,
                  category_id: String(newCategory.id)
                }, {transaction: t}))



              return Promise.all(queries)
                .then((results) => {
                  ResponseSender.sendSuccess(res, "yaka was added successfully", "result", results);
                })
                .catch(error => {
                  //console.log(error);
                  ResponseSender.sendDBError(res, "Couldn't Add yaka", error);
                  throw new Error(error); // to roll back
                });
            })
            .catch(error => {
              //console.log(error);

              ResponseSender.sendDBError(res, "Couldn't Add yaka", error);
              throw new Error(error); // to roll back
            });

        });
    }
    // else {
    //   ResponseSender.sendSuccess(res, "Fabric was added successfully", "result", metas);
    // }
  })
    .catch(error => {
      switch (type) {
        case "general":
          ResponseSender.sendDBError(res, "Couldn't Add Category", error);
          break;
        case "fabric":
          ResponseSender.sendDBError(res, "Couldn't Add Fabric", error);
          break;
        case "accessory":
          ResponseSender.sendDBError(res, "Couldn't Add accessory", error);
          break;
        case "akmam":
          ResponseSender.sendDBError(res, "Couldn't Add akmam", error);
          break;
        case "betana":
          ResponseSender.sendDBError(res, "Couldn't Add betana", error);
          break;
        case "zarzour":
          ResponseSender.sendDBError(res, "Couldn't Add zarzour", error);
          break;
        case "yaka":
          ResponseSender.sendDBError(res, "Couldn't Add yaka", error);
          break;

      }
    })

}
module.exports = router;
