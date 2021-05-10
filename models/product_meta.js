
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var ProductMeta = sequelize.define('product_meta', {
    type: {
      type: DataTypes.STRING,
      allowNull: false
    }

  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });

  // add associations between user model and group model
  ProductMeta.associate = (models) =>{
    ProductMeta.belongsToMany(models.Product,
      {
        through: models.ProductMetaRelationship,
        foreignKey: 'product_meta_id',
        as: 'Products'
      }
    )
  }

  return ProductMeta;
}