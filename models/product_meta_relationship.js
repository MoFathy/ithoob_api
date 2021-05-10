
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var ProductMetaRelationship = sequelize.define('product_meta_relationship', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      primaryKey: true
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false
    }

  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    // charset: 'utf8',
    // collate: 'utf8_unicode_ci',
  });

  // ProductMetaRelationship.associate = models => {
  //   ProductMetaRelationship.belongsTo(models.Product, {
  //     as: "product",
  //     foreignKey: "product_id"
  //     // constraints: false
  //   });
  //   ProductMetaRelationship.belongsTo(models.ProductMeta, {
  //     as: "Meta",
  //     foreignKey: "product_meta_id"
  //     // constraints: false
  //   });
  // };
  return ProductMetaRelationship;
}