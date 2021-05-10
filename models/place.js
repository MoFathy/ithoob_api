
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var Place = sequelize.define('Place', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name_en: {
      type: DataTypes.STRING,
      allowNull: false
    },
    man_price: {
      type: DataTypes.STRING
    },
    delivery_price: {
      type: DataTypes.STRING
    },
    available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }

  }, {
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });

  Place.associate = (models) => {
    Place.hasMany(models.User,
      {
        as: 'Users',
        foreignKey: 'area_id',
        constraints: false

      }
    )
    Place.hasMany(models.Place,
      {
        as: 'Areas',
        foreignKey: 'country_id',
        // through: models.PlaceRelationship
        // constraints: false      

      }
    )
    Place.belongsTo(models.Place,
      {
        as: 'Country',
        foreignKey: 'country_id',
        // through: models.PlaceRelationship
        // constraints: false              
      }
    )

    //   Product.belongsToMany(models.ProductMeta, {
    //     as: "Metas",
    //     through: models.ProductMetaRelationship,
    //     foreignKey: "product_id"
    //     // constraints: false
    //   });

  }

  return Place;
}