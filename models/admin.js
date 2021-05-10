
module.exports = (sequelize, DataTypes) => {
  // defining the user model attributes
  var Admin = sequelize.define('Admin', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    role: {
      type: DataTypes.ENUM,
      values: ['general', 'super'],
      defaultValue: "general"
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        len: {
          args: [3, 100],
          msg: "Password should be within the limits"
        }
      }
    },
    mobile: {
      type: DataTypes.STRING,
      unique: true
    }
  }, {
      //foreign keys are underscored
      underscored: true,
      timestamps: false,
      // supports languages like arabic to be stored in db
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    });

  // Admin.associate = (models) =>{
  //   Admin.hasOne(models.Cart, {
  //     as: 'Cart',
  //     foreignKey: 'Admin_id'
  //   })
  //   Admin.hasMany(models.Order, {
  //     as: 'Orders',
  //     foreignKey: 'Admin_id'
  //   })

  // }

  return Admin;
}
