const models = require("../models");
const User = models.User;
const Sequelize =require("sequelize");
const Op = Sequelize.Op;
const Product = models.Product;

const productController = require("./productController");

module.exports =  {
    getHomeProducts:(res,language,cat,filter=null)=>{
      let titleKey = language == 1 ? "title_en" : "title";
      let nameKey = language == 1 ? "name_en" : "name";
        return Promise.all([
          models.CategoryRelationship.findAll({
            // attributes:['child_id'],
            where: {
              parent_id: cat
            },
            include:[{model: models.Category,as:"Parents",include:{model: models.CategoryMeta, as: "Metas"}}]
          })
          ,
          models.Category.findAll({where:{available:true}}),
          models.Category.findAll({where:{available:true,type:"general"}})

          ]).then(results=>{
            let first = results[0];
            let firstItemOfFirst = {...first[0]};
            first = first.filter(j=>{return results[1].find(i=>{return i.id == j.child_id}) && results[1].find(i=>{return i.id == j.parent_id})})
            first = [firstItemOfFirst,...first]
            if(first){
              let catArr = [cat]
              first.map(item=>{
                catArr.push(item.child_id)
              })

              let searshArr = results[2].map(item => item.id)
              let catToSerach = filter === "recommended" ? searshArr : catArr;
              console.log('====================================');
              console.log(catToSerach);
              console.log('====================================');
              return productController.getProducts(catToSerach,0,8,res,language,true,filter).then(response2=>{
                var commercialDesc = language === 1 ? 'commercialDesc_en' :'commercialDesc'
                return {
                  slug:first[0].Parents.Metas.find(i=>i.type=='slug')? first[0].Parents.Metas.find(i=>i.type=='slug').category_meta_relationship.value : "",
                  title:first[0].Parents[nameKey],
                  title_en: first[0].Parents.name_en,
                  title_ar: first[0].Parents.name,
                  img:first[0].Parents.Metas.find(i=>i.type=='image')? first[0].Parents.Metas.find(i=>i.type=='image').category_meta_relationship.value : "",
                  commercialDesc:first[0].Parents.Metas.find(i=>i.type== commercialDesc)? first[0].Parents.Metas.find(i=>i.type==commercialDesc).category_meta_relationship.value : "",
                  products:[...response2.products],
                }
              }).catch(err => {
                res.status(401).json({
                  status: false,
                  message: "Error in loading home products"
                })
              })
            }
          }).catch(err => {
            res.status(401).json({
              status: false,
              message: "Error in loading home products"
            })
          })
    }
}
