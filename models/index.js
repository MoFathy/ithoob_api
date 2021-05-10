const Sequelize = require("sequelize");
// start sequelize with configuration
const {dbPassword} = require("../config/keys")
// IF YOU WANT TO CONNECT TO LOCAL DB ON CPANEL
// const sequelize = new Sequelize("wknode_ithoob_internal", "wknode_ithoobdb", dbPassword,{
//   dialect: "mysql",
//   define: {
//     charset: 'utf8',
//     collate: 'utf8_general_ci',
//     timestamps: true
//   }
// });

// IF YOU WANT TO CONNECT TO REMOTE DB ON HEROUKU
// let db = `mysql://b5195cfd25a5dd:1ad9bfde@us-cdbr-iron-east-02.cleardb.net/heroku_3105ecd489419c6?reconnect=true`;
// const sequelize = new Sequelize(db, {
//   dialect: "mysql",
//   define: {
//     charset: 'utf8',
//     collate: 'utf8_general_ci',
//     timestamps: true
//   }
// });

// IF YOU WANT TO CONNECT TO REMOTE DB ON HEROUKU
// let db = `mysql://b5195cfd25a5dd:1ad9bfde@us-cdbr-iron-east-02.cleardb.net/heroku_3105ecd489419c6?reconnect=true`;
// const sequelize = new Sequelize(db, {
//   dialect: "mysql",
//   define: {
//     charset: 'utf8',
//     collate: 'utf8_general_ci',
//     timestamps: true
//   }
// });

// JAWSDB
// const sequelize = new Sequelize("mysql://ptl23mg03zvs9yu2:vc2bh8hrml8j1b2i@k2pdcy98kpcsweia.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/p772wrqcxkbcy4cb",{
//   dialect: "mysql",
//   define: {
//     charset: 'utf8',
//     collate: 'utf8_general_ci',
//     timestamps: true
//   }
// });
// "mysql://wknode_ithoobdb:vc2bh8hrml8j1b2i@173.199.166.52/wknode_ithoob_internal"
// Heroku
// process.env.DATABASE_URL

/*
const sequelize = new Sequelize("mysql://wknode_ithoobdb:vc2bh8hrml8j1b2i@173.199.166.52/wknode_ithoob_internal",{
  dialect: "mysql",
  define: {
    charset: 'utf8',
    collate: 'utf8_general_ci',
    timestamps: true
  }}
  )
*/
// const sequelize = new Sequelize("mysql://root:jzl!#%135X@127.0.0.1/jzlStoreDB",{
  const sequelize = new Sequelize("jzlStoreDB", "root", "", {
  dialect: "mysql",
  define: {
    charset: 'utf8',
    collate: 'utf8_general_ci',
    timestamps: true
  }}
  )

// mysql://ptl23mg03zvs9yu2:vc2bh8hrml8j1b2i@k2pdcy98kpcsweia.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/p772wrqcxkbcy4cb
// const sequelize = new Sequelize("heroku_3105ecd489419c6", "b5195cfd25a5dd", "1ad9bfde",{
//   dialect: "mysql",
//   host: "us-cdbr-iron-east-02.cleardb.net",
//   define: {
//     charset: 'utf8',
//     collate: 'utf8_general_ci',
//     timestamps: true
//   }
// });

// list of tables in database and getting them from their separated files
const models = {
  Category: sequelize.import("./category"),
  CategoryRelationship: sequelize.import("./category_relationship"),
  CategoryMeta: sequelize.import("./category_meta"),
  CategoryMetaRelationship: sequelize.import("./category_meta_relationship"),
  CategoryMetaOption: sequelize.import("./category_meta_option"),//Ehab
  Product: sequelize.import("./product"),
  ProductCategoryRelationshipImage: sequelize.import('./product_category_relationship_image'),
  ProductCategoryRelationship: sequelize.import('./product_category_relationship'),
  ProductMeta: sequelize.import("./product_meta"),
  ProductMetaRelationship: sequelize.import("./product_meta_relationship"),
  User: sequelize.import("./user"),
  UserMeta: sequelize.import("./user_meta"),
  Place: sequelize.import("./place"),
  // PlaceRelationship: sequelize.import("./place_relationship"),
  MeasurementProfile: sequelize.import("./measurement_profile"),
  Partner: sequelize.import("./partner"),
  MeasurementGuide: sequelize.import("./measurement_guide"),
  Cart: sequelize.import("./cart"),
  CartProductRelationship: sequelize.import("./cart_product_relationship"),
  CartCustomizeRelationship: sequelize.import("./cart_customization_relationship"),
  CartProductMeta: sequelize.import("./cart_product_meta"),
  // CartProductProfile: sequelize.import("./cart_product_profile")
  GeneralOption: sequelize.import("./general_option"),
  PartnerCode: sequelize.import("./partner_code"),
  Branch: sequelize.import("./branch"),
  Order: sequelize.import("./order"),
  OrderProductRelationship: sequelize.import("./order_product_relationship"),
  OrderCustomizeRelationship: sequelize.import("./order_customization_relationship"),
  OrderProductMeta: sequelize.import("./order_product_meta"),
  GeneralEnum: sequelize.import('./general_enum'),
  ContentMeta: sequelize.import('./content_meta'),
  Question: sequelize.import('./question'),
  Content: sequelize.import('./content'),
  Policy: sequelize.import('./policy'),
  GeneralCoupon: sequelize.import('./general_coupon'),
  Newsletter: sequelize.import('./newsletter'),
  Message: sequelize.import('./message'),
  Quantity: sequelize.import('./quantity'),
  ShoeColor: sequelize.import('./shoecolor'),
  Fabric: sequelize.import('./fabric'),
  Size: sequelize.import('./size'),
  ContentLink: sequelize.import('./content_link'),
  CartMetaImage: sequelize.import("./cart_meta_image"),
  Admin: sequelize.import("./admin"),
  Promotion: sequelize.import("./promotion"),
  PromotionProductRelationship: sequelize.import("./promotion_product_relationship"),
  PromotionCategory: sequelize.import("./promotion_category"),
  Bank: sequelize.import("./bank"),
  ProductStock: sequelize.import("./product_stock"),
  HomeSections: sequelize.import("./home_sections"),
  TailorRequest: sequelize.import("./tailor_request"),
  DeliveryAddress: sequelize.import("./delivery_address")
  // FabricStock: sequelize.import("fabric_stock")
}

// loop through database tables and apply association if any

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});


// let models configuration be attached to models module

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
