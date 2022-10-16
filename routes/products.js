const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;



const models = require("../models");
const productController = require("../controller/productController");
const homeController = require("../controller/homeController");
const Product = models.Product;
const Category = models.Category;
const CategoryMeta = models.CategoryMeta;
const CategoryMetaRelationship = models.CategoryMetaRelationship;

router.post("/product-list/:categorySlug", (req, res) => {
  if (!req.body.pageSize || !req.body.pageIndex) {
    return res
      .status(200)
      .json({
        status: false,
        message: "please add pageSize and pageIndex parameters"
      });
  }
  var limit = req.body.pageSize;
  var index = req.body.pageIndex;
  var offset = limit * (index - 1);
  var categoryArray = [];

  CategoryMetaRelationship.findOne({
    where: {
      value: req.params.categorySlug
    },

    include: [
      { model: models.CategoryMeta, as: "Meta", where: { type: "slug" } },
      {
        model: models.Category,
        as: "Category",
        include: [{ model: models.Category, as: "Children" }]
      }
    ]
  })
    .then(result => {
      if (!result) {
        return res.status(200).json({
          status: false,
          message: "no categories with this slug"
        })
      }
      if (result.Category && result.Category.Children.length > 0) {
        if(result.Category.available)
          categoryArray.push(result.Category.id);
        result.Category.Children.map(child => {
          if(child.available)
            categoryArray.push(child.id);
        });
      } else {
        if(result.Category.available)
          categoryArray.push(result.Category.id);
      }
      //console.log(categoryArray);
      productController
        .getProducts(categoryArray, offset, limit, res, req.body.language, true)
        .then(response => {
          if (response.products && response.products.length > 0) {

            res.status(200).json({ status: true, products: response.products });
          } else {
            res.status(200).json({ status: false, products: [] });
          }        })
        .catch(err => {
          //console.log(err);

          res.status(200).json({
            status: false,
            message: "Error in loading product list"
          });
        });
    })
    .catch(err => {
      //console.log(err);

      res.status(401).json({
        status: false,
        message: "Error in loading product list"
      });
    });
});

router.post("/product-details/:slug", (req, res) => {
  var productFetch = Product.findOne({
    where: {
      available: true,
      slug: req.params.slug
    },
    include: [{association : "productStockVariation"}]
    // include: [
    //   { model: models.ProductMeta, as: "Metas" },
    //   {
    //     model: models.CategoryRelationship,
    //     as: "CategoryRelations",
    //     include: [
    //       {
    //         model: models.Category,
    //         as: "Children",
    //         include: [{ model: models.CategoryMeta, as: "Metas" }]
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
    //           { model: models.ProductCategoryRelationshipImage, as: "Image" }
    //         ]
    //       }
    //     ]
    //   },
    //   {
    //     model: models.Category,
    //     as: "Category",
    //     include: [
    //       { model: models.CategoryMeta, as: "Metas" },
    //       {
    //         model: models.Category,
    //         as: "Parents",
    //         include: [{ model: models.CategoryMeta, as: "Metas" }]
    //       }
    //     ]
    //   }
    // ]
  });
  // type policies instead of name, check with abdo
  var policyFetch = Category.findOne({
    where: {
      name_en: "policies"
    },
    include: [
      {
        model: models.Category,
        as: "Children",
        include: [{ model: models.CategoryMeta, as: "Metas" }]
      }
    ]
  });
  Promise.all([productFetch,policyFetch])
  // sql.query("SELECT `Product`.*, `Metas`.`id` AS `Metas.id`, `Metas`.`type` AS `Metas.type`, `Metas->product_meta_relationship`.`id` AS `Metas.product_meta_relationship.id`, `Metas->product_meta_relationship`.`value` AS `Metas.product_meta_relationship.value`, `Metas->product_meta_relationship`.`product_id` AS `Metas.product_meta_relationship.product_id`, `Metas->product_meta_relationship`.`product_meta_id` AS `Metas.product_meta_relationship.product_meta_id`, `CategoryRelations`.`id` AS `CategoryRelations.id`, `CategoryRelations`.`type` AS `CategoryRelations.type`, `CategoryRelations`.`child_id` AS `CategoryRelations.child_id`, `CategoryRelations`.`parent_id` AS `CategoryRelations.parent_id`, `CategoryRelations->product_category_relationship`.`id` AS `CategoryRelations.product_category_relationship.id`, `CategoryRelations->product_category_relationship`.`default` AS `CategoryRelations.product_category_relationship.default`, `CategoryRelations->product_category_relationship`.`category_rel_id` AS `CategoryRelations.product_category_relationship.category_rel_id`, `CategoryRelations->product_category_relationship`.`product_id` AS `CategoryRelations.product_category_relationship.product_id`, `CategoryRelations->Children`.`id` AS `CategoryRelations.Children.id`, `CategoryRelations->Children`.`name` AS `CategoryRelations.Children.name`, `CategoryRelations->Children`.`name_en` AS `CategoryRelations.Children.name_en`, `CategoryRelations->Children`.`title` AS `CategoryRelations.Children.title`, `CategoryRelations->Children`.`title_en` AS `CategoryRelations.Children.title_en`, `CategoryRelations->Children`.`type` AS `CategoryRelations.Children.type`, `CategoryRelations->Children`.`available` AS `CategoryRelations.Children.available`, `CategoryRelations->Children->Metas`.`id` AS `CategoryRelations.Children.Metas.id`, `CategoryRelations->Children->Metas`.`type` AS `CategoryRelations.Children.Metas.type`, `CategoryRelations->Children->Metas`.`value_type` AS `CategoryRelations.Children.Metas.value_type`, `CategoryRelations->Children->Metas->category_meta_relationship`.`id` AS `CategoryRelations.Children.Metas.category_meta_relationship.id`, `CategoryRelations->Children->Metas->category_meta_relationship`.`value` AS `CategoryRelations.Children.Metas.category_meta_relationship.value`, `CategoryRelations->Children->Metas->category_meta_relationship`.`category_id` AS `CategoryRelations.Children.Metas.category_meta_relationship.category_id`, `CategoryRelations->Children->Metas->category_meta_relationship`.`category_meta_id` AS `CategoryRelations.Children.Metas.category_meta_relationship.category_meta_id`, `CategoryRelations->Parents`.`id` AS `CategoryRelations.Parents.id`, `CategoryRelations->Parents`.`name` AS `CategoryRelations.Parents.name`, `CategoryRelations->Parents`.`name_en` AS `CategoryRelations.Parents.name_en`, `CategoryRelations->Parents`.`title` AS `CategoryRelations.Parents.title`, `CategoryRelations->Parents`.`title_en` AS `CategoryRelations.Parents.title_en`, `CategoryRelations->Parents`.`type` AS `CategoryRelations.Parents.type`, `CategoryRelations->Parents`.`available` AS `CategoryRelations.Parents.available`, `CategoryRelations->ProductCategoryRelations`.`id` AS `CategoryRelations.ProductCategoryRelations.id`, `CategoryRelations->ProductCategoryRelations`.`default` AS `CategoryRelations.ProductCategoryRelations.default`, `CategoryRelations->ProductCategoryRelations`.`category_rel_id` AS `CategoryRelations.ProductCategoryRelations.category_rel_id`, `CategoryRelations->ProductCategoryRelations`.`product_id` AS `CategoryRelations.ProductCategoryRelations.product_id`, `CategoryRelations->ProductCategoryRelations->Image`.`id` AS `CategoryRelations.ProductCategoryRelations.Image.id`, `CategoryRelations->ProductCategoryRelations->Image`.`image` AS `CategoryRelations.ProductCategoryRelations.Image.image`, `CategoryRelations->ProductCategoryRelations->Image`.`large_image` AS `CategoryRelations.ProductCategoryRelations.Image.large_image`, `CategoryRelations->ProductCategoryRelations->Image`.`product_cat_rel_id` AS `CategoryRelations.ProductCategoryRelations.Image.product_cat_rel_id`, `Category`.`id` AS `Category.id`, `Category`.`name` AS `Category.name`, `Category`.`name_en` AS `Category.name_en`, `Category`.`title` AS `Category.title`, `Category`.`title_en` AS `Category.title_en`, `Category`.`type` AS `Category.type`, `Category`.`available` AS `Category.available`, `Category->Metas`.`id` AS `Category.Metas.id`, `Category->Metas`.`type` AS `Category.Metas.type`, `Category->Metas`.`value_type` AS `Category.Metas.value_type`, `Category->Metas->category_meta_relationship`.`id` AS `Category.Metas.category_meta_relationship.id`, `Category->Metas->category_meta_relationship`.`value` AS `Category.Metas.category_meta_relationship.value`, `Category->Metas->category_meta_relationship`.`category_id` AS `Category.Metas.category_meta_relationship.category_id`, `Category->Metas->category_meta_relationship`.`category_meta_id` AS `Category.Metas.category_meta_relationship.category_meta_id`, `Category->Parents`.`id` AS `Category.Parents.id`, `Category->Parents`.`name` AS `Category.Parents.name`, `Category->Parents`.`name_en` AS `Category.Parents.name_en`, `Category->Parents`.`title` AS `Category.Parents.title`, `Category->Parents`.`title_en` AS `Category.Parents.title_en`, `Category->Parents`.`type` AS `Category.Parents.type`, `Category->Parents`.`available` AS `Category.Parents.available`, `Category->Parents->category_relationship`.`id` AS `Category.Parents.category_relationship.id`, `Category->Parents->category_relationship`.`type` AS `Category.Parents.category_relationship.type`, `Category->Parents->category_relationship`.`child_id` AS `Category.Parents.category_relationship.child_id`, `Category->Parents->category_relationship`.`parent_id` AS `Category.Parents.category_relationship.parent_id`, `Category->Parents->Metas`.`id` AS `Category.Parents.Metas.id`, `Category->Parents->Metas`.`type` AS `Category.Parents.Metas.type`, `Category->Parents->Metas`.`value_type` AS `Category.Parents.Metas.value_type`, `Category->Parents->Metas->category_meta_relationship`.`id` AS `Category.Parents.Metas.category_meta_relationship.id`, `Category->Parents->Metas->category_meta_relationship`.`value` AS `Category.Parents.Metas.category_meta_relationship.value`, `Category->Parents->Metas->category_meta_relationship`.`category_id` AS `Category.Parents.Metas.category_meta_relationship.category_id`, `Category->Parents->Metas->category_meta_relationship`.`category_meta_id` AS `Category.Parents.Metas.category_meta_relationship.category_meta_id` FROM (SELECT `Product`.`id`, `Product`.`title`, `Product`.`title_en`, `Product`.`sub_title`, `Product`.`sub_title_en`, `Product`.`slug`, `Product`.`price`, `Product`.`price_discount`, `Product`.`is_recommended`, `Product`.`is_last`, `Product`.`is_best_seller`, `Product`.`image`, `Product`.`image_2`, `Product`.`image_3`, `Product`.`image_4`, `Product`.`sku`, `Product`.`available`, `Product`.`category_id` FROM `Products` AS `Product` WHERE `Product`.`available` = true AND `Product`.`slug` = 'thoob10' AND ( SELECT `product_meta_relationship`.`id` FROM `product_meta_relationships` AS `product_meta_relationship` INNER JOIN `product_meta` AS `product_metum` ON `product_meta_relationship`.`product_meta_id` = `product_metum`.`id` AND (`product_metum`.`type` = 'image_thumb' OR `product_metum`.`type` = 'image_large' OR `product_metum`.`type` = 'image_2_thumb' OR `product_metum`.`type` = 'image_2_large' OR `product_metum`.`type` = 'image_3_thumb' OR `product_metum`.`type` = 'image_3_large' OR `product_metum`.`type` = 'image_4_thumb' OR `product_metum`.`type` = 'image_4_large') WHERE (`Product`.`id` = `product_meta_relationship`.`product_id`) LIMIT 1 ) IS NOT NULL LIMIT 1) AS `Product` INNER JOIN ( `product_meta_relationships` AS `Metas->product_meta_relationship` INNER JOIN `product_meta` AS `Metas` ON `Metas`.`id` = `Metas->product_meta_relationship`.`product_meta_id`) ON `Product`.`id` = `Metas->product_meta_relationship`.`product_id` AND (`Metas`.`type` = 'image_thumb' OR `Metas`.`type` = 'image_large' OR `Metas`.`type` = 'image_2_thumb' OR `Metas`.`type` = 'image_2_large' OR `Metas`.`type` = 'image_3_thumb' OR `Metas`.`type` = 'image_3_large' OR `Metas`.`type` = 'image_4_thumb' OR `Metas`.`type` = 'image_4_large') LEFT OUTER JOIN ( `product_category_relationships` AS `CategoryRelations->product_category_relationship` INNER JOIN `category_relationships` AS `CategoryRelations` ON `CategoryRelations`.`id` = `CategoryRelations->product_category_relationship`.`category_rel_id`) ON `Product`.`id` = `CategoryRelations->product_category_relationship`.`product_id` AND (`CategoryRelations`.`type` = 'fabric' OR `CategoryRelations`.`type` = 'accessory' OR `CategoryRelations`.`type` = 'betana') LEFT OUTER JOIN `Categories` AS `CategoryRelations->Children` ON `CategoryRelations`.`child_id` = `CategoryRelations->Children`.`id` LEFT OUTER JOIN ( `category_meta_relationships` AS `CategoryRelations->Children->Metas->category_meta_relationship` INNER JOIN `category_meta` AS `CategoryRelations->Children->Metas` ON `CategoryRelations->Children->Metas`.`id` = `CategoryRelations->Children->Metas->category_meta_relationship`.`category_meta_id`) ON `CategoryRelations->Children`.`id` = `CategoryRelations->Children->Metas->category_meta_relationship`.`category_id` LEFT OUTER JOIN `Categories` AS `CategoryRelations->Parents` ON `CategoryRelations`.`parent_id` = `CategoryRelations->Parents`.`id` LEFT OUTER JOIN `product_category_relationships` AS `CategoryRelations->ProductCategoryRelations` ON `CategoryRelations`.`id` = `CategoryRelations->ProductCategoryRelations`.`category_rel_id` LEFT OUTER JOIN `product_category_relationship_images` AS `CategoryRelations->ProductCategoryRelations->Image` ON `CategoryRelations->ProductCategoryRelations`.`id` = `CategoryRelations->ProductCategoryRelations->Image`.`product_cat_rel_id` LEFT OUTER JOIN `Categories` AS `Category` ON `Product`.`category_id` = `Category`.`id` LEFT OUTER JOIN ( `category_meta_relationships` AS `Category->Metas->category_meta_relationship` INNER JOIN `category_meta` AS `Category->Metas` ON `Category->Metas`.`id` = `Category->Metas->category_meta_relationship`.`category_meta_id`) ON `Category`.`id` = `Category->Metas->category_meta_relationship`.`category_id` LEFT OUTER JOIN ( `category_relationships` AS `Category->Parents->category_relationship` INNER JOIN `Categories` AS `Category->Parents` ON `Category->Parents`.`id` = `Category->Parents->category_relationship`.`parent_id`) ON `Category`.`id` = `Category->Parents->category_relationship`.`child_id` LEFT OUTER JOIN ( `category_meta_relationships` AS `Category->Parents->Metas->category_meta_relationship` INNER JOIN `category_meta` AS `Category->Parents->Metas` ON `Category->Parents->Metas`.`id` = `Category->Parents->Metas->category_meta_relationship`.`category_meta_id`) ON `Category->Parents`.`id` = `Category->Parents->Metas->category_meta_relationship`.`category_id`"
  // ,function(error, results, fields){
  //   console.log('product',results)
  //   return res.status(200).json({
  //     status: true,
  //     message: "test111"});
  // });
  //  sequelize.query("SELECT `Product`.*, `Metas`.`id` AS `Metas.id`, `Metas`.`type` AS `Metas.type`, `Metas->product_meta_relationship`.`id` AS `Metas.product_meta_relationship.id`, `Metas->product_meta_relationship`.`value` AS `Metas.product_meta_relationship.value`, `Metas->product_meta_relationship`.`product_id` AS `Metas.product_meta_relationship.product_id`, `Metas->product_meta_relationship`.`product_meta_id` AS `Metas.product_meta_relationship.product_meta_id`, `CategoryRelations`.`id` AS `CategoryRelations.id`, `CategoryRelations`.`type` AS `CategoryRelations.type`, `CategoryRelations`.`child_id` AS `CategoryRelations.child_id`, `CategoryRelations`.`parent_id` AS `CategoryRelations.parent_id`, `CategoryRelations->product_category_relationship`.`id` AS `CategoryRelations.product_category_relationship.id`, `CategoryRelations->product_category_relationship`.`default` AS `CategoryRelations.product_category_relationship.default`, `CategoryRelations->product_category_relationship`.`category_rel_id` AS `CategoryRelations.product_category_relationship.category_rel_id`, `CategoryRelations->product_category_relationship`.`product_id` AS `CategoryRelations.product_category_relationship.product_id`, `CategoryRelations->Children`.`id` AS `CategoryRelations.Children.id`, `CategoryRelations->Children`.`name` AS `CategoryRelations.Children.name`, `CategoryRelations->Children`.`name_en` AS `CategoryRelations.Children.name_en`, `CategoryRelations->Children`.`title` AS `CategoryRelations.Children.title`, `CategoryRelations->Children`.`title_en` AS `CategoryRelations.Children.title_en`, `CategoryRelations->Children`.`type` AS `CategoryRelations.Children.type`, `CategoryRelations->Children`.`available` AS `CategoryRelations.Children.available`, `CategoryRelations->Children->Metas`.`id` AS `CategoryRelations.Children.Metas.id`, `CategoryRelations->Children->Metas`.`type` AS `CategoryRelations.Children.Metas.type`, `CategoryRelations->Children->Metas`.`value_type` AS `CategoryRelations.Children.Metas.value_type`, `CategoryRelations->Children->Metas->category_meta_relationship`.`id` AS `CategoryRelations.Children.Metas.category_meta_relationship.id`, `CategoryRelations->Children->Metas->category_meta_relationship`.`value` AS `CategoryRelations.Children.Metas.category_meta_relationship.value`, `CategoryRelations->Children->Metas->category_meta_relationship`.`category_id` AS `CategoryRelations.Children.Metas.category_meta_relationship.category_id`, `CategoryRelations->Children->Metas->category_meta_relationship`.`category_meta_id` AS `CategoryRelations.Children.Metas.category_meta_relationship.category_meta_id`, `CategoryRelations->Parents`.`id` AS `CategoryRelations.Parents.id`, `CategoryRelations->Parents`.`name` AS `CategoryRelations.Parents.name`, `CategoryRelations->Parents`.`name_en` AS `CategoryRelations.Parents.name_en`, `CategoryRelations->Parents`.`title` AS `CategoryRelations.Parents.title`, `CategoryRelations->Parents`.`title_en` AS `CategoryRelations.Parents.title_en`, `CategoryRelations->Parents`.`type` AS `CategoryRelations.Parents.type`, `CategoryRelations->Parents`.`available` AS `CategoryRelations.Parents.available`, `CategoryRelations->ProductCategoryRelations`.`id` AS `CategoryRelations.ProductCategoryRelations.id`, `CategoryRelations->ProductCategoryRelations`.`default` AS `CategoryRelations.ProductCategoryRelations.default`, `CategoryRelations->ProductCategoryRelations`.`category_rel_id` AS `CategoryRelations.ProductCategoryRelations.category_rel_id`, `CategoryRelations->ProductCategoryRelations`.`product_id` AS `CategoryRelations.ProductCategoryRelations.product_id`, `CategoryRelations->ProductCategoryRelations->Image`.`id` AS `CategoryRelations.ProductCategoryRelations.Image.id`, `CategoryRelations->ProductCategoryRelations->Image`.`image` AS `CategoryRelations.ProductCategoryRelations.Image.image`, `CategoryRelations->ProductCategoryRelations->Image`.`large_image` AS `CategoryRelations.ProductCategoryRelations.Image.large_image`, `CategoryRelations->ProductCategoryRelations->Image`.`product_cat_rel_id` AS `CategoryRelations.ProductCategoryRelations.Image.product_cat_rel_id`, `Category`.`id` AS `Category.id`, `Category`.`name` AS `Category.name`, `Category`.`name_en` AS `Category.name_en`, `Category`.`title` AS `Category.title`, `Category`.`title_en` AS `Category.title_en`, `Category`.`type` AS `Category.type`, `Category`.`available` AS `Category.available`, `Category->Metas`.`id` AS `Category.Metas.id`, `Category->Metas`.`type` AS `Category.Metas.type`, `Category->Metas`.`value_type` AS `Category.Metas.value_type`, `Category->Metas->category_meta_relationship`.`id` AS `Category.Metas.category_meta_relationship.id`, `Category->Metas->category_meta_relationship`.`value` AS `Category.Metas.category_meta_relationship.value`, `Category->Metas->category_meta_relationship`.`category_id` AS `Category.Metas.category_meta_relationship.category_id`, `Category->Metas->category_meta_relationship`.`category_meta_id` AS `Category.Metas.category_meta_relationship.category_meta_id`, `Category->Parents`.`id` AS `Category.Parents.id`, `Category->Parents`.`name` AS `Category.Parents.name`, `Category->Parents`.`name_en` AS `Category.Parents.name_en`, `Category->Parents`.`title` AS `Category.Parents.title`, `Category->Parents`.`title_en` AS `Category.Parents.title_en`, `Category->Parents`.`type` AS `Category.Parents.type`, `Category->Parents`.`available` AS `Category.Parents.available`, `Category->Parents->category_relationship`.`id` AS `Category.Parents.category_relationship.id`, `Category->Parents->category_relationship`.`type` AS `Category.Parents.category_relationship.type`, `Category->Parents->category_relationship`.`child_id` AS `Category.Parents.category_relationship.child_id`, `Category->Parents->category_relationship`.`parent_id` AS `Category.Parents.category_relationship.parent_id`, `Category->Parents->Metas`.`id` AS `Category.Parents.Metas.id`, `Category->Parents->Metas`.`type` AS `Category.Parents.Metas.type`, `Category->Parents->Metas`.`value_type` AS `Category.Parents.Metas.value_type`, `Category->Parents->Metas->category_meta_relationship`.`id` AS `Category.Parents.Metas.category_meta_relationship.id`, `Category->Parents->Metas->category_meta_relationship`.`value` AS `Category.Parents.Metas.category_meta_relationship.value`, `Category->Parents->Metas->category_meta_relationship`.`category_id` AS `Category.Parents.Metas.category_meta_relationship.category_id`, `Category->Parents->Metas->category_meta_relationship`.`category_meta_id` AS `Category.Parents.Metas.category_meta_relationship.category_meta_id` FROM (SELECT `Product`.`id`, `Product`.`title`, `Product`.`title_en`, `Product`.`sub_title`, `Product`.`sub_title_en`, `Product`.`slug`, `Product`.`price`, `Product`.`price_discount`, `Product`.`is_recommended`, `Product`.`is_last`, `Product`.`is_best_seller`, `Product`.`image`, `Product`.`image_2`, `Product`.`image_3`, `Product`.`image_4`, `Product`.`sku`, `Product`.`available`, `Product`.`category_id` FROM `Products` AS `Product` WHERE `Product`.`available` = true AND `Product`.`slug` = 'thoob10' AND ( SELECT `product_meta_relationship`.`id` FROM `product_meta_relationships` AS `product_meta_relationship` INNER JOIN `product_meta` AS `product_metum` ON `product_meta_relationship`.`product_meta_id` = `product_metum`.`id` AND (`product_metum`.`type` = 'image_thumb' OR `product_metum`.`type` = 'image_large' OR `product_metum`.`type` = 'image_2_thumb' OR `product_metum`.`type` = 'image_2_large' OR `product_metum`.`type` = 'image_3_thumb' OR `product_metum`.`type` = 'image_3_large' OR `product_metum`.`type` = 'image_4_thumb' OR `product_metum`.`type` = 'image_4_large') WHERE (`Product`.`id` = `product_meta_relationship`.`product_id`) LIMIT 1 ) IS NOT NULL LIMIT 1) AS `Product` INNER JOIN ( `product_meta_relationships` AS `Metas->product_meta_relationship` INNER JOIN `product_meta` AS `Metas` ON `Metas`.`id` = `Metas->product_meta_relationship`.`product_meta_id`) ON `Product`.`id` = `Metas->product_meta_relationship`.`product_id` AND (`Metas`.`type` = 'image_thumb' OR `Metas`.`type` = 'image_large' OR `Metas`.`type` = 'image_2_thumb' OR `Metas`.`type` = 'image_2_large' OR `Metas`.`type` = 'image_3_thumb' OR `Metas`.`type` = 'image_3_large' OR `Metas`.`type` = 'image_4_thumb' OR `Metas`.`type` = 'image_4_large') LEFT OUTER JOIN ( `product_category_relationships` AS `CategoryRelations->product_category_relationship` INNER JOIN `category_relationships` AS `CategoryRelations` ON `CategoryRelations`.`id` = `CategoryRelations->product_category_relationship`.`category_rel_id`) ON `Product`.`id` = `CategoryRelations->product_category_relationship`.`product_id` AND (`CategoryRelations`.`type` = 'fabric' OR `CategoryRelations`.`type` = 'accessory' OR `CategoryRelations`.`type` = 'betana') LEFT OUTER JOIN `Categories` AS `CategoryRelations->Children` ON `CategoryRelations`.`child_id` = `CategoryRelations->Children`.`id` LEFT OUTER JOIN ( `category_meta_relationships` AS `CategoryRelations->Children->Metas->category_meta_relationship` INNER JOIN `category_meta` AS `CategoryRelations->Children->Metas` ON `CategoryRelations->Children->Metas`.`id` = `CategoryRelations->Children->Metas->category_meta_relationship`.`category_meta_id`) ON `CategoryRelations->Children`.`id` = `CategoryRelations->Children->Metas->category_meta_relationship`.`category_id` LEFT OUTER JOIN `Categories` AS `CategoryRelations->Parents` ON `CategoryRelations`.`parent_id` = `CategoryRelations->Parents`.`id` LEFT OUTER JOIN `product_category_relationships` AS `CategoryRelations->ProductCategoryRelations` ON `CategoryRelations`.`id` = `CategoryRelations->ProductCategoryRelations`.`category_rel_id` LEFT OUTER JOIN `product_category_relationship_images` AS `CategoryRelations->ProductCategoryRelations->Image` ON `CategoryRelations->ProductCategoryRelations`.`id` = `CategoryRelations->ProductCategoryRelations->Image`.`product_cat_rel_id` LEFT OUTER JOIN `Categories` AS `Category` ON `Product`.`category_id` = `Category`.`id` LEFT OUTER JOIN ( `category_meta_relationships` AS `Category->Metas->category_meta_relationship` INNER JOIN `category_meta` AS `Category->Metas` ON `Category->Metas`.`id` = `Category->Metas->category_meta_relationship`.`category_meta_id`) ON `Category`.`id` = `Category->Metas->category_meta_relationship`.`category_id` LEFT OUTER JOIN ( `category_relationships` AS `Category->Parents->category_relationship` INNER JOIN `Categories` AS `Category->Parents` ON `Category->Parents`.`id` = `Category->Parents->category_relationship`.`parent_id`) ON `Category`.`id` = `Category->Parents->category_relationship`.`child_id` LEFT OUTER JOIN ( `category_meta_relationships` AS `Category->Parents->Metas->category_meta_relationship` INNER JOIN `category_meta` AS `Category->Parents->Metas` ON `Category->Parents->Metas`.`id` = `Category->Parents->Metas->category_meta_relationship`.`category_meta_id`) ON `Category->Parents`.`id` = `Category->Parents->Metas->category_meta_relationship`.`category_id`"
  //  ).then(function(){
  //   return res.status(200).json({
  //     status: true,
  //     message: "test111"});
  //  });
  .then(responses => {
    // console.log('marwa');
    const productImg = models.ProductMetaRelationship.findAll({
      where: {
        product_id: responses[0].id,
        product_meta_id: {
          $in: Sequelize.literal(
                '(SELECT `id` FROM `product_meta` WHERE `product_meta`.`type` IN ("image_thumb", "image_large", "image_2_thumb", "image_2_large", "image_3_thumb", "image_3_large", "image_4_thumb", "image_4_large"))'
              )
        }
      }
    })

    const productMta = models.ProductMeta.findAll({
      where: {type: {[Op.or]: ['image_thumb', 'image_large', 'image_2_thumb', 'image_2_large', 'image_3_thumb', 'image_3_large', 'image_4_thumb', 'image_4_large']}}
    })
    Promise.all([productImg,productMta]).then((Metas)=>{
      // return res.status(200).json({
      //   status: true,
      //   message: "test111"});
      var product = responses[0];
      if (!product) {
        return res.status(200).json({
          status: false,
          message: "can't find a product with this slug"
        })
      }

        const getProductStock = models.ProductStock.findAll({
          where: {
            product_id: responses[0].id
          }
        })

        let queries = [];
        queries.push(models.ProductMeta.findAll())                      // 0
        queries.push(models.ProductMetaRelationship.findAll())          // 1
        queries.push(models.Category.findAll({where: {available: true}}))                         // 2
        queries.push(models.CategoryRelationship.findAll())             // 3
        queries.push(models.CategoryMeta.findAll())                     // 4
        queries.push(null)                                              // 5
        // queries.push(models.CategoryMetaOption.findAll())            // 5
        queries.push(models.CategoryMetaRelationship.findAll())         // 6
        queries.push(models.ProductCategoryRelationship.findAll({where:{product_id : product.id}}))      // 7
        queries.push(models.ProductCategoryRelationshipImage.findAll()) // 8
        queries.push(getProductStock) // 9
        queries.push(models.Quantity.findAll({where:{product_id : product.id}}))      // 10
        queries.push(models.Size.findAll())      // 11
        queries.push(models.Fabric.findAll())      // 12
        queries.push(models.CategoryRelationship.findAll({
          where: {
            type: "fabric"
          },
          include: [{association: "Children", where: {type: "color"}}]
        })) //13
        queries.push(models.ShoeColor.findAll()); // 14

        Promise.all(queries)
            .then(resultsOfQueries => {
            let productMetas = resultsOfQueries[0],
                  productMetaRelationships = resultsOfQueries[1],
                  allCategories = resultsOfQueries[2],
                  allCategoryRelations = resultsOfQueries[3].filter(iIt=>{return allCategories.find(jIt=>{return jIt.id == iIt.parent_id}) && allCategories.find(jIt=>{return jIt.id == iIt.child_id})}),
                  allCategoryMetas = resultsOfQueries[4],
                  // allCategoryMetaOptions           = resultsOfQueries[5],
                  allCategoryMetaRelationships = resultsOfQueries[6],
                  productCategoryRelationships = resultsOfQueries[7],
                  productCategoryRelationshipImage = resultsOfQueries[8],
                  productStock = resultsOfQueries[9],
                  stocks = resultsOfQueries[10],
                  sizes = resultsOfQueries[11],
                  fabrics = resultsOfQueries[12],
                  color_for_stock = resultsOfQueries[13],
                  shoes_colors = resultsOfQueries[14];


            for(let myCatIndex = 0; myCatIndex<allCategories.length; myCatIndex++){
              let myMetas = [];
              for(let myMetaIndex = 0;myMetaIndex <allCategoryMetas.length; myMetaIndex ++)
              {
                for(let myCatMetaRelIndex = 0; myCatMetaRelIndex < allCategoryMetaRelationships.length; myCatMetaRelIndex++){
                  if((allCategoryMetaRelationships[myCatMetaRelIndex].category_meta_id == allCategoryMetas[myMetaIndex].id )
                    && (allCategoryMetaRelationships[myCatMetaRelIndex].category_id == allCategories[myCatIndex].id))
                    {
                      myMetas.push({...allCategoryMetas[myMetaIndex].dataValues, category_meta_relationship: {...allCategoryMetaRelationships[myCatMetaRelIndex].dataValues}})
                    }
                }
              }
              allCategories[myCatIndex] = {...allCategories[myCatIndex].dataValues, Metas:[...myMetas]}
            }

            product.Metas = productMetas;
            product.Metas.forEach((j) => {
              j.product_meta_relationship = productMetaRelationships.find((i) => {
                return (i.product_id == product.id) && (i.product_meta_id == j.id)
              })
            });
            
            product.CategoryRelations = allCategoryRelations.filter(i => {
              return productCategoryRelationships.find(j => {return j.category_rel_id == i.id})
            })
            product.CategoryRelations.forEach(i => {
                i.Parents = allCategories.find(j => {return j.id == i.parent_id});
                i.Children = allCategories.find(j => {return j.id == i.child_id});
                i.ProductCategoryRelations = productCategoryRelationships.filter(j=>{return j.category_rel_id == i.id});
                i.ProductCategoryRelations.forEach(k => {
                    k.Image = productCategoryRelationshipImage.find(j => {
                      return j.product_cat_rel_id == k.id
                    })
                  })
            })
            product.Category = allCategories.find(i => {return i.id == product.category_id})
            product.Category.Parents = allCategoryRelations.filter(j => {return product.Category.id == j.child_id});
            product.Category.Parents = allCategories.filter(j => {
              return product.Category.Parents.find((i)=>{
                return i.parent_id == j.id
              })
            });
      


      var policy = responses[1];
      let titleKey = req.body.language == 1 ? "title_en" : "title";
      let nameKey = req.body.language == 1 ? "name_en" : "name";
      let descriptionKey =
        req.body.language == 1 ? "description_en" : "description";
      let subTitleKey = req.body.language == 1 ? "sub_title_en" : "sub_title";
      var discount = product.price_discount
        ? Math.round(
            ((product.price - product.price_discount) / product.price) * 100
          )
        : 0;
      var productCatMeta = {};
      product.Category.Metas.map(meta => {
        productCatMeta[meta.type] = meta.category_meta_relationship.value;
      });
      var colors = [];
      var customs = {};
      var groups = [];
      // var options_stock = {sizes: [], colors: [], fabrics: []};
      // stocks.forEach(qnt => {
      //   sizes.forEach(size => {
      //     if(qnt.quantity > 0 && size.id == qnt.size_id){
      //       let siz = req.body.language == 1 ? size.name_en : size.name_ar;
      //       options_stock.sizes.push(siz);
      //     }
      //   })
      //   fabrics.forEach(fabric => {
      //     if(qnt.quantity > 0 && fabric.id == qnt.fabric_id){
      //       let fab = req.body.language == 1 ? fabric.name_en : fabric.name_ar;
      //       options_stock.fabrics.push(fab);
      //     }
      //   })
      //   if(qnt.quantity > 0){
      //     let sotockcolors = color_for_stock.filter(colCatRel=>{return colCatRel.id == qnt.color_id});
      //     let stocKat = allCategories.filter(cat => {return cat.id == sotockcolors[0].child_id} );
      //     let colorImg = allCategoryMetaRelationships.filter(img => {return img.category_id == stocKat[0].id});
      //     options_stock.colors.push({img: colorImg[0].value, id: sotockcolors[0].id});
      //   }
      // });
      var options_stock = [];
            stocks.forEach((qnt) => {
              var obj = {
                id: qnt.id,
                size: null,
                color: null,
                fabric: null,
                shoesColor: null,
                quantity: qnt.quantity,
              };
              sizes.forEach((size) => {
                if (qnt.quantity > 0 && size.id == qnt.size_id) {
                let siz = req.body.language == 1 ? size.name_en : size.name_ar;
                  obj.size = { id: size.id, name: siz };
                }
              });
              fabrics.forEach((fabric) => {
                if (qnt.quantity > 0 && fabric.id == qnt.fabric_id) {
                  let fab = req.body.language == 1 ? fabric.name_en : fabric.name_ar;
                  obj.fabric = { id: fabric.id, name: fab };
                }
              });
              // console.log('====================================');
              // console.log(shoes_colors);
              // console.log('====================================');
              shoes_colors.forEach((color) => {
                if (qnt.quantity > 0 && color.id == qnt.color_id) {
                  let col = req.body.language == 1 ? color.name_en : color.name_ar;
                  obj.shoesColor = {
                    id: color.id,
                    name: col,
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
      product.CategoryRelations.map(relation => {
        var img;
        // abdo shouldn't this be color
        const productCatRelation = relation.ProductCategoryRelations.find(rel => rel.product_id === product.id)
        //console.log("productCatRelation")
        //console.log(productCatRelation)
        if (relation.type === "fabric") {
          relation.Children.Metas.map(meta =>
            meta.type == "image"
              ? (img = meta.category_meta_relationship.value)
              : null
          );
          colors.push({
            id: relation.id,
            name: relation.Children[nameKey],
            default: productCatRelation.default,
            productImg: productCatRelation.Image.image,
            productLargeImg:
              productCatRelation.Image.large_image,
            img: img
          });
        } else if (relation.type === "accessory" || "betana") {
          customs[relation.Parents.name_en]
            ? customs[relation.Parents.name_en].push({
                id: relation.id,
                Children: relation.Children,
                Parents: relation.Parents,
                default: productCatRelation.default,
              })
            : (customs[relation.Parents.name_en] = [
                {
                  id: relation.id,
                  Children: relation.Children,
                  Parents: relation.Parents,
                  default: productCatRelation.default,
                }
              ]);
        }
      });
      Object.keys(customs).forEach(customGroup => {
        // groups.push(customs[customGroup]);
        let defaultExistis = false;
        customs[customGroup].forEach(cg=>{
          if(cg.default == true)
            defaultExistis = true;
        })
        if((!defaultExistis) && (customs[customGroup].length > 0)){
          customs[customGroup][0].default = true;
        }
        groups.push(customs[customGroup]);
      });
      //console.log(groups);
      //console.log("img");
      const image_thumb_id = Metas[1].find(meta => meta.type == "image_thumb").id;
      const image_large_id = Metas[1].find(meta => meta.type == "image_large").id;
      const image_2_thumb_id = Metas[1].find(meta => meta.type == "image_2_thumb").id;
      const image_2_large_id = Metas[1].find(meta => meta.type == "image_2_large").id;
      const image_3_thumb_id = Metas[1].find(meta => meta.type == "image_3_thumb").id;
      const image_3_large_id = Metas[1].find(meta => meta.type == "image_3_large").id;
      const image_4_thumb_id = Metas[1].find(meta => meta.type == "image_4_thumb").id;
      const image_4_large_id = Metas[1].find(meta => meta.type == "image_4_large").id;

      var stockAmount = productStock[0] ? productStock[0].value : null;

      res.status(200).json({
        status: true,
        productDetails: {
          images: [
            {
              img: product.image,
              thumbImg: Metas[0].find(meta => meta.product_meta_id == image_thumb_id)
                ? Metas[0].find(meta => meta.product_meta_id == image_thumb_id).value
                : "",
              largeImg: Metas[0].find(meta => meta.product_meta_id == image_large_id)
                ? Metas[0].find(meta => meta.product_meta_id == image_large_id).value
                : ""
            },
            {
              img: product.image_2,
              thumbImg: Metas[0].find(meta => meta.product_meta_id == image_2_thumb_id)
                ? Metas[0].find(meta => meta.product_meta_id == image_2_thumb_id).value
                : "",
              largeImg: Metas[0].find(meta => meta.product_meta_id == image_2_large_id)
                ? Metas[0].find(meta => meta.product_meta_id == image_2_large_id).value
                : ""
            },
            {
              img: product.image_3,
              thumbImg: Metas[0].find(meta => meta.product_meta_id == image_3_thumb_id)
                ? Metas[0].find(meta => meta.product_meta_id == image_3_thumb_id).value
                : "",
              largeImg: Metas[0].find(meta => meta.product_meta_id == image_3_large_id)
                ? Metas[0].find(meta => meta.product_meta_id == image_3_large_id).value
                : ""
            },
            {
              img: product.image_4,
              thumbImg: Metas[0].find(meta => meta.product_meta_id == image_4_thumb_id)
                ? Metas[0].find(meta => meta.product_meta_id == image_4_thumb_id).value
                : "",
              largeImg: Metas[0].find(meta => meta.product_meta_id == image_4_large_id)
                ? Metas[0].find(meta => meta.product_meta_id == image_4_large_id).value
                : ""
            }
          ],
          options_stock: options_stock,
          productId: product.id,
          title_en: product.title_en,
          title_ar: product.title,
          title: product[titleKey],
          subTitle: product[subTitleKey],
          price: product.price,
          price_discount: product.price_discount,
          // sizeType: sizeable, shoes, accessories
          // sizeType: productCatMeta.sizeType ? productCatMeta.sizeType : null,
          sizeType:
          product.Category.Parents &&
          product.Category.Parents.find((parent)=>{return parent.type=="general"}) &&
          product.Category.Parents.find((parent)=>{return parent.type=="general"}).Metas.find((meta)=>{return meta.type == "sizeType"}) &&
          product.Category.Parents.find((parent)=>{return parent.type=="general"}).Metas.find((meta)=>{return meta.type == "sizeType"}).category_meta_relationship.value
          ?
          product.Category.Parents.find((parent)=>{return parent.type=="general"}).Metas.find((meta)=>{return meta.type == "sizeType"}).category_meta_relationship.value
          : false,
          // Price: product.price+" "+priceUnit,
          stockType:
          product.Category.Parents &&
          product.Category.Parents.find((parent)=>{return parent.type=="general"}) &&
          product.Category.Parents.find((parent)=>{return parent.type=="general"}).Metas.find((meta)=>{return meta.type == "stock_type"}) &&
          product.Category.Parents.find((parent)=>{return parent.type=="general"}).Metas.find((meta)=>{return meta.type == "stock_type"}).category_meta_relationship.value
          ?
          product.Category.Parents.find((parent)=>{return parent.type=="general"}).Metas.find((meta)=>{return meta.type == "stock_type"}).category_meta_relationship.value
          : false,
          stock: stockAmount,
          slug: product.slug,
          colors: colors,
          customs: groups.map(group => {
            return {
              title:
                req.body.language == 1
                  ? group[0].Parents[titleKey] + " " + "shape"
                  : "شكل" + " " + group[0].Parents[titleKey],
              images: group.map(item => {
                var metaObject = {};
                item.Children.Metas.forEach(meta => {
                  metaObject[meta.type] = meta.category_meta_relationship.value;
                });
                //console.log(item)
                return {
                  id: item.id,
                  name: item.Children[nameKey],
                  imgPath: metaObject.image,
                  default: item.default
                };
              })
            };
          }),
          measurementsTable: product.Category.Metas.find(
            meta => meta.type == "measurement-table"
          )
            ? product.Category.Metas.find(
                meta => meta.type == "measurement-table"
              ).category_meta_relationship.value
            : product.Category.Parents[0].Metas
            ? product.Category.Parents[0].Metas.find(
                meta => meta.type == "measurement-table"
              )
              ? product.Category.Parents[0].Metas.find(
                  meta => meta.type == "measurement-table"
                ).category_meta_relationship.value
              : undefined
            : undefined,
          catId: product.category_id,
          tags: {
            isRecommended: product.is_recommended,
            isBestSeller: product.is_best_seller,
            discount: discount
          },
          stockVariation: product.productStockVariation.map(el => {
            return{ 
             id: el.id,
             size: el.size,
             color: el.color,
             quantity: el.quantity,
             sku: el.sku
           }
          })
        },
        policies: policy.Children.map(item => {
          var metaObject = {};
          item.Metas.forEach(meta => {
            metaObject[meta.type] = meta.category_meta_relationship.value;
          });
          return {
            title: item[titleKey],
            description: metaObject[descriptionKey]
          };
        }),
        breadcrumb: product.Category.Parents
          ? product.Category.Parents[0].Metas.filter(
              meta => meta.type === "slug"
            ).map(meta => {
              return {
                title: product.Category.Parents[0][nameKey],
                slug: meta.category_meta_relationship.value
              };
            })
          : product.Category.Metas.filter(meta => meta.type === "slug").map(
              meta => {
                return {
                  title: product.Category[nameKey],
                  slug: meta.category_meta_relationship.value
                };
              }
            )
      });
    }).catch(err => {
      //console.log(err);
      res.status(401).json({
        status: false,
        message: "Error in loading product details"
      });
    });
    })
    .catch(err => {
      //console.log(err);
      res.status(401).json({
        status: false,
        message: "Error in loading product details"
      });
    });
  })
  .catch(err => {
      console.log(err);
      res.status(401).json({
          status: false,
          message: "Error in loading product details"
      });
  });
});

// more products in product detail page
router.post("/related-products/:productSlug", (req, res) => {
  Product.findOne({
    where: {
      available:true ,
      slug: req.params.productSlug
    }
  })
    .then(product => {
      productController
        .getProducts([product.category_id], 0, 8, res, req.body.language)
        .then(response => {
          res.status(200).json({ status: true, products: response.products.filter(prod=>{return prod.slug != product.slug}) });
        })
        .catch(err => {
          //console.log(err);
          res.status(401).json({
            status: false,
            message: "Error in loading related products"
          });
        });
    })
    .catch(err => {
      //console.log(err);
      res.status(401).json({
        status: false,
        message: "Error in loading related products"
      });
    });
});
// home products
router.post("/home-products", (req, res) => {
  models.GeneralOption.findAll({
    where: {
      key: {
        [Op.or]: [
          "home_first_cat",
          "home_second_cat",
          "home_third_cat",
          "home_fourth_cat",
          "home_fifth_cat",
          "home_sixth_cat",
          "home_recommended_cat"
        ]
      }
    }
  })
    .then(response => {
      let result = {};
      let fetchArr = [];
      if (response.find(item => item.key == "home_first_cat")) {
        //console.log("here");
        fetchArr.push(
          homeController
            .getHomeProducts(
              res,
              req.body.language,
              response.find(item => item.key == "home_first_cat").value,
              "latest"
            )
            .then(data => {
              result["athwabCat"] = data;
            })
        );
      }
      if (response.find(item => item.key == "home_second_cat")) {
        fetchArr.push(
          homeController
            .getHomeProducts(
              res,
              req.body.language,
              response.find(item => item.key == "home_second_cat").value,
              "latest"
            )
            .then(data => {
              result["clothesCategory"] = data;
            })
        );
      }
      if (response.find(item => item.key == "home_third_cat")) {
        fetchArr.push(
          homeController
            .getHomeProducts(
              res,
              req.body.language,
              response.find(item => item.key == "home_third_cat").value,
              "latest"
            )
            .then(data => {
              result["accessoriesCategory"] = data;
            })
        );
      }
      if (response.find(item => item.key == "home_fourth_cat")) {
        fetchArr.push(
          homeController
            .getHomeProducts(
              res,
              req.body.language,
              response.find(item => item.key == "home_fourth_cat").value,
              "latest"
            )
            .then(data => {
              result["shoesCategory"] = data;
            })
        );
      }
      if (response.find(item => item.key == "home_fifth_cat")) {
        fetchArr.push(
          homeController
            .getHomeProducts(
              res,
              req.body.language,
              response.find(item => item.key == "home_fifth_cat").value,
              "latest"
            )
            .then(data => {
              result["winterCollectionCategory"] = data;
            })
        );
      }
      if (response.find(item => item.key == "home_sixth_cat")) {
        fetchArr.push(
          homeController
            .getHomeProducts(
              res,
              req.body.language,
              response.find(item => item.key == "home_sixth_cat").value,
              "latest"
            )
            .then(data => {
              result["perfumeCategory"] = data;
            })
        );
      }
      if (response.find(item => item.key == "home_recommended_cat")) {
        fetchArr.push(
          homeController
            .getHomeProducts(
              res,
              req.body.language,
              response.find(
                item => item.key == "home_recommended_cat",
                "recommended"
              ).value,
              "recommended"
            )
            .then(data => {
              result["recommendedCategory"] = data;
            })
        );
      }
      Promise.all([...fetchArr])
        .then(() => {
          result["recommendedCategory"] ?
          result["recommendedCategory"].products ?
              result["recommendedCategory"].products =
              result["recommendedCategory"].products
                  .filter((testElement) => {
                      return testElement.tags.isRecommended
                  })
              : null
          : null
          
          res.status(200).json({
            status: true,
            ...result
          });
        })
        .catch(err => {
          //console.log(err);
          res.status(401).json({
            status: false,
            message: "Error in loading home products"
          });
        });
    })
    .catch(err => {
      //console.log(err);
      res.status(401).json({
        status: false,
        message: "Error in loading home products"
      });
    });
});

// router.post("/home-products2", (req, res) => {
// 	let subTitleKey = req.body.language == 1 ? "sub_title_en" : "sub_title";
// 	let titleKey = req.body.language == 1 ? "title_en" : "title";
// 	let typeKey = req.body.language == 1 ? "type_en" : "type";
// 	let seasonKey = req.body.language == 1 ? "season_en" : "season";

// 	let home_title = req.body.language == 1 ? "home_title_en" : "home_title";
// 	let home_title_link = req.body.language == 1 ? "home_title_link_en" : "home_title_link";

// 	let nameKey = req.body.language == 1 ? "name_en" : "name";

// 	Category.findOne({
// 		where: {
// 			name_en: "categories"
// 		},
// 		include: [{
// 				model: models.Category,
// 				as: "Children",
// 				include: [{
// 						model: models.Category,
// 						as: "Children",
// 						include: [{
// 							model: models.CategoryMeta,
// 							as: "Metas"
// 						}]
// 					},
// 					{
// 						model: models.CategoryMeta,
// 						as: "Metas"
// 					}
// 				]
// 			},
// 			{
// 				model: models.CategoryMeta,
// 				as: "Metas"
// 			}

// 		]
// 	}).then(response => {
// 		var result = []
// 		if (response.dataValues.Children.length > 0) {
// 			response.dataValues.Children.map((child,index) => {
// 				var categoryArray = [];
// 				categoryArray.push(child.id)
// 				if (child.Children.length > 0) {
// 					child.Children.map(child2 => {
// 						categoryArray.push(child2.id)
// 					})
//         }

//         // Product.findAll({
//         //   where: {
//         //       category_id: {
//         //           [Op.in]: categoryArray
//         //         },

//         //   },
//         //   include: [{association: 'Metas', where: {type: { [Op.not]: 'customized'}}}]
//         // }).then()
// 			Product.findAll({
// 						where: {
// 							category_id: {
// 								[Op.in]: categoryArray
// 							}
// 						},
// 						limit: 8,
// 						include: [{
// 							model: models.CategoryRelationship,
// 							as: 'CategoryRelations',
// 							include: [{
// 								model: models.Category,
// 								as: 'Children',
// 								include: [{
// 									model: models.CategoryMeta,
// 									as: 'Metas'
// 								}]
// 							}, {
// 								model: models.Category,
// 								as: 'Parents',
// 								include: [{
// 									model: models.CategoryMeta,
// 									as: 'Metas'
// 								}]
// 							}, {
// 								model: models.ProductCategoryRelationship,
// 								as: 'ProductCategoryRelations',
// 								include: [{
// 									model: models.ProductCategoryRelationshipImage,
// 									as: 'Image'
// 								}]
// 							}]
// 						}, {
// 							model: models.Category,
// 							as: 'Category',
// 							include: [{
// 								model: models.CategoryMeta,
// 								as: 'Metas'
// 							}, {
// 								model: models.Category,
// 								as: 'Parents',
// 								include: [{
// 									model: models.CategoryMeta,
// 									as: 'Metas'
// 								}]
// 							}]
// 						}, {
// 							model: models.ProductMeta,
// 							as: 'Metas'
// 						}]

// 					}).then(products => {
// 						if(products.length > 0){
// 						result.push({
// 							slug: child.Metas.find(meta=>meta.type == "slug").category_meta_relationship.value,
// 							title: child.Metas.find(meta=>meta.type == home_title) ? child.Metas.find(meta=>meta.type == home_title).category_meta_relationship.value : "",
// 							linkTitle: child.Metas.find(meta=>meta.type == home_title_link) ? child.Metas.find(meta=>meta.type == home_title_link).category_meta_relationship.value : "",
// 							products: products.map(product => {
// 								var discount = Math.round(((product.price - product.price_discount) / product.price) * 100);
// 								var colors = []
// 								product.CategoryRelations.map(relation => {
// 									var img;
// 									if (relation.type === 'fabric') {
// 										relation.Children.Metas.map(meta => meta.type == 'image' ? img = meta.category_meta_relationship.value : null)
// 										colors.push({
// 											id: relation.id,
// 											name: relation.Children[nameKey],
// 											// default: relation.ProductCategoryRelations.default,
// 											productImg: relation.ProductCategoryRelations.Image.image,
// 											img: img
// 										})
// 									}

// 								})

// 								var metaObject = {};
// 								product.Metas.forEach(meta => {
// 									metaObject[meta.type] =
// 										meta.product_meta_relationship.value;
// 								});
// 								return {
// 									img: product.image,
// 									// images: [product.image, product.image_2, product.image_3, product.image_4],
// 									productId: product.id,
// 									title: product[titleKey],
// 									price: product.price,
// 									desc: product[subTitleKey],
// 									type: metaObject[typeKey],
// 									season: metaObject[seasonKey],
// 									colors: colors,
// 									slug: product.slug,
// 									tags: {
// 										isRecommended: product.is_recommended,
// 										isBestSeller: product.is_best_seller,
// 										discount: discount + "%"
// 									}
// 								}
// 							})
// 						})}
// 						if(response.dataValues.Children.length-1 == index){
// 							res.status(200).json({
// 								status: true,
// 								data: result
// 							})
// 						}
// 					})
// 					.catch(err => {
// 						//console.log(err)
// 						res.status(401).json({
// 							status: false,
// 							message: "Error in loading product list"
// 						})
// 					})

// 			})
// 		}else{
// 			res.status(401).json({
// 				status: false,
// 				message: "Error in loading product list"
// 			})
// 		}

// 	}).catch(err => {
// 		//console.log(err)
// 		res.status(401).json({
// 			status: false,
// 			message: "Error in loading product list"
// 		})
// 	})
// })

// router.post("/banner", (req,res) => {
//   CategoryMeta.findOne({
//     where: {
//       type: "slug"
//     },
//     include: [{model: models.Category, as: 'Categories', include: [{models: models.CategoryMetaRelationship, as: 'Metas'}]}]
//     // where: { value: req.body.slug}
//   }).then(category => {
//     res.status(200).json(category)
//   })
//   .catch(err => {
//     //console.log(err)
//     res.status(401).json({
//       status: false,
//       message: "Error in get banner"
//     })
//   })
// })

module.exports = router;
