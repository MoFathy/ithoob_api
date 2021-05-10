module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var MeasurementProfile = sequelize.define('measurement_profile', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    value_1: {
      type: DataTypes.FLOAT
    },
    value_2: {
      type: DataTypes.FLOAT
    },
    value_3: {
      type: DataTypes.FLOAT
    },
    value_4: {
      type: DataTypes.FLOAT
    },
    value_5: {
      type: DataTypes.FLOAT
    },
    value_6: {
      type: DataTypes.FLOAT
    },
    value_7: {
      type: DataTypes.FLOAT
    },
    default_profile: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },{
    //foreign keys are underscored
    underscored: true,
    timestamps: true,
    // supports languages like arabic to be stored in db
    charset: 'utf8',
    collate: 'utf8_unicode_ci',
  });

  MeasurementProfile.associate = (models) =>{
    MeasurementProfile.belongsTo(models.User,
      {
        as: 'User',
        foreignKey: 'user_id',
        constraints: false      
        
      }
    )
    MeasurementProfile.hasMany(models.CartProductRelationship,
      {
        // through: models.CartProductProfile, 
        as: 'CartProductRelationships',
        foreignKey: 'profile_id',
        constraints: false      
      }
    )
    MeasurementProfile.hasMany(models.OrderProductRelationship,
      {
        // through: models.OrderProductProfile, 
        as: 'OrderProductRelationships',
        foreignKey: 'profile_id',    
        constraints: false      

      }
    )
  }

  return MeasurementProfile;
}