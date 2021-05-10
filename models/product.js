
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var Product = sequelize.define('Product', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    title_en: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sub_title: {
      type: DataTypes.STRING({length: 355})
    },
    sub_title_en: {
      type: DataTypes.STRING({length: 355})
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {      
      type: DataTypes.INTEGER,
    },
    price_discount: {      
      type: DataTypes.INTEGER,
    },
  
    // zarzour_id: {      
    //   type: DataTypes.INTEGER,  // fabric_id: {      
    //   type: DataTypes.INTEGER,
    // },
    // },
    // yaka_id: {      
    //   type: DataTypes.INTEGER,
    // },
    // akmam_id: {      
    //   type: DataTypes.INTEGER,
    // },
    // others_id: {      
    //   type: DataTypes.INTEGER,
    // },
    // cat_id: {      
    //   type: DataTypes.INTEGER,
    // },
    is_recommended: {      
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_last: {      
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_best_seller: {      
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
   
    image:  {
      type: DataTypes.STRING
    },
    image_2:  {
      type: DataTypes.STRING
    },
    image_3:  {
      type: DataTypes.STRING
    },
    image_4:  {
      type: DataTypes.STRING
    },
    sku: {
      type: DataTypes.STRING,
      unique: true
    },
    available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });

  // add associations between category model and group model
  Product.associate = (models) =>{
    Product.belongsToMany(models.CategoryRelationship,
      {
        as: 'CategoryRelations',
        through: models.ProductCategoryRelationship,
        foreignKey: 'product_id',
        // constraints: false      
        
      }
    )
  
    Product.belongsTo(models.Category,

      {
        as: 'Category',
        foreignKey: 'category_id',
        // constraints: false      
        
      }
    )

    Product.belongsToMany(models.ProductMeta, {
      as: "Metas",
      through: models.ProductMetaRelationship,
      foreignKey: "product_id"
      // constraints: false
    });
   
    // Product.belongsToMany(models.Cart, {
    //   as: "Carts",
    //   through: models.CartProductRelationship,
    //   foreignKey: "product_id",
    //   constraints: false,
    //   unique: false
    // });
    Product.hasMany(models.CartProductRelationship, {
      // through: models.CartProductRelationship,
      foreignKey: 'product_id',
      as: 'CartProductRelationships',
      constraints: false,
      unique: false
    })
    Product.hasMany(models.OrderProductRelationship, {
      // through: models.OrderProductRelationship,
      foreignKey: 'product_id',
      as: 'OrderProductRelationships',
      constraints: false,
      unique: false
    })
    //old association
    // Product.belongsToMany(models.Promotion, {
    //   as: "Promotions",
    //   through: models.PromotionProductRelationship,
    //   foreignKey: "product_id"
    //   // constraints: false
    // });
    Product.hasMany(models.PromotionProductRelationship,  {
      as: "PromotionProductRelations", 
      foreignKey: "product_id"
    })
    Product.hasOne(models.ProductStock,  {
      as: "Stock", 
      foreignKey: "product_id"
    })
    // Product.belongsTo(models.FabricStock, {
    //   as: "Fabric",
    //   foreignKey: "fabric_id"      
    // })

  }

  return Product;
}