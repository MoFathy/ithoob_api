const express = require("express");
const router = express.Router();

const models = require("../models");
const Sequelize = require("sequelize");

const Category = models.Category;
const CategoryMeta = models.CategoryMeta;
const CategoryRelationship = models.CategoryRelationship;
const Op = Sequelize.Op;

router.post("/fabrics", (req, res) => {
  var fabricFetch = Category.findAll({
    where: {
      type: "fabric",
      available: true
    },
    include: [
      {
        model: models.Category,
        as: "Children",
        include: [
          {
            model: models.Category,
            as: "Children",
            include: [
              {
                model: models.Category,
                as: "Children",
                include: [
                  {
                    model: models.Category,
                    as: "Children",
                    include: [{ model: models.CategoryMeta, as: "Metas" }]
                  },
                  { model: models.CategoryMeta, as: "Metas" }
                ]
              },
              { model: models.CategoryMeta, as: "Metas" }
            ]
          },
          { model: models.CategoryMeta, as: "Metas" }
        ]
      },
      { model: models.CategoryMeta, as: "Metas" }
    ]
  })
  var productFetch = models.Product.findOne({
    where:{
      id: {
        $in: Sequelize.literal('(SELECT `id` FROM `Products` WHERE `Product`.`id` = (SELECT `product_id` FROM `product_meta_relationships` WHERE `product_meta_relationships`.`product_meta_id` = (SELECT `id` FROM `product_meta` WHERE `product_meta`.`type` = "customized")))')
      },
    },
    include: [{model: models.ProductMeta,as: 'Metas'}, {association: 'Category', include: [{association: 'Metas'}]}]
  })
    Promise.all([fabricFetch,productFetch]).then(responses => {
      responses[0].forEach((lvl0)=>{
        lvl0.Children = lvl0.Children?lvl0.Children.filter((itx)=>{return itx.available}):[];

        lvl0.Children.forEach((lvl1)=>{
          lvl1.Children = lvl1.Children?lvl1.Children.filter((itx)=>{return itx.available}):[];

          lvl1.Children.forEach((lvl2)=>{
            lvl2.Children = lvl2.Children?lvl2.Children.filter((itx)=>{return itx.available}):[];
            
            lvl2.Children.forEach((lvl3)=>{
              lvl3.Children = lvl3.Children?lvl3.Children.filter((itx)=>{return itx.available}):[];
              
              lvl3.Children.forEach((lvl4)=>{
                lvl4.Children = lvl4.Children?lvl4.Children.filter((itx)=>{return itx.available}):[];
              })
            })
          })
        })
      })
      var fabrics = responses[0];
      var product = responses[1];
      var productCatMeta = {}
      product.Category.Metas.map(meta => {
        productCatMeta[meta.type] =
          meta.category_meta_relationship.value;
      })
      let titleKey = req.body.language == 1 ? "title_en" : "title";
      let nameKey = req.body.language == 1 ? "name_en" : "name";
      let descriptionkey =
        req.body.language == 1 ? "description_en" : "description";

      res.status(200).json({
        status: true,
        "product-details": {
          cost: product.price_discount || product.price,
          id: product.id,
          title: product[titleKey],
          title_en: product.title_en,
          title_ar: product.title,
          slug: product.slug,
          sizeType: productCatMeta.sizeType ? productCatMeta.sizeType : null ,
          measurementsTable: product.Category.Metas.find(meta=>meta.type == "measurement-table") ? product.Category.Metas.find(meta=>meta.type == "measurement-table").category_meta_relationship.value : product.Category.Parents[0].Metas ? product.Category.Parents[0].Metas.find(meta=>meta.type == "measurement-table") ? product.Category.Parents[0].Metas.find(meta=>meta.type == "measurement-table").category_meta_relationship.value : undefined : undefined,
          stockType: "fabric",
          title_en: product.title_en,
          images: [{
            img:product.image,
            thumbImg: product.Metas.find((meta)=>meta.type=="image_thumb") ? product.Metas.find((meta)=>meta.type=="image_thumb").product_meta_relationship.value : "",
            largeImg: product.Metas.find((meta)=>meta.type=="image_large") ? product.Metas.find((meta)=>meta.type=="image_large").product_meta_relationship.value : ""
          }, {
            img:product.image_2,
            thumbImg: product.Metas.find((meta)=>meta.type=="image_2_thumb") ? product.Metas.find((meta)=>meta.type=="image_2_thumb").product_meta_relationship.value : "",
            largeImg: product.Metas.find((meta)=>meta.type=="image_2_large") ? product.Metas.find((meta)=>meta.type=="image_2_large").product_meta_relationship.value : ""
          }, {
            img:product.image_3,
            thumbImg: product.Metas.find((meta)=>meta.type=="image_3_thumb") ? product.Metas.find((meta)=>meta.type=="image_3_thumb").product_meta_relationship.value : "",
            largeImg: product.Metas.find((meta)=>meta.type=="image_3_large") ? product.Metas.find((meta)=>meta.type=="image_3_large").product_meta_relationship.value : ""
          }, {
            img:product.image_4,
            thumbImg: product.Metas.find((meta)=>meta.type=="image_4_thumb") ? product.Metas.find((meta)=>meta.type=="image_4_thumb").product_meta_relationship.value : "",
            largeImg: product.Metas.find((meta)=>meta.type=="image_4_large") ? product.Metas.find((meta)=>meta.type=="image_4_large").product_meta_relationship.value : ""
          }],
        },
        generalItems:
        fabrics.map(fabric => {
          var metaObject = {};
          fabric.Metas.forEach(meta => {
            metaObject[meta.type] = meta.category_meta_relationship.value;
          });
          return {
            id: fabric.id,
            title: fabric[titleKey],
            isTwoRow:
              metaObject.two_row == "true"
                ? true
                : metaObject.two_row == "false"
                ? false
                : undefined,
            items: fabric.Children.map(item => {
              var metaObject = {};
              item.Metas.forEach(meta => {
                metaObject[meta.type] = meta.category_meta_relationship.value;
              });
              return {
                id: item.category_relationship.id,
                name: item[nameKey],
                sub: {
                  subtitle: item[titleKey],
                  isTwoRow:
                    metaObject.two_row == "true"
                      ? true
                      : metaObject.two_row == "false"
                      ? false
                      : undefined,
                  subItems: item.Children.map(sub => {
                    var metaObject = {};
                    sub.Metas.forEach(meta => {
                      metaObject[meta.type] =
                        meta.category_meta_relationship.value;
                    });
                    return {
                      id: sub.category_relationship.id,
                      name: sub[nameKey],
                      cost: metaObject.cost,
                      image: metaObject.image,
                      "max-quantity": metaObject.max_quantity,
                      description: metaObject[descriptionkey],
                      sub: {
                        isTwoRow:
                          metaObject.two_row == "true"
                            ? true
                            : metaObject.two_row == "false"
                            ? false
                            : undefined,
                        subtitle: sub[titleKey],
                        color: sub.Children.map(subColor => {
                          var metaObject = {};
                          subColor.Metas.forEach(meta => {
                            metaObject[meta.type] =
                              meta.category_meta_relationship.value;
                          });
                          return {
                            id: subColor.category_relationship.id,
                            name: subColor[nameKey],
                            image: metaObject.image
                          };
                        })
                      }
                    };
                  })
                }
              };
            })
          }
        })
      });
    })
    .catch(err => {
      //console.log(err);
      res.status(401).json({
        status: false,
        message: "Somtheing went wrong."
      });
    });
});

router.post("/yaka", (req, res) => {
  var nameFilter = ""
  if (req.body.type == 1) nameFilter = "yaka";
  else if (req.body.type == 2) nameFilter = "zarzour";
  let titleKey = req.body.language == 1 ? "title_en" : "title";
  let nameKey = req.body.language == 1 ? "name_en" : "name";
  Category.findAll({
    where: {
      type: {
        [Op.or]: [nameFilter]
      },
      available: true
    },
    include: [
      {
        model: models.Category,
        as: "Children",
        include: [
          {
            model: models.Category,
            as: "Children",
            include: [
              { model: models.CategoryMeta, as: "Metas" },
              {
                model: models.Category,
                as: "Children",
                include: [
                  {
                    model: models.Category,
                    as: "Children",
                    include: [{ model: models.CategoryMeta, as: "Metas" }]
                  },
                  { model: models.CategoryMeta, as: "Metas" }
                ]
              }
            ]
          },
          { model: models.CategoryMeta, as: "Metas" }
        ]
      },
      { model: models.CategoryMeta, as: "Metas" }
    ]
  })
    .then(yaka => {
      yaka.forEach((lvl0)=>{
        lvl0.Children = lvl0.Children?lvl0.Children.filter((itx)=>{return itx.available}):[];

        lvl0.Children.forEach((lvl1)=>{
          lvl1.Children = lvl1.Children?lvl1.Children.filter((itx)=>{return itx.available}):[];

          lvl1.Children.forEach((lvl2)=>{
            lvl2.Children = lvl2.Children?lvl2.Children.filter((itx)=>{return itx.available}):[];
            
            lvl2.Children.forEach((lvl3)=>{
              lvl3.Children = lvl3.Children?lvl3.Children.filter((itx)=>{return itx.available}):[];
              
              lvl3.Children.forEach((lvl4)=>{
                lvl4.Children = lvl4.Children?lvl4.Children.filter((itx)=>{return itx.available}):[];
              })
            })
          })
        })
      })
      var yakas = yaka.filter(subcat => subcat.type === "yaka");
      var accessory = yaka.filter(subcat => subcat.type === "accessory");
      var betana = yaka.filter(subcat => subcat.type === "betana");
      res.status(200).json({
        status: true,
        generalItems: [
          ...yaka.filter(subcat => subcat.type === nameFilter),
          ...yaka.filter(subcat => subcat.type === "betana"),
          ...yaka.filter(subcat => subcat.type === "accessory")
        ].map(subcat => {
          //console.log('res'+subcat[titleKey]+'nameFilter'+nameFilter+req.body.type)
          var metaObject = {};
          subcat.Metas.forEach(meta => {
            metaObject[meta.type] = meta.category_meta_relationship.value;
          });
          return {
            id: subcat.id,
            title: subcat[titleKey],
						type: subcat.type,
            isTwoRow:
              metaObject.two_row == "true"
                ? true
                : metaObject.two_row == "false"
                ? false
                : undefined,

            items: subcat.Children.map(item => {
              var metaObject = {};
              item.Metas.forEach(meta => {
                metaObject[meta.type] = meta.category_meta_relationship.value;
              });
              return {
                id: item.category_relationship.id,
                name: item[nameKey],
                ...metaObject,
                isTwoRow:
                  metaObject.two_row == "true"
                    ? true
                    : metaObject.two_row == "false"
                    ? false
                    : undefined,
                withAccessory: metaObject.withAccessory == "true"
                    ? true
                    : metaObject.withAccessory == "false"
                    ? false
                    : undefined,
                sub: {
                  subtitle: item[titleKey],
                  isTwoRow:
                    metaObject.two_row == "true"
                      ? true
                      : metaObject.two_row == "false"
                      ? false
                      : undefined,
                  subItems:
                    item.Children.length > 0
                      ? item.Children.map(sub => {
                          var metaObject = {};
                          sub.Metas.forEach(meta => {
                            metaObject[meta.type] =
                              meta.category_meta_relationship.value;
                          });
                          return {
                            id: sub.category_relationship.id,
                            name: sub[nameKey],
                            // imgSrc: metaObject.image,
                            ...metaObject
                          };
                        })
                      : undefined
                }
              };
            })
          };
        })
      });
    })
    .catch(err => {
      //console.log(err);
      res.status(401).json({
        status: false,
        message: "Somtheing went wrong."
      });
    });
});

router.post("/akmam", (req, res) => {
  Category.findAll({
    where: {
      type: {
        [Op.or]: ["akmam", "accessory", "betana"]
      },
      available: true
    },
    include: [
      {
        model: models.Category,
        as: "Children",
        include: [
          {
            model: models.Category,
            as: "Children",
            include: [
              { model: models.CategoryMeta, as: "Metas" },
              {
                model: models.Category,
                as: "Children",
                include: [
                  {
                    model: models.Category,
                    as: "Children",
                    include: [{ model: models.CategoryMeta, as: "Metas" }]
                  },
                  { model: models.CategoryMeta, as: "Metas" }
                ]
              }
            ]
          },
          { model: models.CategoryMeta, as: "Metas" }
        ]
      },
      { model: models.CategoryMeta, as: "Metas" }
    ]
  })
    .then(akmams => {
      akmams.forEach((lvl0)=>{
        lvl0.Children = lvl0.Children?lvl0.Children.filter((itx)=>{return itx.available}):[];

        lvl0.Children.forEach((lvl1)=>{
          lvl1.Children = lvl1.Children?lvl1.Children.filter((itx)=>{return itx.available}):[];

          lvl1.Children.forEach((lvl2)=>{
            lvl2.Children = lvl2.Children?lvl2.Children.filter((itx)=>{return itx.available}):[];
            
            lvl2.Children.forEach((lvl3)=>{
              lvl3.Children = lvl3.Children?lvl3.Children.filter((itx)=>{return itx.available}):[];
              
              lvl3.Children.forEach((lvl4)=>{
                lvl4.Children = lvl4.Children?lvl4.Children.filter((itx)=>{return itx.available}):[];
              })
            })
          })
        })
      })
      let titleKey = req.body.language == 1 ? "title_en" : "title";
      let nameKey = req.body.language == 1 ? "name_en" : "name";
      res.status(200).json({
        status: true,

        generalItems: [
          ...akmams.filter(subcat => subcat.type === "akmam"),
          ...akmams.filter(subcat => subcat.type === "betana"),
          ...akmams.filter(subcat => subcat.type === "accessory")
        ].map(subcat => {
          var metaObject = {};
            subcat.Metas.forEach(meta => {
              metaObject[meta.type] = meta.category_meta_relationship.value;
            });
          return {
            id: subcat.id,
            title: subcat[titleKey],
						type: subcat.type,
            isTwoRow:
            metaObject.two_row == "true"
              ? true
              : metaObject.two_row == "false"
              ? false
              : undefined,

            items: subcat.Children.map(item => {
              var metaObject = {};
              item.Metas.forEach(meta => {
                metaObject[meta.type] = meta.category_meta_relationship.value;
              });

              return {
                id: item.category_relationship.id,
                name: item[nameKey],
                ...metaObject,
								isTwoRow:
                  metaObject.two_row == "true"
                    ? true
                    : metaObject.two_row == "false"
                    ? false
                    : undefined,
                withAccessory: metaObject.withAccessory == "true"
                ? true
                : metaObject.withAccessory == "false"
                ? false
                : undefined,
                sub: {
                  subtitle: item[titleKey],
                  isTwoRow:
                    metaObject.two_row == "true"
                      ? true
                      : metaObject.two_row == "false"
                      ? false
                      : undefined,
                  subItems:
                    item.Children.length > 0
                      ? item.Children.map(sub => {
                          var metaObject = {};
                          sub.Metas.forEach(meta => {
                            metaObject[meta.type] =
                              meta.category_meta_relationship.value;
                          });

                          return {
                            id: sub.category_relationship.id,
                            // name: sub[nameKey],
                            image: metaObject.image,
                            cost: metaObject.cost,
                            subSubItems: sub.Children.length > 0 ?
                                sub.Children.map(subColor => {
                                  var metaObject = {};

                                  return {
                                    id: subColor.category_relationship.id,
                                    name: subColor[nameKey],
                                    items: subColor.Children.map( subSub => {
                                      subSub.Metas.forEach(meta => {
                                        metaObject[meta.type] =
                                          meta.category_meta_relationship.value;
                                      });
                                      return {
                                        id: subSub.category_relationship.id,
                                        image: metaObject.image,
                                        name: subSub[nameKey]
                                      }
                                    })
                                  };
                                })
                                : undefined
                          };
                        })
                      : undefined
                }
              };
            })
          };
        })
      });
    })
    .catch(err => {
      //console.log(err);
      res.status(401).json({
        status: false,
        message: "Somtheing went wrong."
      });
    });
});

router.post("/others", (req, res) => {
  Category.findAll({
    where: {
      type: "others",
      available: true
    },
    include: [
      {
        model: models.Category,
        as: "Children",
        include: [
          { model: models.CategoryMeta, as: "Metas" },
          {
            model: models.Category,
            as: "Children",
            include: [
              { model: models.CategoryMeta, as: "Metas" },
              {
                model: models.Category,
                as: "Children",
                include: [
                  {
                    model: models.Category,
                    as: "Children",
                    include: [{ model: models.CategoryMeta, as: "Metas" }]
                  },
                  { model: models.CategoryMeta, as: "Metas" }
                ]
              }
            ]
          }
        ]
      },
      { model: models.CategoryMeta, as: "Metas" }
    ]
  })
    .then(others => {
      others.forEach((lvl0)=>{
        lvl0.Children = lvl0.Children?lvl0.Children.filter((itx)=>{return itx.available}):[];

        lvl0.Children.forEach((lvl1)=>{
          lvl1.Children = lvl1.Children?lvl1.Children.filter((itx)=>{return itx.available}):[];

          lvl1.Children.forEach((lvl2)=>{
            lvl2.Children = lvl2.Children?lvl2.Children.filter((itx)=>{return itx.available}):[];
            
            lvl2.Children.forEach((lvl3)=>{
              lvl3.Children = lvl3.Children?lvl3.Children.filter((itx)=>{return itx.available}):[];
              
              lvl3.Children.forEach((lvl4)=>{
                lvl4.Children = lvl4.Children?lvl4.Children.filter((itx)=>{return itx.available}):[];
              })
            })
          })
        })
      })
      let titleKey = req.body.language == 1 ? "title_en" : "title";
      let nameKey = req.body.language == 1 ? "name_en" : "name";

      let descriptionkey = req.body.language == 1 ? "description_en" : "description";
      res.status(200).json({
        status: true,
        generalItems: others.map(subcat => {
          var metaObject = {};
          subcat.Metas.forEach(meta => {
            metaObject[meta.type] = meta.category_meta_relationship.value;
          });

          return {
            id: subcat.id,
            info: Object.keys(metaObject).length > 0 ? {description: metaObject[descriptionkey], image: metaObject.image} : undefined,
            title: subcat[titleKey],
            items: subcat.Children.map(item => {
              var metaObject = {};
              item.Metas.forEach(meta => {
                metaObject[meta.type] = meta.category_meta_relationship.value;
              });

              return {
                id: item.category_relationship.id,
                name: item[nameKey],
                ...metaObject,
                sub: item.Children.length > 0 ? {
                  subtitle: item[titleKey],
                  subItems:
                     item.Children.map(sub => {
                          var metaObject = {};
                          sub.Metas.forEach(meta => {
                            metaObject[meta.type] =
                              meta.category_meta_relationship.value;
                          });

                          return {
                            id: sub.category_relationship.id,
                            name: sub[nameKey],
                            image: metaObject.image,
                            // sub: {
                            //   subtitle: sub[titleKey],
                            //   subItemz:
                            //     sub.Children.length > 0
                            //       ? sub.Children.map(subColor => {
                            //           var metaObject = {};
                            //           subColor.Metas.forEach(meta => {
                            //             metaObject[meta.type] =
                            //               meta.category_meta_relationship.value;
                            //           });
                            //           return {
                            //             id: subColor.category_relationship.id,
                            //             name: subColor[nameKey],
                            //             ...metaObject
                            //           };
                            //         })
                            //       : undefined
                            // }
                          };
                        })
                }     : undefined

              };
            })
          };
        })
      });
    })
    .catch(err => {
      //console.log(err);
      res.status(401).json({
        status: false,
        message: "Somtheing went wrong."
      });
    });
});

router.post("/fabrics2", (req, res) => {
  CategoryRelationship.findAll({
    where: {
      type: "fabrics"
    },
    order: [["parent_id", "ASC"]],
    include: [
      {
        model: models.Category,
        as: "Parents",
        include: [{ model: models.CategoryMeta, as: "Metas" }]
      }
    ]
  }).then(relations => {
    res.status(200).json({
      status: true,
      generalItems: relations.map(relation => {
        return {
          parentId: relation.parent_id,
          id: relation.id,
          name: relation.Parents.name_en
        };
      })
    });
  });
});

router.post("/categories", (req, res) => {
  let titleKey = req.body.language == 1 ? "title_en" : "title";
  let nameKey = req.body.language == 1 ? "name_en" : "name";
  const generalOptionFetch = models.GeneralOption.findAll({where: {key: {[Op.or]: ['site_title','site_description','delivery_price','man_price','tailor_extra_expenses']}}})
  const cartFetch = Category.findOne({
    where: {
      type: "category",
      available: true
    },
    include: [
      {
        model: models.Category,
        as: "Children",
        include: [
          { model: models.Category, as: "Children", include: [{ model: models.CategoryMeta, as: "Metas"}] },
          { model: models.CategoryMeta, as: "Metas" }
        ]
      },
      // { model: models.CategoryMeta, as: "Metas" }

    ]
  });
  Promise.all([cartFetch, generalOptionFetch]).then(responses => {
      // var metaObject = {};
      // category.Metas.forEach(meta => {
      //   metaObject[meta.type] =
      //     meta.category_meta_relationship.value;
      // });
      responses[0].Children = responses[0].Children ? responses[0].Children.filter((abc)=>{return abc.available}):[]
      responses[0].Children.forEach((abc)=>{
          abc.Children = abc.Children?abc.Children.filter((abcd)=>{return abcd.available}):[]
      })
      category = responses[0]
      generalOption = responses[1]
      res.status(200).json({
        siteTitle: generalOption.find(option=>option.key=="site_title") ? generalOption.find(option=>option.key=="site_title").value : "",
        siteDescription: generalOption.find(option=>option.key=="site_description") ? generalOption.find(option=>option.key=="site_description").value : "",
        deliveryPrice:generalOption.find(option=>option.key=="delivery_price") ? generalOption.find(option=>option.key=="delivery_price").value : "",
        sizeManPrice:generalOption.find(option=>option.key=="man_price") ? generalOption.find(option=>option.key=="man_price").value : "",
        sizeManExtraPrice:generalOption.find(option=>option.key=="tailor_extra_expenses") ? generalOption.find(option=>option.key=="tailor_extra_expenses").value : "",
        categories: category.Children.map(main => {
          var metaObject = {};
          main.Metas.forEach(meta => {
            metaObject[meta.type] =
              meta.category_meta_relationship.value;
          });
          return {
            mainCategory: main[nameKey],
            categoryId: main.id,
            ...metaObject,
            filterTitle:
              req.body.language == 1
                ? main.title_en
                : main.title,
            subCategory: main.Children.map(sub => {
              var metaObject = {};
              sub.Metas.forEach(meta => {
                metaObject[meta.type] =
                  meta.category_meta_relationship.value;
              });
              return {
                categoryId: sub.id,
                name: sub[nameKey],
                ...metaObject
              };
            })
          };
        }),
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

// measurement guide
router.post("/measurements-guide", (req, res) => {
  let titleKey = req.body.language == 1 ? "title_en" : "title";
  let nameKey = req.body.language == 1 ? "name_en" : "name";
  // change name categories to type categories, check with abdo
  Category.findAll({
    where: {
      type: "general",
      available: true
    },
    include: [
      {
        model: models.Category,
        as: "Children",
     },
     { model: models.CategoryMeta, as: "Metas" }
    ]
  })
    .then(category => {
      category.forEach(cat => {
        cat.Children = cat.Children ? cat.Children.filter((itx) => {return itx.available}) : []
      })
      var cats = [];
 
      category.map(item => {
        if(item.Metas.find(meta=>meta.type == "measurement-table") && item.Children.length > 0){
          cats.push({
            catTitle: item[titleKey],
            id: item.id,
            img: item.Metas.find(meta=>meta.type == "measurement-table").category_meta_relationship.value
          })
        }
      })
      res.status(200).json({
        status: true,
        cats
      })
    })
    .catch(err => {
         //console.log(err)
      res.status(401).json({
        status: false,
        message: "Error in loading header"
      });
    });
 });

 router.post("/adds", (req, res) => {
  var nameFilter = ""
  if (req.body.type == 1) nameFilter = "yaka";
  else if (req.body.type == 2) nameFilter = "zarzour";
  let titleKey = req.body.language == 1 ? "title_en" : "title";
  let nameKey = req.body.language == 1 ? "name_en" : "name";
  Category.findAll({
    where: {
      type: {
        [Op.or]: ["accessory", "betana"]
      },
      available: true
    },
    include: [
      {
        model: models.Category,
        as: "Children",
        include: [
          {
            model: models.Category,
            as: "Children",
            include: [
              { model: models.CategoryMeta, as: "Metas" },
              {
                model: models.Category,
                as: "Children",
                include: [
                  {
                    model: models.Category,
                    as: "Children",
                    include: [{ model: models.CategoryMeta, as: "Metas" }]
                  },
                  { model: models.CategoryMeta, as: "Metas" }
                ]
              }
            ]
          },
          { model: models.CategoryMeta, as: "Metas" }
        ]
      },
      { model: models.CategoryMeta, as: "Metas" }
    ]
  })
    .then(yaka => {
      yaka.forEach((lvl0)=>{
        lvl0.Children = lvl0.Children?lvl0.Children.filter((itx)=>{return itx.available}):[];

        lvl0.Children.forEach((lvl1)=>{
          lvl1.Children = lvl1.Children?lvl1.Children.filter((itx)=>{return itx.available}):[];

          lvl1.Children.forEach((lvl2)=>{
            lvl2.Children = lvl2.Children?lvl2.Children.filter((itx)=>{return itx.available}):[];
            
            lvl2.Children.forEach((lvl3)=>{
              lvl3.Children = lvl3.Children?lvl3.Children.filter((itx)=>{return itx.available}):[];
              
              lvl3.Children.forEach((lvl4)=>{
                lvl4.Children = lvl4.Children?lvl4.Children.filter((itx)=>{return itx.available}):[];
              })
            })
          })
        })
      })
      var yakas = yaka.filter(subcat => subcat.type === "yaka");
      var accessory = yaka.filter(subcat => subcat.type === "accessory");
      var betana = yaka.filter(subcat => subcat.type === "betana");
      res.status(200).json({
        status: true,
        generalItems: [
          ...yaka.filter(subcat => subcat.type === nameFilter),
          ...yaka.filter(subcat => subcat.type === "betana"),
          ...yaka.filter(subcat => subcat.type === "accessory")
        ].map(subcat => {
          //console.log('res'+subcat[titleKey]+'nameFilter'+nameFilter+req.body.type)
          var metaObject = {};
          subcat.Metas.forEach(meta => {
            metaObject[meta.type] = meta.category_meta_relationship.value;
          });
          return {
            id: subcat.id,
            title: subcat[titleKey],
						type: subcat.type,
            isTwoRow:
              metaObject.two_row == "true"
                ? true
                : metaObject.two_row == "false"
                ? false
                : undefined,

            items: subcat.Children.map(item => {
              var metaObject = {};
              item.Metas.forEach(meta => {
                metaObject[meta.type] = meta.category_meta_relationship.value;
              });
              return {
                id: item.category_relationship.id,
                name: item[nameKey],
                ...metaObject,
                isTwoRow:
                  metaObject.two_row == "true"
                    ? true
                    : metaObject.two_row == "false"
                    ? false
                    : undefined,
                withAccessory: metaObject.withAccessory == "true"
                    ? true
                    : metaObject.withAccessory == "false"
                    ? false
                    : undefined,
                sub: {
                  subtitle: item[titleKey],
                  isTwoRow:
                    metaObject.two_row == "true"
                      ? true
                      : metaObject.two_row == "false"
                      ? false
                      : undefined,
                  subItems:
                    item.Children.length > 0
                      ? item.Children.map(sub => {
                          var metaObject = {};
                          sub.Metas.forEach(meta => {
                            metaObject[meta.type] =
                              meta.category_meta_relationship.value;
                          });
                          return {
                            id: sub.category_relationship.id,
                            name: sub[nameKey],
                            // imgSrc: metaObject.image,
                            ...metaObject
                          };
                        })
                      : undefined
                }
              };
            })
          };
        })
      });
    })
    .catch(err => {
      //console.log(err);
      res.status(401).json({
        status: false,
        message: "Somtheing went wrong."
      });
    });
});

//next 3 api maybe helpful for dashboar
// router.post("/category", (req, res) => {
//   Category.create({
//     name: req.body.name,
//     name_en: req.body.name_en,
//     title: req.body.title,
//     title_en: req.body.title_en
//   })
//     .then(category => {
//       res.status(200).json({
//         status: true,
//         message: "Success"
//       });
//     })
//     .catch(err => {
//       res.status(401).json({
//         status: false,
//         message: "error"
//       });
//     });
// });

// link categories to its subs
// router.post("/link", (req, res) => {
//   Category.findOne({
//     where: {
//       id: req.body.parentId
//     }
//   })
//     .then(category => {
//       Category.findOne({
//         where: {
//           id: req.body.childId
//         }
//       })
//         .then(child => {
//           category.addChildren(child).then(() => {
//             res.status(200).json({
//               status: true,
//               message: "Success"
//             });
//           });
//         })
//         .catch(err => {
//           //console.log("error in child");
//           //console.log(err);
//         });
//     })
//     .catch(err => {
//       //console.log("error in parent");
//       //console.log(err);
//     });
// });

//link category to its meta

// router.post("/link-meta", (req, res) => {
//   Category.findOne({
//     where: {
//       id: req.body.catId
//     }
//   })
//     .then(category => {
//       CategoryMeta.findOne({
//         where: {
//           id: req.body.metaId
//         }
//       })
//         .then(meta => {
//           category.addMeta(meta).then(() => {
//             res.status(200).json({
//               status: true,
//               message: "Success"
//             });
//           });
//         })
//         .catch(err => {
//           //console.log("error in child");
//           //console.log(err);
//         });
//     })
//     .catch(err => {
//       //console.log("error in parent");
//       //console.log(err);
//     });
// });

module.exports = router;
