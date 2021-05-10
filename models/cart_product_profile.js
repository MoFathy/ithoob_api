
// module.exports = (sequelize, DataTypes) => {
//   // defining the user model attributes
//   var CartProductProfile = sequelize.define('cart_product_profile', {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//       primaryKey: true
//     }
//     // property: {
//     //   type: DataTypes.STRING
//     // },
//     // value: {
//     //   type: DataTypes.STRING
//     // }
//   },{
//     //foreign keys are underscored
//     underscored: true,
//     timestamps: false,
//     // supports languages like arabic to be stored in db
//     charset: 'utf8',
//     collate: 'utf8_unicode_ci',
//   });

//   // CartProductMeta.associate = (models) =>{
//   //   CartProductMeta.belongsTo(models.CartProductRelationship,
//   //     {
//   //       as: 'CartProduct',
//   //       foreignKey: 'cart_prod_id',       
//   //     }
//   //   )
  
//   // }

//   return CartProductProfile;
// }