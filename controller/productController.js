const models = require("../models");
const User = models.User;
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const Product = models.Product;

module.exports = {
  getProducts: (
    categoryArray,
    offset,
    limit,
    res,
    language,
    custom = false,
    filter = null
  ) => {
    let subTitleKey = language == 1 ? "sub_title_en" : "sub_title";
    let titleKey = language == 1 ? "title_en" : "title";
    let typeKey = language == 1 ? "type_en" : "type";
    let seasonKey = language == 1 ? "season_en" : "season";
    let nameKey = language == 1 ? "name_en" : "name";
    let customWhere = custom
      ? { where: { type: { [Op.not]: "customized" } } }
      : {};
    let filterWhere = filter
      ? filter == "latest"
        ? { is_last: 1 }
        : filter == "recommended"
        ? { is_recommended: 1 }
        : {}
      : {};
    // //console.log(customWhere)
    return Product.findAll({
      // where: {
      //   category_id: {
      //     [Op.in]: categoryArray
      //   },
      // },
      where: {
        available: true,
        category_id: {
          [Op.in]: categoryArray
        },
        ...filterWhere,
        id: {
          $notIn: custom
            ? Sequelize.literal(
                '(SELECT `id` FROM `Products` WHERE `Product`.`id` = (SELECT `product_id` FROM `product_meta_relationships` WHERE `product_meta_relationships`.`product_meta_id` = (SELECT `id` FROM `product_meta` WHERE `product_meta`.`type` = "customized")))'
              )
            : []
        }
      },
	  order: [
            ['id', 'DESC'],
            ['title_en', 'ASC'],
        ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      // abdo include: [{model: models.CategoryRelationship, as: 'CategoryRelations', include: [{model: models.Category, as: 'Children', include:[{model: models.CategoryMeta, as:'Metas'}]},{model: models.Category, as: 'Parents', include:[{model: models.CategoryMeta, as:'Metas'}]},{model: models.ProductCategoryRelationship, as: 'ProductCategoryRelations', include: [{model: models.ProductCategoryRelationshipImage, as: 'Image'}]}]}, {model: models.Category, as: 'Category', include: [{model: models.CategoryMeta, as: 'Metas'}, {model: models.Category, as: 'Parents', include: [{model: models.CategoryMeta, as: 'Metas'}]}]}, {model: models.ProductMeta, as: 'Metas'}]

      // include: [{model: models.CategoryRelationship, as: 'CategoryRelations', include: [{model: models.Category, as: 'Children', include:[{model: models.CategoryMeta, as:'Metas'}]},{model: models.ProductCategoryRelationship, as: 'ProductCategoryRelations', include: [{model: models.ProductCategoryRelationshipImage, as: 'Image'}]}]}, {model: models.Category, as: 'Category', include: [{model: models.CategoryMeta, as: 'Metas'}]}, {model: models.ProductMeta, as: 'Metas',...customWhere}]
      include: [
        {
          model: models.CategoryRelationship,
          as: "CategoryRelations",
          where: {type : "fabric"},
          required: false,
          include: [
            {
              model: models.Category,
              as: "Children",
              include: [{ model: models.CategoryMeta, as: "Metas",where: {type:{[Op.or]:["sizeType", "image"]}},required: false }]
            },
            {
              model: models.ProductCategoryRelationship,
              as: "ProductCategoryRelations",
              include: [
                { model: models.ProductCategoryRelationshipImage, as: "Image" }
              ]
            }
          ]
        },
        {
          model: models.Category,
          as: "Category",
          include: [{ model: models.CategoryMeta, as: "Metas" }]
        },
        { model: models.ProductMeta, as: "Metas",where:{type:{[Op.or]:['type', 'type_en', 'season','season_en']}} },
        {association: "Stock"}
      ]
      //doesn't need parent relation, check with abdo
    })
      .then(products => {
        return {
          products: products.map(product => {
            var discount = product.price_discount
              ? Math.round(
                  ((product.price - product.price_discount) / product.price) *
                    100
                )
              : 0;
            var colors = [];
            var productCatMeta = {};
            product.Category.Metas.map(meta => {
              productCatMeta[meta.type] = meta.category_meta_relationship.value;
            });

            product.CategoryRelations.map(relation => {
              if(relation.Children.available){
              var img;


              if (relation.type === "fabric") {
                const productCatRelation = relation.ProductCategoryRelations.find(rel => rel.product_id === product.id)
                relation.Children.Metas.map(meta =>
                  meta.type == "image"
                    ? (img = meta.category_meta_relationship.value)
                    : null
                );

                colors.push({
                  id: relation.id,
                  name: relation.Children[nameKey],
                  // default: relation.ProductCategoryRelations.default,
                  default: productCatRelation.default,
                  productImg: productCatRelation.Image.image,
                  img: img
                });
              }
            }
            });

            var metaObject = {};
            product.Metas.forEach(meta => {
              metaObject[meta.type] = meta.product_meta_relationship.value;
            });

            /**
             * This fixes "UnhandledPromiseRejectionWarning: Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
             * As some products doesn't have Stock at all. That's why we get this error 👆
             */
            var stockAmount = product.Stock && product.Stock.dataValues ? product.Stock.dataValues.value : null;

            return {
              img: product.image,
              // images: [product.image, product.image_2, product.image_3, product.image_4],
              productId: product.id,
              title: product[titleKey],
              title_en: product.title_en,
              title_ar: product.title,
              sub_title_en: product.sub_title_en,
              sub_title: product.sub_title,
              price: product.price,
              price_discount: product.price_discount,
              desc: product[subTitleKey],
              type: metaObject[typeKey] ? metaObject[typeKey] : product.Category[nameKey],
              sizeType: productCatMeta.sizeType
                ? productCatMeta.sizeType
                : null,
              season: metaObject[seasonKey],
              colors: colors,
              slug: product.slug,
              sku: product.sku,
              tags: {
                isRecommended: product.is_recommended,
                isBestSeller: product.is_best_seller,
                isLatest: product.is_last,
                discount: discount
              },
              // Send Current Stock (Will check if stock == 0, and hide the product, and if in cart, treat it as we treat "deleted product", and avoid anyone to order using a "0" stock product)
              stock: stockAmount
            };
          })
        };
      })
      .catch(err => {
        //console.log(err);
        res.status(401).json({
          status: false,
          message: "Error in loading product list"
        });
      });
  }
};
