
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var Partner = sequelize.define('Partner', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    discount: {
      type: DataTypes.FLOAT
    }
  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: false,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });

  Partner.associate = (models) =>{
    Partner.hasMany(models.PartnerCode,
      {
        as: 'Codes',
        foreignKey: 'partner_id',
        // constraints: false      
        
      }
    )
    
  }

  return Partner;
}