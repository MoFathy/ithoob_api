
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var CartCustomizeRelationship = sequelize.define('cart_customize_relationship', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM,
      values: ["fabric", "yaka","zarzour","akmam","adds","others"]
    },
    // cart_prod_id : {
    //   type: DataTypes.INTEGER,
    //   constraints: false
    // },
    // category_rel_id : {
    //   type: DataTypes.INTEGER,
    //   constraints: false
    // }
  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
    // indexes: [{
    //   // name: 'cart_customize_relationships_cart_prod_id_category_rel_id_unique',
    //   name: 'cart_customize_relationships_cart_prod_id_category_rel_id',      
    //   method: 'BTREE',
    //   unique: false,
    //   fields: ['cart_prod_id', 'category_rel_id']
    // }]
  });
  
  return CartCustomizeRelationship;
}