
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var OrderCustomizeRelationship = sequelize.define('order_customize_relationship', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM,
      values: ["fabric", "yaka","zarzour","adds","akmam","others"]
    },
  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });

  return OrderCustomizeRelationship;
}