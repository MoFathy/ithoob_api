const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const multer = require("multer");
const path = require("path");
const Jimp = require("jimp");
const FtpDeploy = require("ftp-deploy");
var ftpDeploy = new FtpDeploy();
const { FTPconfig } = require("../../config/keys");

const models = require("../../models");
const productController = require("../../controller/productController");
const homeController = require("../../controller/homeController");
const Quantity = require("../../models/quantity");
const {
  Product,
  CategoryRelationship,
  CategoryMetaRelationship,
  ProductCategoryRelationship,
  ProductCategoryRelationshipImage,
  Category,
  ProductStock,
  sequelize,
} = models;
const passport = require("passport");
var { fullUrl } = require("../../config/keys");
var tmpUrl = "./";

const diskStorage = multer.diskStorage({
  destination: "./tmp",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
var config = FTPconfig;
// const storage = multer.diskStorage({
//   // destination: "http://ithoob2.web-keyz.com/)uploads",
//   destination: "./public/uploads",
//   filename: function(req, file, cb) {
//     cb(
//       null,
//       file.fieldname + "-" + Date.now() + path.extname(file.originalname)
//     );
//   }
// });

router.post(
  "/edit-product-amount",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (!req.body.productId || !req.body.amount) {
      return res.status(200).json({
        status: false,
        message: "Please add productId and amount",
      });
    }
    if (req.body.options && req.body.options.length > 0) {
      console.log("====================================");
      console.log(req.body.options);
      console.log("====================================");

      models.Quantity.destroy({
        where: { product_id: req.body.productId },
      }).then((prod) => {
        req.body.options.forEach((item) => {
          let selectedColorId =
            item.color != null && item.color.id != "" && item.color.id != null
              ? Number(item.color.id)
              : item.shoesColor &&
                item.shoesColor.id != null &&
                item.shoesColor.id != ""
              ? Number(item.shoesColor.id)
              : null;
          console.log("====================================");
          console.log(selectedColorId);
          console.log("====================================");
          models.Quantity.create({
            product_id: req.body.productId,
            color_id: selectedColorId,
            fabric_id:
              item.fabric != null &&
              item.fabric.id != "" &&
              item.fabric.id != null
                ? Number(item.fabric.id)
                : null,
            size_id:
              item.size != null && item.size.id != "" && item.size.id != null
                ? Number(item.size.id)
                : null,
            quantity:
              item.quantity != "" && item.quantity != null
                ? Number(item.quantity)
                : null,
          });
        });
      });
    }
    ProductStock.findOne({
      where: {
        product_id: req.body.productId,
      },
    })
      .then((result) => {
        if (result) {
          result
            .update({ value: req.body.amount })
            .then(() => {
              res.status(200).json({
                status: true,
              });
            })
            .catch((err) => {
              //console.log("FAIL")
              //console.log(err)
              res.status(200).json({
                status: false,
                message: "loading in editing stock",
              });
            });
        } else {
          ProductStock.create({
            value: req.body.amount,
            product_id: req.body.productId,
          })
            .then(() => {
              res.status(200).json({
                status: true,
              });
            })
            .catch((err) => {
              //console.log("FAIL")
              //console.log(err)
              res.status(200).json({
                status: false,
                message: "loading in editing stock",
              });
            });
        }
        //console.log("SUCCESS")
      })
      .catch((err) => {
        //console.log("FAIL")
        //console.log(err)
        res.status(200).json({
          status: false,
          message: "loading in editing stock",
        });
      });
  }
);

router.post(
  "/product-list/:categorySlug",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (!req.body.pageSize || !req.body.pageIndex) {
      return res.status(200).json({
        status: false,
        message: "please add pageSize and pageIndex parameters",
      });
    }
    var limit = req.body.pageSize;
    var index = req.body.pageIndex;
    var offset = limit * (index - 1);
    var categoryArray = [];

    CategoryMetaRelationship.findOne({
      where: {
        value: req.params.categorySlug,
      },

      include: [
        { model: models.CategoryMeta, as: "Meta", where: { type: "slug" } },
        {
          model: models.Category,
          as: "Category",
          include: [{ model: models.Category, as: "Children" }],
        },
      ],
    })
      .then((result) => {
        if (result.Category.Children.length > 0) {
          if (result.Category.available) categoryArray.push(result.Category.id);
          result.Category.Children.map((child) => {
            if (child.available) categoryArray.push(child.id);
          });
        } else {
          if (result.Category.available) categoryArray.push(result.Category.id);
        }
        //console.log(categoryArray);
        productController
          .getProducts(
            categoryArray,
            offset,
            limit,
            res,
            req.body.language,
            true
          )
          .then((response) => {
            res.status(200).json({ status: true, products: response.products });
          })
          .catch((err) => {
            //console.log(err);

            res.status(200).json({
              status: false,
              message: "Error in loading product list",
            });
          });
      })
      .catch((err) => {
        //console.log(err);

        res.status(200).json({
          status: false,
          message: "Error in loading product list",
        });
      });
  }
);

router.post(
  "/product-details/:slug",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    var productFetch = Product.findOne({
      where: {
        available: true,
        slug: req.params.slug,
      },
      include: [
        //   {model: models.ProductMeta, as: "Metas"},
        //   {
        //     model: models.CategoryRelationship,
        //     as: "CategoryRelations",
        //     include: [
        //       {
        //         model: models.Category,
        //         as: "Children",
        //         include: [{model: models.CategoryMeta, as: "Metas"}]
        //       },
        //       {
        //         model: models.Category,
        //         as: "Parents",
        //         // include: [{ model: models.CategoryMeta, as: "Metas" }]
        //       },
        //       {
        //         model: models.ProductCategoryRelationship,
        //         as: "ProductCategoryRelations",
        //         include: [
        //           {model: models.ProductCategoryRelationshipImage, as: "Image"}
        //         ]
        //       }
        //     ]
        // },
        // {
        //   model: models.Category,
        //   as: "Category",
        //   include: [
        //     {model: models.CategoryMeta, as: "Metas"},
        //     {
        //       model: models.Category,
        //       as: "Parents",
        //       include: [{model: models.CategoryMeta, as: "Metas"}]
        //     }
        //   ]
        // },
        { association: "Stock" },
      ],
    })
      .then((product) => {
        if (!product) {
          return res.send(200).json({
            status: false,
            message: "This product is not available",
          });
        }
        let queries = [];
        queries.push(models.ProductMeta.findAll()); // 0
        queries.push(models.ProductMetaRelationship.findAll()); // 1
        queries.push(models.Category.findAll({ where: { available: true } })); // 2
        queries.push(models.CategoryRelationship.findAll()); // 3
        queries.push(models.CategoryMeta.findAll()); // 4
        queries.push(null); // 5
        // queries.push(models.CategoryMetaOption.findAll())            // 5
        queries.push(models.CategoryMetaRelationship.findAll()); // 6
        queries.push(
          models.ProductCategoryRelationship.findAll({
            where: { product_id: product.id },
          })
        ); // 7
        queries.push(models.ProductCategoryRelationshipImage.findAll()); // 8
        queries.push(
          models.Quantity.findAll({ where: { product_id: product.id } })
        ); // 9
        queries.push(models.Size.findAll()); // 10
        queries.push(models.Fabric.findAll()); // 11
        queries.push(
          models.CategoryRelationship.findAll({
            where: {
              type: "fabric",
            },
            include: [{ association: "Children", where: { type: "color" } }],
          })
        ); //12
        queries.push(models.ShoeColor.findAll()); // 13
        Promise.all(queries)
          .then((resultsOfQueries) => {
            let productMetas = resultsOfQueries[0],
              productMetaRelationships = resultsOfQueries[1],
              allCategories = resultsOfQueries[2],
              allCategoryRelations = resultsOfQueries[3].filter((iIt) => {
                return (
                  allCategories.find((jIt) => {
                    return jIt.id == iIt.parent_id;
                  }) &&
                  allCategories.find((jIt) => {
                    return jIt.id == iIt.child_id;
                  })
                );
              }),
              allCategoryMetas = resultsOfQueries[4],
              // allCategoryMetaOptions           = resultsOfQueries[5],
              allCategoryMetaRelationships = resultsOfQueries[6],
              productCategoryRelationships = resultsOfQueries[7],
              productCategoryRelationshipImage = resultsOfQueries[8];
            (stocks = resultsOfQueries[9]),
              (sizes = resultsOfQueries[10]),
              (fabrics = resultsOfQueries[11]),
              (color_for_stock = resultsOfQueries[12]),
            shoes_colors = resultsOfQueries[13];

            for (
              let myCatIndex = 0;
              myCatIndex < allCategories.length;
              myCatIndex++
            ) {
              let myMetas = [];
              for (
                let myMetaIndex = 0;
                myMetaIndex < allCategoryMetas.length;
                myMetaIndex++
              ) {
                for (
                  let myCatMetaRelIndex = 0;
                  myCatMetaRelIndex < allCategoryMetaRelationships.length;
                  myCatMetaRelIndex++
                ) {
                  if (
                    allCategoryMetaRelationships[myCatMetaRelIndex]
                      .category_meta_id == allCategoryMetas[myMetaIndex].id &&
                    allCategoryMetaRelationships[myCatMetaRelIndex]
                      .category_id == allCategories[myCatIndex].id
                  ) {
                    myMetas.push({
                      ...allCategoryMetas[myMetaIndex].dataValues,
                      category_meta_relationship: {
                        ...allCategoryMetaRelationships[myCatMetaRelIndex]
                          .dataValues,
                      },
                    });
                  }
                }
              }
              allCategories[myCatIndex] = {
                ...allCategories[myCatIndex].dataValues,
                Metas: [...myMetas],
              };
            }

            product.Metas = productMetas;
            product.Metas.forEach((j) => {
              j.product_meta_relationship = productMetaRelationships.find(
                (i) => {
                  return (
                    i.product_id == product.id && i.product_meta_id == j.id
                  );
                }
              );
            });

            product.CategoryRelations = allCategoryRelations.filter((i) => {
              return productCategoryRelationships.find((j) => {
                return j.category_rel_id == i.id;
              });
            });
            product.CategoryRelations.forEach((i) => {
              i.Parents = allCategories.find((j) => {
                return j.id == i.parent_id;
              });
              i.Children = allCategories.find((j) => {
                return j.id == i.child_id;
              });
              i.ProductCategoryRelations = productCategoryRelationships.filter(
                (j) => {
                  return j.category_rel_id == i.id;
                }
              );
              i.ProductCategoryRelations.forEach((k) => {
                k.Image = productCategoryRelationshipImage.find((j) => {
                  return j.product_cat_rel_id == k.id;
                });
              });
            });
            product.Category = allCategories.find((i) => {
              return i.id == product.category_id;
            });
            product.Category.Parents = allCategoryRelations.filter((j) => {
              return product.Category.id == j.child_id;
            });
            product.Category.Parents = allCategories.filter((j) => {
              return product.Category.Parents.find((i) => {
                return i.parent_id == j.id;
              });
            });

            let titleKey = req.body.language == 1 ? "title_en" : "title";
            let nameKey = req.body.language == 1 ? "name_en" : "name";
            let descriptionKey =
              req.body.language == 1 ? "description_en" : "description";
            let subTitleKey =
              req.body.language == 1 ? "sub_title_en" : "sub_title";
            var discount = product.price_discount
              ? Math.round(
                  ((product.price - product.price_discount) / product.price) *
                    100
                )
              : 0;
            var productCatMeta = {};
            product.Category.Metas.map((meta) => {
              productCatMeta[meta.type] = meta.category_meta_relationship.value;
            });
            var colors = [];
            var accessories = [];
            var betanas = [];
            var groups = [];
            var options_stock = [];
            stocks.forEach((qnt) => {
              var obj = {
                size: null,
                color: null,
                fabric: null,
                shoesColor: null,
                quantity: qnt.quantity,
              };
              sizes.forEach((size) => {
                if (qnt.quantity > 0 && size.id == qnt.size_id) {
                  obj.size = { id: size.id, name_en: size.name_en };
                }
              });
              fabrics.forEach((fabric) => {
                if (qnt.quantity > 0 && fabric.id == qnt.fabric_id) {
                  obj.fabric = { id: fabric.id, name_en: fabric.name_en };
                }
              });
              // console.log('====================================');
              // console.log(shoes_colors);
              // console.log('====================================');
              shoes_colors.forEach((color) => {
                if (qnt.quantity > 0 && color.id == qnt.color_id) {
                  obj.shoesColor = {
                    id: color.id,
                    name_en: color.name_en,
                    image: color.image,
                  };
                }
              });
              if (qnt.quantity > 0) {
                let sotockcolors = color_for_stock.filter((colCatRel) => {
                  return colCatRel.id == qnt.color_id;
                });
                if (sotockcolors && sotockcolors.length > 0) {
                  let stocKat = allCategories.filter((cat) => {
                    return cat.id == sotockcolors[0].child_id;
                  });
                  let colorImg = allCategoryMetaRelationships.filter((img) => {
                    return img.category_id == stocKat[0].id;
                  });
                  obj.color = {
                    img: colorImg[0].value,
                    id: sotockcolors[0].id,
                  };
                }
              }
              options_stock.push(obj);
            });
            console.log("====================================");
            console.log(options_stock);
            console.log("====================================");
            product.CategoryRelations.map((relation) => {
              let img;
              // abdo shouldn't this be color
              if (relation.Children) {
                relation.Children.Metas.map((meta) =>
                  meta.type == "image"
                    ? (img = meta.category_meta_relationship.value)
                    : null
                );
              }
              const productCatRelation = relation.ProductCategoryRelations.find(
                (rel) => rel.product_id === product.id
              );

              if (relation.type === "fabric") {
                //console.log("relation");
                //console.log(productCatRelation);

                colors.push({
                  id: relation.id,
                  name: relation.Children[nameKey],
                  default: productCatRelation.default,
                  productImg: productCatRelation.Image.image,
                  productLargeImg: productCatRelation.Image.large_image,
                  img: img,
                });
              } else if (relation.type === "accessory") {
                accessories.push({
                  id: relation.id,
                  name: relation.Children[nameKey],
                  img,
                  default: productCatRelation.default,
                });
              } else if (relation.type === "betana") {
                betanas.push({
                  id: relation.id,
                  name: relation.Children[nameKey],
                  img,
                  default: productCatRelation.default,
                });
              }
            });

            res.status(200).json({
              status: true,
              productDetails: {
                images: [
                  {
                    img: product.image,
                    thumbImg: product.Metas.find(
                      (meta) => meta.type == "image_thumb"
                    )
                      ? product.Metas.find((meta) => meta.type == "image_thumb")
                          .product_meta_relationship
                        ? product.Metas.find(
                            (meta) => meta.type == "image_thumb"
                          ).product_meta_relationship.value
                        : undefined
                      : "",
                    largeImg: product.Metas.find(
                      (meta) => meta.type == "image_large"
                    )
                      ? product.Metas.find((meta) => meta.type == "image_large")
                          .product_meta_relationship
                        ? product.Metas.find(
                            (meta) => meta.type == "image_large"
                          ).product_meta_relationship.value
                        : undefined
                      : "",
                  },
                  {
                    img: product.image_2,
                    thumbImg: product.Metas.find(
                      (meta) => meta.type == "image_2_thumb"
                    )
                      ? product.Metas.find(
                          (meta) => meta.type == "image_2_thumb"
                        ).product_meta_relationship
                        ? product.Metas.find(
                            (meta) => meta.type == "image_2_thumb"
                          ).product_meta_relationship.value
                        : undefined
                      : "",
                    largeImg: product.Metas.find(
                      (meta) => meta.type == "image_2_large"
                    )
                      ? product.Metas.find(
                          (meta) => meta.type == "image_2_large"
                        ).product_meta_relationship
                        ? product.Metas.find(
                            (meta) => meta.type == "image_2_large"
                          ).product_meta_relationship.value
                        : undefined
                      : "",
                  },
                  {
                    img: product.image_3,
                    thumbImg: product.Metas.find(
                      (meta) => meta.type == "image_3_thumb"
                    )
                      ? product.Metas.find(
                          (meta) => meta.type == "image_3_thumb"
                        ).product_meta_relationship
                        ? product.Metas.find(
                            (meta) => meta.type == "image_3_thumb"
                          ).product_meta_relationship.value
                        : undefined
                      : "",
                    largeImg: product.Metas.find(
                      (meta) => meta.type == "image_3_large"
                    )
                      ? product.Metas.find(
                          (meta) => meta.type == "image_3_large"
                        ).product_meta_relationship
                        ? product.Metas.find(
                            (meta) => meta.type == "image_3_large"
                          ).product_meta_relationship.value
                        : undefined
                      : "",
                  },
                  {
                    img: product.image_4,
                    thumbImg: product.Metas.find(
                      (meta) => meta.type == "image_4_thumb"
                    )
                      ? product.Metas.find(
                          (meta) => meta.type == "image_4_thumb"
                        ).product_meta_relationship
                        ? product.Metas.find(
                            (meta) => meta.type == "image_4_thumb"
                          ).product_meta_relationship.value
                        : undefined
                      : "",
                    largeImg: product.Metas.find(
                      (meta) => meta.type == "image_4_large"
                    )
                      ? product.Metas.find(
                          (meta) => meta.type == "image_4_large"
                        ).product_meta_relationship
                        ? product.Metas.find(
                            (meta) => meta.type == "image_4_large"
                          ).product_meta_relationship.value
                        : undefined
                      : "",
                  },
                ],
                options_stock: options_stock,
                type: product.Metas.find((meta) => meta.type == "type")
                  ? product.Metas.find((meta) => meta.type == "type")
                      .product_meta_relationship
                    ? product.Metas.find((meta) => meta.type == "type")
                        .product_meta_relationship.value
                    : undefined
                  : "",
                type_en: product.Metas.find((meta) => meta.type == "type_en")
                  ? product.Metas.find((meta) => meta.type == "type_en")
                      .product_meta_relationship
                    ? product.Metas.find((meta) => meta.type == "type_en")
                        .product_meta_relationship.value
                    : undefined
                  : "",
                season: product.Metas.find((meta) => meta.type == "season")
                  ? product.Metas.find((meta) => meta.type == "season")
                      .product_meta_relationship
                    ? product.Metas.find((meta) => meta.type == "season")
                        .product_meta_relationship.value
                    : undefined
                  : "",
                season_en: product.Metas.find(
                  (meta) => meta.type == "season_en"
                )
                  ? product.Metas.find((meta) => meta.type == "season_en")
                      .product_meta_relationship
                    ? product.Metas.find((meta) => meta.type == "season_en")
                        .product_meta_relationship.value
                    : undefined
                  : "",
                productId: product.id,
                title_en: product.title_en,
                title: product.title,
                sub_title_en: product.sub_title_en,
                sub_title: product.sub_title,
                sku: product.sku,
                price: product.price,
                sale_price: product.price_discount,
                // sizeType: sizeable, shoes, accessories
                sizeType: productCatMeta.sizeType
                  ? productCatMeta.sizeType
                  : null,
                // Price: product.price+" "+priceUnit,
                slug: product.slug,
                stock_amount:
                  // if parent category stock is product and product has stock
                  product.Category.Parents[0].Metas &&
                  product.Category.Parents[0].Metas.find(
                    (meta) => meta.type == "stock_type"
                  ) &&
                  product.Category.Parents[0].Metas &&
                  product.Category.Parents[0].Metas.find(
                    (meta) => meta.type == "stock_type"
                  ).category_meta_relationship.value == "product" &&
                  product.Stock
                    ? product.Stock.value
                    : // if parent category stock is product and product has no stock

                    product.Category.Parents[0].Metas &&
                      product.Category.Parents[0].Metas.find(
                        (meta) => meta.type == "stock_type"
                      ) &&
                      product.Category.Parents[0].Metas &&
                      product.Category.Parents[0].Metas.find(
                        (meta) => meta.type == "stock_type"
                      ).category_meta_relationship.value == "product"
                    ? 0
                    : undefined,
                colors: colors,
                accessories,
                betanas,
                measurementsTable: product.Category.Metas.find(
                  (meta) => meta.type == "measurement-table"
                )
                  ? product.Category.Metas.find(
                      (meta) => meta.type == "measurement-table"
                    ).category_meta_relationship.value
                  : product.Category.Parents[0].Metas
                  ? product.Category.Parents[0].Metas.find(
                      (meta) => meta.type == "measurement-table"
                    )
                    ? product.Category.Parents[0].Metas.find(
                        (meta) => meta.type == "measurement-table"
                      ).category_meta_relationship.value
                    : undefined
                  : undefined,
                category: product.Category
                  ? { id: product.Category.id, name: product.Category.name }
                  : null,
                tags: {
                  isRecommended: product.is_recommended,
                  isBestSeller: product.is_best_seller,
                  isLatest: product.is_last,
                  discount: discount,
                },
              },
            });
          })
          .catch((err) => {
            //console.log(err);
            res.status(200).json({
              status: false,
              message: "Error in loading product details",
            });
          });
      })
      .catch((err) => {
        //console.log(err);
        res.status(200).json({
          status: false,
          message: "Error in loading product details",
        });
      });
  }
);

function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);
  // const fieldnames = [
  //   "product_image",
  //   "product_yaka_image",
  //   "product_akmam_image",
  //   "product_zarzour_image"
  // ];
  // if(!mimetype || !extname){
  //   return cb('Error: Images Only!');

  // } else if(!fieldnames.includes(file.fieldname)){
  //   cb('Error: enter all required images!');

  // } else if(mimetype && extname) {
  //   return cb(null,true);
  // }
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    return cb("Error: Images Only!");
  }
}

// Init Upload
const upload = multer({
  // storage: storageUpload,
  // dest:"tmp",
  storage: diskStorage,
  limits: { fileSize: 1000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).fields([
  {
    name: "product_image",
    maxCount: 1,
  },
  {
    name: "product_yaka_image",
    maxCount: 1,
  },
  {
    name: "product_zarzour_image",
    maxCount: 1,
  },
  {
    name: "product_akmam_image",
    maxCount: 1,
  },
]);
const get_thumb_normal = (file) => {
  var fileType = file.mimetype
    ? file.mimetype.split("image/").join("")
    : file.split(new RegExp(".(png|jpg|jpeg|gif|webp)$"))[1];
  var fileType2 = fileType;
  if (fileType == "jpeg" || fileType == ".jpeg") {
    fileType = "jpg";
  }
  fileType = "." + fileType;
  fileType2 = "." + fileType2;
  var newFilePath = file.path
    ? file.path.split(fileType2).join("")
    : file.split(fileType2).join("");
  var thumbFilePath = newFilePath + "-thumb";
  var normalFilePath = newFilePath + "-normal";
  thumbFilePath += fileType;
  normalFilePath += fileType;
  //console.log(thumbFilePath)
  return { thumb: thumbFilePath, normal: normalFilePath };
};
const processImage = (
  item,
  index,
  req,
  product,
  metas,
  thumbStart,
  largeStart,
  normalWidth
) => {
  var file;
  var updating = {};
  var creating = {};
  switch (index) {
    case 0:
      file = "product_image";
      break;
    case 1:
      file = "product_yaka_image";
      break;
    case 2:
      file = "product_akmam_image";
      updating = { image_3: normalFilePath };
      break;
    case 3:
      file = "product_zarzour_image";
      updating = { image_3: normalFilePath };
      break;
    default:
      file = "product_image";
      updating = { image: normalFilePath };
      break;
  }

  var fileName = get_thumb_normal(req.files[file][0]);
  var thumbFilePath = fileName["thumb"];
  var normalFilePath = fileName["normal"];
  // process for thumb and normal
  item
    .resize(350, normalWidth) // resize
    .quality(100) // set JPEG quality
    .write(normalFilePath);

  item
    .resize(81, 61) // resize
    .quality(100) // set JPEG quality
    .write(thumbFilePath);

  // var fullUrl = req.protocol + '://' + req.get('host') ;

  creating = [
    {
      product_id: product.id,
      product_meta_id: metas[thumbStart].id,
      value: fullUrl + thumbFilePath.replace("tmp\\", "").replace("tmp/", ""),
    },
    {
      product_id: product.id,
      product_meta_id: metas[largeStart].id,
      value:
        fullUrl +
        req.files[file][0].path.replace("tmp\\", "").replace("tmp/", ""),
    },
  ];
  normalFilePath =
    fullUrl + normalFilePath.replace("tmp\\", "").replace("tmp/", "");
  if (index === 0) {
    updating = {
      image: normalFilePath.replace("tmp\\", "").replace("tmp/", ""),
    };
  } else if (index === 1) {
    updating = {
      image_2: normalFilePath.replace("tmp\\", "").replace("tmp/", ""),
    };
  } else if (index === 2) {
    updating = {
      image_3: normalFilePath.replace("tmp\\", "").replace("tmp/", ""),
    };
  } else if (index === 3) {
    updating = {
      image_4: normalFilePath.replace("tmp\\", "").replace("tmp/", ""),
    };
  }
  product
    .update({
      ...updating,
    })
    .then(() => {
      models.ProductMetaRelationship.bulkCreate([...creating]);
    });
};

const processColorImg = (img) => {
  //console.log('in processColorImg', img)
  return Jimp.read(img).then((colorImage) => {
    var filePath = get_thumb_normal(img);
    var thumbFilePath = filePath.thumb;

    //console.log('tmp', thumbFilePath.replace(fullUrl, 'tmp/'))
    return colorImage
      .resize(350, 520)
      .quality(100)
      .write(thumbFilePath.replace(fullUrl, "tmp/"));
  });
};

router.post(
  "/add-product",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    //console.log('start');

    // if (!req.body.stockId) {
    //   return res.status(200).json({
    //     status: false,
    //     message: "please add fabricId"
    //   });
    // }
    var metasValues = "";
    var productValue = "";
    var categoryMetas = {};
    var type_season_meta = "";
    upload(req, res, (err) => {
      if (err) {
        //console.log(err);
        res.json({
          status: false,
          message: err,
        });
      } else {
        //console.log(req.body);
        if (!req.body.title) {
          return res.status(200).json({
            status: false,
            message: "please add title",
          });
        }
        if (!req.body.title_en) {
          return res.status(200).json({
            status: false,
            message: "please add title_en",
          });
        }
        // if (!req.body.sub_title) {
        //   return res.status(200).json({
        //     status: false,
        //     message: "please add sub_title"
        //   });
        // }
        // if (!req.body.sub_title_en) {
        //   return res.status(200).json({
        //     status: false,
        //     message: "please add sub_title_en"
        //   });
        // }
        if (!req.body.price) {
          return res.status(200).json({
            status: false,
            message: "please add price",
          });
        }
        if (!req.body.sale_price) {
          return res.status(200).json({
            status: false,
            message: "please add sale_price",
          });
        }
        if (!req.body.sku) {
          return res.status(200).json({
            status: false,
            message: "please add sku",
          });
        }
        if (!req.body.category_id) {
          return res.status(200).json({
            status: false,
            message: "please add category_id",
          });
        }
        //console.log('before promise')
        Promise.all([
          Product.findAll({
            where: {
              slug: { [Op.like]: `%${req.body.title_en.replace(" ", "")}%` },
            },
          }),
          Category.findOne({
            where: { id: req.body.category_id },
            include: [
              { association: "Parents", include: [{ association: "Metas" }] },
            ],
          }),
        ]).then((results) => {
          const products = results[0];
          const category = results[1];
          sequelize
            .transaction((t) => {
              return Product.create(
                {
                  title: req.body.title,
                  title_en: req.body.title_en,
                  sub_title: req.body.sub_title,
                  sub_title_en: req.body.sub_title_en,
                  price: req.body.price,
                  sku: req.body.sku,
                  price_discount: req.body.sale_price,
                  category_id: req.body.category_id,
                  is_last: req.body.is_last,
                  is_recommended: req.body.is_recommended,
                  is_best_seller: req.body.is_best_seller,

                  slug:
                    products.length > 0
                      ? req.body.title_en.replace(" ", "") +
                        "-" +
                        (Number(products.length) + 1)
                      : req.body.title_en.replace(" ", ""),
                },
                { transaction: t }
              ).then((product) => {
                productValue = product;
                if (
                  req.body.options_stock &&
                  JSON.parse(req.body.options_stock).length > 0
                ) {
                  JSON.parse(req.body.options_stock).forEach((item) => {
                    let selectedColorId =
                      item.color != null && item.color != ""
                        ? Number(item.color)
                        : item.shoeColor != null && item.shoeColor != ""
                        ? Number(item.shoeColor)
                        : null;
                    models.Quantity.create({
                      product_id: product.id,
                      color_id: selectedColorId,
                      fabric_id: item.fabric != "" ? Number(item.fabric) : null,
                      size_id: item.size != "" ? Number(item.size) : null,
                      quantity:
                        item.quantity != "" ? Number(item.quantity) : null,
                    });
                  });
                }
                console.log("error happened here after quantity =======");

                category.Parents[0].Metas.forEach((meta) => {
                  categoryMetas[meta.type] =
                    meta.category_meta_relationship.value;
                });

                req.body.fabrics = req.body.fabrics
                  ? JSON.parse(req.body.fabrics)
                  : null;
                req.body.accessories = req.body.accessories
                  ? JSON.parse(req.body.accessories)
                  : null;
                req.body.betanas = req.body.betanas
                  ? JSON.parse(req.body.betanas)
                  : null;

                let defaultFabricExists = false,
                  defaultAccessoryExists = false,
                  defaultBetanaExists = false;
                if (req.body.fabrics) {
                  req.body.fabrics.forEach((fabric, index) => {
                    if (fabric.default == true) defaultFabricExists = true;
                    else if (
                      index == req.body.fabrics.length - 1 &&
                      !defaultFabricExists
                    )
                      fabric.default = true;
                  });
                }
                if (req.body.accessories) {
                  req.body.accessories.forEach((accessory, index) => {
                    if (accessory.default == true)
                      defaultAccessoryExists = true;
                    else if (
                      index == req.body.accessories.length - 1 &&
                      !defaultAccessoryExists
                    )
                      accessory.default = true;
                  });
                }
                if (req.body.betanas) {
                  req.body.betanas.forEach((betana, index) => {
                    if (betana.default == true) defaultBetanaExists = true;
                    else if (
                      index == req.body.betanas.length - 1 &&
                      !defaultBetanaExists
                    )
                      betana.default = true;
                  });
                }

                // const addStock =
                //   req.body.stockId && categoryMetas.stock_type == "fabric"
                //     ? FabricStock.findOne({ where: { id: req.body.stockId } })
                //     : null;
                const addFabrics = [];
                const fabricImages = [];
                req.body.fabrics && req.body.fabrics.length > 0
                  ? req.body.fabrics.map((fabric) => {
                      //console.log('fabric', fabric)
                      addFabrics.push(
                        models.ProductCategoryRelationship.create(
                          {
                            category_rel_id: fabric.id,
                            default: fabric.default,
                            product_id: product.id,
                          },
                          { transaction: t }
                        )
                      );
                      fabricImages.push(processColorImg(fabric.img[0]));
                    })
                  : null;
                //console.log('before processColorImg')
                const addAcessories = [];
                req.body.accessories && req.body.accessories.length > 0
                  ? req.body.accessories.map((accessory) =>
                      addAcessories.push(
                        models.ProductCategoryRelationship.create(
                          {
                            category_rel_id: accessory.id,
                            default: accessory.default,
                            product_id: product.id,
                          },
                          { transaction: t }
                        )
                      )
                    )
                  : null;

                const addBetanas = [];
                req.body.betanas && req.body.betanas.length > 0
                  ? req.body.betanas.map((betana) =>
                      addBetanas.push(
                        models.ProductCategoryRelationship.create(
                          {
                            category_rel_id: betana.id,
                            default: betana.default,
                            product_id: product.id,
                          },
                          { transaction: t }
                        )
                      )
                    )
                  : null;
                return Promise.all([
                  // Jimp.read(fullUrl+req.files.product_image[0].path),
                  // req.files.product_yaka_image
                  //   ? Jimp.read(fullUrl+req.files.product_yaka_image[0].path)
                  //   : null,
                  // req.files.product_akmam_image
                  //   ? Jimp.read(fullUrl+req.files.product_akmam_image[0].path)
                  //   : null,
                  // req.files.product_zarzour_image
                  //   ? Jimp.read(fullUrl+req.files.product_zarzour_image[0].path)
                  //   : null,
                  // addStock,
                  ...addFabrics,
                  ...fabricImages,
                  ...addAcessories,
                  ...addBetanas,
                ]).then((result) => {
                  const creats = [];
                  result.map((relationship, index) => {
                    if (typeof relationship.getWidth == "undefined") {
                      // this is promise of category relation
                      //console.log('relation', req.body.fabrics)
                      //console.log('index', index)
                      if (req.body.fabrics && req.body.fabrics[index]) {
                        //console.log('index2', req.body.fabrics[index])
                        var filePath = get_thumb_normal(
                          req.body.fabrics[index].img[0]
                        );
                        var thumbFilePath = filePath.thumb;
                        creats.push({
                          image: thumbFilePath
                            .replace("tmp\\", "")
                            .replace("tmp/", ""),
                          large_image: req.body.fabrics[index].img[0],
                          product_cat_rel_id: relationship.dataValues.id,
                        });
                      }
                    }
                  });
                  models.ProductCategoryRelationshipImage.bulkCreate(
                    [...creats],
                    { updateOnDuplicate: true },
                    { transaction: t }
                  );

                  // const requiredStock = result[4];
                  const assignStock =
                    // requiredStock && categoryMetas.stock_type == "fabric"
                    //   ? product.setFabric(requiredStock, { transaction: t })
                    //   :
                    req.body.stockAmount &&
                    categoryMetas.stock_type == "product"
                      ? product.createStock(
                          { value: req.body.stockAmount },
                          { transaction: t }
                        )
                      : null;
                  const ProductMeta = (type) =>
                    models.ProductMeta.findOne(
                      {
                        where: {
                          type: type,
                        },
                      },
                      { transaction: t }
                    );
                  return Promise.all([
                    ProductMeta("image_thumb"),
                    ProductMeta("image_2_thumb"),
                    ProductMeta("image_3_thumb"),
                    ProductMeta("image_4_thumb"),
                    ProductMeta("image_large"),
                    ProductMeta("image_2_large"),
                    ProductMeta("image_3_large"),
                    ProductMeta("image_4_large"),
                    assignStock,
                    ProductMeta("season_en"),
                    ProductMeta("season"),
                    ProductMeta("type_en"),
                    ProductMeta("type"),
                  ]).then((promises) => {
                    metasValues = promises;

                    // add product meta type, season
                    type_season_meta = [
                      {
                        product_id: productValue.id,
                        product_meta_id: promises[9].id,
                        value: req.body.season_en,
                      },
                      {
                        product_id: productValue.id,
                        product_meta_id: promises[10].id,
                        value: req.body.season,
                      },
                      {
                        product_id: productValue.id,
                        product_meta_id: promises[11].id,
                        value: req.body.type_en,
                      },
                      {
                        product_id: productValue.id,
                        product_meta_id: promises[12].id,
                        value: req.body.type,
                      },
                    ];
                  });
                });
              });
            })
            .then((all) => {
              var thumbStart = 0;
              var largeStart = 4;
              return Promise.all([
                Jimp.read(tmpUrl + req.files.product_image[0].path),
                req.files.product_yaka_image
                  ? Jimp.read(tmpUrl + req.files.product_yaka_image[0].path)
                  : null,
                req.files.product_akmam_image
                  ? Jimp.read(tmpUrl + req.files.product_akmam_image[0].path)
                  : null,
                req.files.product_zarzour_image
                  ? Jimp.read(tmpUrl + req.files.product_zarzour_image[0].path)
                  : null,
                models.ProductMetaRelationship.bulkCreate([
                  ...type_season_meta,
                ]),
              ]).then((images) => {
                images.map((item, index) => {
                  if (item && typeof item.getWidth != "undefined") {
                    if (categoryMetas.stock_type == "fabric") {
                      processImage(
                        item,
                        index,
                        req,
                        productValue,
                        metasValues,
                        thumbStart,
                        largeStart,
                        520
                      );
                    } else {
                      processImage(
                        item,
                        index,
                        req,
                        productValue,
                        metasValues,
                        thumbStart,
                        largeStart,
                        350
                      );
                    }
                  }

                  thumbStart += 1;
                  largeStart += 1;
                  if (index == images.length - 1) {
                    try {
                      return ftpDeploy
                        .deploy(config)
                        .then(() => {
                          //console.log('delete')
                          // if(req.files.product_image)
                          // {
                          //   let fileName = get_thumb_normal(req.files.product_image[0]);
                          //   let thumbFilePath = fileName["thumb"]
                          //   let normalFilePath = fileName["normal"]
                          //   fs.rmdirSync('/tmp/'+thumbFilePath);
                          //   fs.rmdirSync('/tmp/'+normalFilePath);
                          // }
                          // if(req.files.product_yaka_image){
                          //   let fileName = get_thumb_normal(req.files.product_yaka_image[0]);
                          //   let thumbFilePath = fileName["thumb"]
                          //   let normalFilePath = fileName["normal"]
                          //   fs.rmdirSync('/tmp/'+thumbFilePath);
                          //   fs.rmdirSync('/tmp/'+normalFilePath);
                          // }
                          // if(req.files.product_akmam_image){
                          //   let fileName = get_thumb_normal(req.files.product_akmam_image[0]);
                          //   let thumbFilePath = fileName["thumb"]
                          //   let normalFilePath = fileName["normal"]
                          //   fs.rmdirSync('/tmp/'+thumbFilePath);
                          //   fs.rmdirSync('/tmp/'+normalFilePath);
                          // }
                          // if(req.files.product_zarzour_image){
                          //   let fileName = get_thumb_normal(req.files.product_zarzour_image[0]);
                          //   let thumbFilePath = fileName["thumb"]
                          //   let normalFilePath = fileName["normal"]
                          //   fs.rmdirSync('/tmp/'+thumbFilePath);
                          //   fs.rmdirSync('/tmp/'+normalFilePath);
                          // }
                          return res.status(200).json({
                            status: true,
                          });
                        })
                        .catch((err) => {
                          //console.log(err);
                          return res.status(200).json({
                            status: false,
                            message: "Error : fail in upload images",
                          });
                        });
                    } catch (err) {
                      //console.log('error catch', err)
                      return res.status(200).json({
                        status: false,
                        message: "Error : fail in upload images",
                      });
                    }
                  }
                });
              });
            })
            .catch((err) => {
              //console.error(err);
              res.status(200).json({
                status: false,
                error: err,
              });
            });
        });
      }
    });
  }
);

const multerUpload = multer({
  // storage: storageUpload,
  // dest:"tmp",
  storage: diskStorage,
  limits: { fileSize: 1000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).fields([{ name: "product_image", maxCount: 1 }]);

// upload image then create different size
router.post(
  "/uploadProductImg",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    multerUpload(req, res, (err) => {
      if (err) {
        //console.log('error', err)
        res.json({
          status: false,
          message: "error",
        });
      } else {
        if (req.files == undefined) {
          res.status(200).json({
            status: false,
            message: "Error: No File Selected!",
          });
        } else {
          // get this product
          const ProductMeta = (type) =>
            models.ProductMeta.findOne({
              where: {
                type: type,
              },
            });
          return Promise.all([
            ProductMeta(req.body.metaType + "_thumb"),
            ProductMeta(req.body.metaType + "_large"),
            models.Product.findOne({ where: { id: req.body.productId } }),
          ])
            .then((promises) => {
              var product = promises[2];
              //jimp read image then resize

              return Jimp.read(tmpUrl + req.files.product_image[0].path)
                .then((item) => {
                  // process img

                  var updating = {};
                  var creating = {};

                  var fileName = get_thumb_normal(req.files.product_image[0]);
                  var thumbFilePath = fileName["thumb"];
                  var normalFilePath = fileName["normal"];
                  var imgHeight;
                  var categoryMetas = [];
                  // get category type, if fabric image height will be else will be
                  Category.findOne({
                    where: { id: product.category_id },
                    include: [
                      {
                        association: "Parents",
                        include: [{ association: "Metas" }],
                      },
                    ],
                  })
                    .then((category) => {
                      category.Parents[0].Metas.forEach((meta) => {
                        categoryMetas[meta.type] =
                          meta.category_meta_relationship.value;
                      });

                      // Athwab takes 520px height, while other products takes 350px
                      if (categoryMetas.stock_type == "fabric") {
                        imgHeight = 520;
                      } else {
                        imgHeight = 350;
                      }

                      /**
                       * We need "large_image" as well as thumb & normal image
                       * It works when Adding A New Product...
                       * But it doesn't work when Editing An Existing Product...
                       *
                       * IWA-1276, the issue isn't related to product colors. But it's because the product colors has been updated before,
                       * and the "Update/Edit" functionality doesn't generate "Large_image" which causes the non-zooming issue
                       */

                      // process for thumb and normal

                      item
                        .resize(350, imgHeight) // resize
                        .quality(100) // set JPEG quality
                        .write(normalFilePath);

                      item
                        .resize(81, 61) // resize
                        .quality(100) // set JPEG quality
                        .write(thumbFilePath);
                      //console.log('thumbFilePath', normalFilePath)

                      creating = [
                        {
                          product_id: req.body.productId,
                          product_meta_id: promises[0].id,
                          value:
                            fullUrl +
                            thumbFilePath
                              .replace("tmp\\", "")
                              .replace("tmp/", ""),
                        },
                        {
                          product_id: req.body.productId,
                          product_meta_id: promises[1].id,
                          value:
                            fullUrl +
                            req.files.product_image[0].path
                              .replace("tmp\\", "")
                              .replace("tmp/", ""),
                        },
                      ];
                      normalFilePath =
                        fullUrl +
                        normalFilePath.replace("tmp\\", "").replace("tmp/", "");
                      updating[req.body.metaType] = normalFilePath;
                      return Promise.all([
                        product.update({
                          ...updating,
                        }),
                        models.ProductMetaRelationship.bulkCreate(
                          [...creating],
                          { updateOnDuplicate: true }
                        ),
                        ftpDeploy.deploy(config),
                      ])
                        .then(() => {
                          return res.status(200).json({
                            status: true,
                            message: "File Uploaded!",
                            sources: normalFilePath,
                          });
                        })
                        .catch((err) => {
                          console.log(err);
                        });
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                })
                .catch((err) => {
                  console.log(err);
                });
            })
            .catch((err) => {
              console.log(err);
            });
        }
      }
    });
  }
);

router.post(
  "/product/accessories",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (req.body.search && req.body.search.length > 0) {
      models.CategoryRelationship.findAll({
        where: {
          type: "accessory",
        },
        limit: 5,
        include: [
          {
            association: "Children",
            where: {
              [Op.or]: [
                {
                  name_en: {
                    [Op.regexp]: req.body.search.replace(
                      /[-[\]{}()*+?.,\\^$|#\s]/g,
                      "\\$&"
                    ),
                  },
                },
                {
                  name: {
                    [Op.regexp]: req.body.search.replace(
                      /[-[\]{}()*+?.,\\^$|#\s]/g,
                      "\\$&"
                    ),
                  },
                },
              ],
            },
            include: [{ association: "Metas" }],
          },
        ],
      }).then((accessories) => {
        res.status(200).json({
          status: true,
          accessories: accessories.map((acc) => {
            var metaObject = {};
            acc.Children.Metas.map((i) => {
              metaObject[i.type] = i.category_meta_relationship.value;
            });
            return {
              id: acc.id,
              name: acc.Children.name,
              name_en: acc.Children.name_en,
              img: metaObject.image,
            };
          }),
        });
      });
    } else {
      models.CategoryRelationship.findAll({
        where: {
          type: "accessory",
        },
        include: [
          { association: "Children", include: [{ association: "Metas" }] },
        ],
      }).then((accessories) => {
        res.status(200).json({
          status: true,
          accessories: accessories.map((acc) => {
            var metaObject = {};
            acc.Children.Metas.map((i) => {
              metaObject[i.type] = i.category_meta_relationship.value;
            });
            return {
              id: acc.id,
              name: acc.Children.name,
              name_en: acc.Children.name_en,
              img: metaObject.image,
            };
          }),
        });
      });
    }
  }
);

router.post(
  "/product/betanas",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (req.body.search && req.body.search.length > 0) {
      models.CategoryRelationship.findAll({
        where: {
          type: "betana",
        },
        limit: 5,
        include: [
          {
            association: "Children",
            where: {
              [Op.or]: [
                {
                  name_en: {
                    [Op.regexp]: req.body.search.replace(
                      /[-[\]{}()*+?.,\\^$|#\s]/g,
                      "\\$&"
                    ),
                  },
                },
                {
                  name: {
                    [Op.regexp]: req.body.search.replace(
                      /[-[\]{}()*+?.,\\^$|#\s]/g,
                      "\\$&"
                    ),
                  },
                },
              ],
            },
            include: [{ association: "Metas" }],
          },
        ],
      }).then((betanas) => {
        betanas = betanas.filter((betana) => {
          return betana.Children.available;
        });

        res.status(200).json({
          status: true,
          betanas: betanas.map((betana) => {
            var metaObject = {};
            betana.Children.Metas.map((i) => {
              metaObject[i.type] = i.category_meta_relationship.value;
            });
            return {
              id: betana.id,
              name: betana.Children.name,
              name_en: betana.Children.name_en,
              img: metaObject.image,
            };
          }),
        });
      });
    } else {
      models.CategoryRelationship.findAll({
        where: {
          type: "betana",
        },
        include: [
          { association: "Children", include: [{ association: "Metas" }] },
        ],
      }).then((betanas) => {
        betanas = betanas.filter((betana) => {
          return betana.Children.available;
        });

        res.status(200).json({
          status: true,
          betanas: betanas.map((betana) => {
            var metaObject = {};
            betana.Children.Metas.map((i) => {
              metaObject[i.type] = i.category_meta_relationship.value;
            });
            return {
              id: betana.id,
              name: betana.Children.name,
              name_en: betana.Children.name_en,
              img: metaObject.image,
            };
          }),
        });
      });
    }
  }
);

router.post(
  "/selectableproducts/accessories",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    models.Category.findAll({
      where: {
        available: true,
      },
    })
      .then((results) => {
        mainCategory = results.find((i) => {
          return i.type == "accessory";
        });
        if (!mainCategory) {
          throw new Error();
        }
        //console.log(mainCategory);
        models.CategoryRelationship.findAll({
          where: { parent_id: mainCategory.id },
          include: [{ association: "Children" }],
        })
          .then((accessoryCategories) => {
            accessoryCategories = accessoryCategories.filter((jId) => {
              return results.find((i) => {
                return i.id == jId.child_id;
              });
            });
            //console.log(accessoryCategories);
            let accessoriesQuery = [];

            accessoryCategories.forEach((accessoryCategory) => {
              accessoriesQuery.push(
                models.CategoryRelationship.findAll({
                  where: { parent_id: accessoryCategory.child_id },
                  include: [
                    {
                      association: "Children",
                      include: [{ association: "Metas" }],
                    },
                  ],
                })
              );
            });

            Promise.all(accessoriesQuery)
              .then((accessories) => {
                let resultsArr = [];
                accessoryCategories.forEach((one) => {
                  resultsArr.push({ category: one.Children, children: [] });
                });
                //console.log(accessories);
                let accessoriesWithDetails = [];
                accessories.forEach((acc) => {
                  acc.forEach((innerAcc) => {
                    accessoriesWithDetails.push(innerAcc);
                  });
                });
                res.status(200).json({
                  status: true,
                  accessories: (function () {
                    let unAvailable = [];

                    let newArr = accessoriesWithDetails.map(
                      (accessoryWithDetails) => {
                        let image = "";
                        accessoryWithDetails.Children.Metas.map((i) => {
                          if (i.type == "image")
                            image = i.category_meta_relationship.value;
                        });
                        if (!accessoryWithDetails.Children.available) {
                          unAvailable.push(accessoryWithDetails.id);
                        }
                        return {
                          parent_id: accessoryWithDetails.parent_id,
                          id: accessoryWithDetails.id,
                          name: accessoryWithDetails.Children.name,
                          name_en: accessoryWithDetails.Children.name_en,
                          img: image,
                        };
                      }
                    );
                    newArr = newArr.filter((itx) => {
                      return !(
                        unAvailable.findIndex((itx2) => {
                          return itx2 == itx.id;
                        }) >= 0
                      );
                    });
                    resultsArr.forEach((oneRes) => {
                      oneRes.children = newArr.filter((oneacc) => {
                        return oneacc.parent_id == oneRes.category.id;
                      });
                    });
                    return resultsArr;
                  })(),
                });
              })
              .catch((err) => {
                //console.log(err);
                res.send(500).json({
                  err,
                  status: false,
                });
              });
          })
          .catch((err) => {
            //console.log(err);
            res.send(500).json({
              err,
              status: false,
            });
          });
      })
      .catch((err) => {
        //console.log(err);
        res.send(500).json({
          err,
          status: false,
        });
      });
  }
);

router.post(
  "/selectableproducts/betanas",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    models.Category.findOne({
      where: {
        type: "betana",
        available: true,
      },
    })
      .then((mainCategory) => {
        //console.log(mainCategory);
        models.CategoryRelationship.findAll({
          where: { parent_id: mainCategory.id },
          include: [
            {
              model: models.Category,
              as: "Children",
              include: [
                {
                  association: "Metas",
                  as: "Metas",
                },
              ],
            },
          ],
        })
          .then((betanaWithDetails) => {
            //console.log(betanaWithDetails);
            res.status(200).json({
              status: true,
              betanas: (function () {
                let unAvailable = [];
                let newArr = betanaWithDetails.map((betanaWithDetails) => {
                  let image = "";
                  betanaWithDetails.Children.Metas.map((i) => {
                    if (i.type == "image")
                      image = i.category_meta_relationship.value;
                  });
                  if (!betanaWithDetails.Children.available) {
                    unAvailable.push(betanaWithDetails.id);
                  }
                  return {
                    id: betanaWithDetails.id,
                    name: betanaWithDetails.Children.name,
                    name_en: betanaWithDetails.Children.name_en,
                    img: image,
                  };
                });
                return newArr.filter((itx) => {
                  return !(
                    unAvailable.findIndex((itx2) => {
                      return itx2 == itx.id;
                    }) >= 0
                  );
                });
              })(),
            });
          })
          .catch((err) => {
            //console.log(err);
            res.send(500).json({
              err,
              status: false,
            });
          });
      })
      .catch((err) => {
        //console.log(err);
        res.send(500).json({
          err,
          status: false,
        });
      });
  }
);

// router.post(
//   "/upload-product-color",
//   passport.authenticate("jwt-admin", { session: false }),
//   (req, res) => {
//     fabricUpload(req, res, err => {

//       if (err) {
//         //console.log(err);
//         res.json({
//           status: false,
//           message: "error"
//         });
//       } else {
//         if (req.files == undefined) {
//           res.status(200).json({
//             status: false,
//             message: "Error: No File Selected!"
//           });
//         } else {
//           if (!req.files.image) {
//             return res.status(200).json({
//               status: false,
//               message: "no image attached"
//             });
//           }
//           // var fullUrl = req.protocol + '://' + req.get('host') ;
//           // const fullUrl = " https://www.ithoob-heroku.herokuapp.com/";
//         const fullUrl = 'https://ithoobapi.web-keyz.com';

//           Jimp.read(req.files.image[0].path)
//             .then(colorImage => {
//               var fileType = req.files.image[0].mimetype
//                 .split("image/")
//                 .join("");
//               if (fileType == "jpeg") {
//                 fileType = "jpg";
//               }
//               fileType = "." + fileType;
//               var newFilePath = req.files.image[0].path
//                 .split(fileType)
//                 .join("");
//               var thumbFilePath = newFilePath + "-normal";
//               thumbFilePath += fileType;

//               Promise.all([
//                 colorImage
//                   .resize(Jimp.AUTO, 400)
//                   .quality(100)
//                   .write(thumbFilePath)
//               ]).then(results => {
//                 // //console.log(productCatRel[0][0]);
//                 res.status(200).json({
//                   status: true,
//                   image: fullUrl + thumbFilePath,
//                   large_image: fullUrl + req.files.image[0].path
//                 });
//               });
//             })
//             .catch(err => {
//               //console.log(err);
//               res.status(200).json({
//                 status: false,
//                 messgae: "error in reading image file"
//               });
//             });
//         }
//       }
//     });
//   }
// );

router.post("/colors", (req, res) => {
  let nameKey = req.body.language == 1 ? "name_en" : "name";

  Promise.all([
    CategoryRelationship.findAll({
      where: {
        type: "fabric",
      },
      include: [{ association: "Children", where: { type: "color" } }],
    }),

    Category.findAll({ where: { available: true } }),
  ])
    .then((results) => {
      colors = results[0].filter((colCatRel) => {
        return (
          results[1].find((cat) => {
            return cat.id == colCatRel.child_id;
          }) &&
          results[1].find((cat) => {
            return cat.id == colCatRel.parent_id;
          })
        );
      });
      res.status(200).json({
        status: true,
        colors: colors.map((color) => {
          return {
            id: color.id,
            name: color.Children[nameKey],
          };
        }),
      });
    })
    .catch((err) => {
      //console.log(err);
      res.status(200).json({
        status: false,
      });
    });
});

const colorUpload = multer({
  storage: diskStorage,
  limits: { fileSize: 1000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).fields([{ name: "image", maxCount: 1 }]);

// const fabricUpload = multer({
//   storage: ftp,
//   limits: { fileSize: 1000000 },
//   fileFilter: function(req, file, cb) {
//     checkFileType(file, cb);
//   }
// }).fields([{ name: "image", maxCount: 1 }]);
router.post(
  "/add-product-color",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    //console.log(req)
    var thumbFilePath = "";
    colorUpload(req, res, (err) => {
      //console.log('in there');
      if (!req.body.productId || !req.body.colorId) {
        return res.status(200).json({
          status: false,
          message: "please add both product id and color id",
        });
      }
      const productId = Number(req.body.productId);
      if (!req.files.image) {
        return res.status(200).json({
          status: false,
          message: "no image attached",
        });
      }
      if (err) {
        //console.log(err);
        res.json({
          status: false,
          message: err,
        });
      } else {
        ProductCategoryRelationship.findOne({
          where: {
            category_rel_id: req.body.colorId,
            product_id: productId,
          },
        })
          .then((productCatRel) => {
            if (productCatRel) {
              return res.status(200).json({
                status: false,
                message: "product already has this color",
              });
            }

            Jimp.read(tmpUrl + req.files.image[0].path).then((colorImage) => {
              var fileType = req.files.image[0].mimetype
                .split("image/")
                .join("");
              if (fileType == "jpeg") {
                fileType = "jpg";
              }
              fileType = "." + fileType;
              var newFilePath = req.files.image[0].path
                .split(fileType)
                .join("");
              thumbFilePath = newFilePath + "-normal";
              thumbFilePath += fileType;
              CategoryRelationship.findAll({
                where: {
                  type: "fabric",
                },
                attributes: ["id"],
              }).then((fabricPast) => {
                Promise.all([
                  Product.findOne({
                    where: {
                      id: productId,
                    },
                  }),
                  // CategoryRelationship.findOne({
                  //   where: {
                  //     id: req.body.colorId
                  //   }
                  // }),
                  ProductCategoryRelationship.update(
                    {
                      default: false,
                    },
                    {
                      where: {
                        product_id: productId,
                        category_rel_id: {
                          [Op.in]: fabricPast.map((fabric) => fabric.id),
                        },
                      },
                    }
                  ),
                  colorImage.resize(350, 520).quality(100).write(thumbFilePath),
                  ftpDeploy.deploy(config),
                  // 	Jimp.AUTO,function(err, buffer){
                  // 	// //console.log('streamifier')
                  // 	// var thumbStream = streamifier.createReadStream(buffer);
                  // 	// //console.log(thumbStream)
                  // 	// colorUpload(thumbStream, res, err => {
                  // 	//
                  // 	// 	//console.log('in colorupload')
                  // 	// })
                  // })
                ]).then((results) => {
                  // fs.rmdirSync('/tmp/'+thumbFilePath);
                  // 			ftpDeploy.deploy(config)
                  // .then(res => //console.log('finished:', res))
                  // .catch(err => //console.log(err))
                  // 					var dataImg = {file:{}};
                  // 					dataImg.file['image'] = './tmp/'+thumbFilePath;
                  //

                  // const catRel = results[1];
                  return models.sequelize
                    .transaction((t) => {
                      return ProductCategoryRelationship.create(
                        {
                          product_id: productId,
                          category_rel_id: req.body.colorId,
                          default: req.body.default ? true : false,
                        },
                        { transaction: t }
                      ).then((resultedRelation) => {
                        return resultedRelation.createImage(
                          {
                            image:
                              fullUrl +
                              thumbFilePath
                                .replace("tmp\\", "")
                                .replace("tmp/", ""),
                            large_image:
                              fullUrl +
                              req.files.image[0].path
                                .replace("tmp\\", "")
                                .replace("tmp/", ""),
                          },
                          { transaction: t }
                        );
                      });
                    })
                    .then((result) => {
                      // //console.log(result)
                      res.status(200).json({
                        status: true,
                        image: result.dataValues.image,
                      });
                    });
                });
              });
            });
          })
          .catch((err) => {
            //console.log(err);
            res.status(200).json({
              status: false,
              messgae: "error in reading image file",
            });
          });
      }
    });
  }
);

router.post(
  "/add-product-accessories",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (!req.body.productId || !req.body.accessories) {
      return res.status(200).json({
        status: false,
        message: "please add both product id and accessories",
      });
    }
    if (req.body.accessories.length === 0) {
      //console.log("heeeeeeeeereeeeeeee");
      return CategoryRelationship.findAll({
        where: {
          type: "accessory",
        },
        attributes: ["id"],
      })
        .then((accessoryPast) => {
          return ProductCategoryRelationship.destroy({
            where: {
              product_id: req.body.productId,
              category_rel_id: {
                [Op.in]: accessoryPast.map((acc) => acc.id),
              },
            },
          });
        })
        .then((result) => {
          res.status(200).json({
            status: true,
          });
        })
        .catch((err) => {
          //console.log(err);
          res.status(200).json({
            status: false,
          });
        });
    }
    CategoryRelationship.findAll({
      where: {
        type: "accessory",
      },
      attributes: ["id"],
    })
      .then((accessoryPast) => {
        Promise.all([
          Product.findOne({
            where: {
              id: req.body.productId,
            },
          }),
          ProductCategoryRelationship.destroy({
            where: {
              product_id: req.body.productId,
              category_rel_id: {
                [Op.in]: accessoryPast.map((acc) => acc.id),
              },
            },
          }),
          CategoryRelationship.findAll({
            where: {
              id: {
                [Op.in]: req.body.accessories.map((acc) => acc.id),
              },
            },
          }),
        ]).then((results) => {
          const product = results[0];
          const rels = results[2];
          return sequelize
            .transaction((t) => {
              return product
                .addCategoryRelations(
                  rels,
                  // transaction: t
                  { transaction: t }
                )
                .then(() => {
                  return ProductCategoryRelationship.update(
                    {
                      default: true,
                    },
                    {
                      where: {
                        category_rel_id: {
                          [Op.in]: req.body.accessories
                            .filter((acc) => {
                              return acc.default;
                            })
                            .map((acc) => acc.id),
                        },
                      },
                      transaction: t,
                    }
                    // { transaction: t }
                  );
                });
            })
            .then((result) => {
              res.status(200).json({
                status: true,
              });
            })
            .catch((err) => {
              //console.log(err);
              res.status(200).json({
                status: false,
              });
            });
        });
      })
      .catch((err) => {
        //console.log(err);
        res.status(200).json({
          status: false,
        });
      });
  }
);

router.post(
  "/add-product-betanas",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (!req.body.productId || !req.body.betanas) {
      return res.status(200).json({
        status: false,
        message: "please add both product id and betanas",
      });
    }
    CategoryRelationship.findAll({
      where: {
        type: "betana",
      },
      attributes: ["id"],
    })
      .then((betanaPast) => {
        Promise.all([
          Product.findOne({
            where: {
              id: req.body.productId,
            },
          }),
          ProductCategoryRelationship.destroy({
            where: {
              product_id: req.body.productId,
              category_rel_id: {
                [Op.in]: betanaPast.map((betana) => betana.id),
              },
            },
          }),
          CategoryRelationship.findAll({
            where: {
              id: req.body.betanas.map((betana) => betana.id),
            },
          }),
        ]).then((results) => {
          const product = results[0];
          //console.log("esults[1]");
          //console.log(results[1]);
          const rels = results[2];
          return sequelize
            .transaction((t) => {
              return product
                .addCategoryRelations(rels, { transaction: t })
                .then(() => {
                  return ProductCategoryRelationship.update(
                    {
                      default: true,
                    },
                    {
                      where: {
                        category_rel_id: req.body.defaultId,
                      },
                      transaction: t,
                    }
                  );
                });
            })
            .then((result) => {
              res.status(200).json({
                status: true,
              });
            })
            .catch((err) => {
              //console.log(err);
              res.status(200).json({
                status: false,
              });
            });
        });
      })
      .catch((err) => {
        //console.log(err);
        res.status(200).json({
          status: false,
        });
      });
  }
);

router.post(
  "/edit-product",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (req.body.price_discount == "") {
      req.body.price_discount = null;
    }
    // this API to update product info, either in main table or in meta table
    if (!req.body.productId) {
      return res.status(200).json({
        status: false,
        message: "please add a specific product id",
      });
    }
    var updateProps = { ...req.body };

    if (req.body.meta) {
      // update product meta
      var creating = {};

      const ProductMeta = (type) =>
        models.ProductMeta.findOne({
          where: {
            type: type,
          },
        });
      return ProductMeta(req.body.meta)
        .then((metas) => {
          creating = [
            {
              product_id: req.body.productId,
              product_meta_id: metas.id,
              value: req.body[req.body.meta],
            },
          ];

          return models.ProductMetaRelationship.bulkCreate([...creating], {
            updateOnDuplicate: true,
          })
            .then(() => {
              return res.status(200).json({
                status: true,
                message: "product update successfully",
              });
            })
            .catch((err) => {
              //console.log(err);
              res.status(200).json({
                status: false,
                error: err,
              });
            });
        })
        .catch((err) => {
          //console.log(err);
          res.status(200).json({
            status: false,
            error: err,
          });
        });
    } else {
      // update product table
      delete updateProps.productId;
      Product.update(updateProps, {
        where: {
          id: req.body.productId,
        },
      })
        .then((result) => {
          //console.log(result);
          res.status(200).json({
            status: true,
            message: "product update successfully",
          });
        })
        .catch((err) => {
          //console.log(err);
          res.status(200).json({
            status: false,
            error: err,
          });
        });
    }
  }
);

router.post(
  "/edit-product-category",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (!req.body.productId || !req.body.categoryId) {
      return res.status(200).json({
        status: false,
        message: "please add a specific product id",
      });
    }
    Promise.all([
      Category.findOne({
        where: {
          id: req.body.categoryId,
        },
      }),
      Product.findOne({
        where: {
          id: req.body.productId,
        },
      }),
    ])
      .then((results) => {
        const category = results[0];
        const product = results[1];
        if (!product) {
          return res.status(200).json({
            status: false,
            message: "no product with this product id",
          });
        }
        if (!category) {
          return res.status(200).json({
            status: false,
            message: "no category with this category id",
          });
        }
        return product.setCategory(category).then((result) => {
          res.status(200).json({
            status: true,
            message: "product update successfully",
          });
        });
      })

      .catch((err) => {
        //console.log(err);
        res.status(200).json({
          status: false,
        });
      });
  }
);

router.post(
  "/edit-product-color",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    var thumbFilePath = "";
    colorUpload(req, res, (err) => {
      if (!req.body.productId || !req.body.colorId) {
        return res.status(200).json({
          status: false,
          message: "please add both product id and color id",
        });
      }
      if (!req.files.image) {
        return res.status(200).json({
          status: false,
          message: "no image attached",
        });
      }
      if (err) {
        //console.log(err);
        res.json({
          status: false,
          message: err,
        });
      } else {
        ProductCategoryRelationship.findOne({
          where: {
            category_rel_id: req.body.colorId,
            product_id: req.body.productId,
          },
        }).then((productCatRel) => {
          // if (productCatRel) {
          //   return res.status(200).json({
          //     status: false,
          //     message: "product already has this color"
          //   });
          // }
          if (!req.files.image) {
            return res.status(200).json({
              status: false,
              message: "no image attached",
            });
          }

          processColorImg(tmpUrl + req.files.image[0].path)
            .then((colorImage) => {
              var filePath = get_thumb_normal(req.files.image[0]);
              var thumbFilePath = filePath.thumb;
              ftpDeploy.deploy(config).then((results) => {
                // fs.rmdirSync('/tmp/'+thumbFilePath);
                return models.sequelize
                  .transaction((t) => {
                    // //console.log(productCatRel[0][0]);
                    return Promise.all(
                      [
                        ProductCategoryRelationshipImage.update(
                          {
                            image:
                              fullUrl +
                              thumbFilePath
                                .replace("tmp\\", "")
                                .replace("tmp/", "")
                                .replace(".jpg", ""),
                            large_image:
                              fullUrl +
                              req.files.image[0].path
                                .replace("tmp\\", "")
                                .replace("tmp/", ""),
                          },
                          {
                            where: { product_cat_rel_id: productCatRel.id },
                            transaction: t,
                          }
                        ),
                      ],
                      productCatRel.update(
                        {
                          default: req.body.default,
                        },
                        { transaction: t }
                      )
                    );
                  })
                  .then((results) => {
                    // //console.log(result)
                    const imageResult = results[0];
                    res.status(200).json({
                      status: true,
                      image:
                        fullUrl +
                        thumbFilePath
                          .replace("tmp\\", "")
                          .replace("tmp/", "")
                          .replace(".jpg", ""),
                    });
                  })
                  .catch((err) => {
                    //console.log(err);
                    res.status(200).json({
                      status: false,
                    });
                  });
              });
            })
            .catch((err) => {
              //console.log(err);
              res.status(200).json({
                status: false,
                messgae: "error in reading image file",
              });
            });
        });
      }
    });
  }
);

router.post(
  "/delete-product",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (!req.body.productId) {
      return res.status(200).json({
        status: false,
        message: "please add both product",
      });
    }

    Product.update(
      { available: false },
      {
        where: {
          id: req.body.productId,
        },
      }
    )
      .then((deletedRows) => {
        // if (deletedRows > 0) {
        return res.status(200).json({
          status: true,
        });
        // } else {
        // return res.status(200).json({
        // status: false
        // });
        // }
      })
      .catch((err) => {
        //console.log(err);
        res.status(200).json({
          status: false,
        });
      });
  }
);

router.post(
  "/delete-product-color",
  passport.authenticate("jwt-admin", { session: false }),
  (req, res) => {
    if (!req.body.productId || !req.body.colorId) {
      return res.status(200).json({
        status: false,
        message: "please add both product id and color id",
      });
    }

    ProductCategoryRelationship.destroy({
      where: {
        category_rel_id: req.body.colorId,
        product_id: req.body.productId,
      },
    })
      .then((deletedRows) => {
        if (deletedRows > 0) {
          return res.status(200).json({
            status: true,
          });
        } else {
          return res.status(200).json({
            status: false,
          });
        }
      })
      .catch((err) => {
        //console.log(err);
        res.status(200).json({
          statu: false,
        });
      });
  }
);

router.post("/categories", (req, res) => {
  let titleKey = req.body.language == 1 ? "title_en" : "title";
  let nameKey = req.body.language == 1 ? "name_en" : "name";
  Category.findOne({
    where: {
      type: "category",
      available: true,
    },
    include: [
      {
        model: models.Category,
        as: "Children",
        include: [
          {
            model: models.Category,
            as: "Children",
            include: [{ model: models.CategoryMeta, as: "Metas" }],
          },
          { model: models.CategoryMeta, as: "Metas" },
        ],
      },
      { model: models.CategoryMeta, as: "Metas" },
    ],
  })
    .then((category) => {
      category.Children = category.Children
        ? category.Children.filter((abc) => {
            return abc.available;
          })
        : [];
      category.Children.forEach((abc) => {
        abc.Children = abc.Children.filter((abcd) => {
          return abcd.available;
        });
      });
      res.status(200).json({
        categories: category.Children.map((main) => {
          var metaObject = {};
          main.Metas.forEach((meta) => {
            metaObject[meta.type] = meta.category_meta_relationship.value;
          });
          return {
            mainCategory: main[nameKey],
            categoryId: main.id,
            ...metaObject,
            filterTitle: req.body.language == 1 ? main.title_en : main.title,
            subCategory: main.Children.map((sub) => {
              var metaObject = {};
              sub.Metas.forEach((meta) => {
                metaObject[meta.type] = meta.category_meta_relationship.value;
              });
              return {
                categoryId: sub.id,
                name: sub[nameKey],
                ...metaObject,
              };
            }),
          };
        }),
        status: true,
      });
    })
    .catch((err) => {
      //console.log(err);
      res.status(200).json({
        status: false,
        message: "Error in loading categories",
      });
    });
});

module.exports = router;
