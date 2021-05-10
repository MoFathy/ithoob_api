
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var PlaceRelationship = sequelize.define('place_relationship', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });

  // Place.associate = (models) =>{
  //   Place.hasMany(models.User,
  //     {
  //       as: 'Users',
  //       foreignKey: 'area_id',
  //       // constraints: false      
        
  //     }
  //   )
  //   Place.hasMany(models.Place,
  //     {
  //       as: 'Areas',
  //       foreignKey: 'parent_id',
  //       through: 'place_relationship'
  //       // constraints: false      
        
  //     }
  //   )
  //   Place.belongsTo(models.Place,
  //     {
  //       as: 'Country',
  //       foreignKey: 'child_id',
  //       through: 'place_relationship'
  //       // constraints: false      
        
  //     }
  //   )

  // //   Product.belongsToMany(models.ProductMeta, {
  // //     as: "Metas",
  // //     through: models.ProductMetaRelationship,
  // //     foreignKey: "product_id"
  // //     // constraints: false
  // //   });
    
  // }

  return PlaceRelationship;
}