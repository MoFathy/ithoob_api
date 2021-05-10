
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var PartnerCode = sequelize.define('partner_code', {
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    valid: {
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

  PartnerCode.associate = (models) =>{
    PartnerCode.belongsTo(models.Partner,
      {
        as: 'Partner',
        foreignKey: 'partner_id',
        // constraints: false      
      }
    )
    PartnerCode.hasOne(models.Cart, {
      as: 'Cart',
      foreignKey: 'partner_code_id'
    }) 
  }

  return PartnerCode;
}