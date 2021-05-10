module.exports.calculateThoob = function(
  frontLength,
  shoulder,
  waist,
  sleeveLength,
  kabak,
  sada,
  yaka,
  fabric,
  thoobQuantity
) {
  let fabricWidth;
  if (fabric == "double") {
    fabricWidth = 147.3;
  } else {
    fabricWidth = 96.5;
  }
  const sederiFrontLength = 0.44 * frontLength;
  const armHole = frontLength > 100 ? sada + 13 : sada + 10;
  const bottom = waist + 15;
  const a = (frontLength + 20) * shoulder * 2;
  const b = (sleeveLength + 17) * armHole * 2;
  const d = bottom - shoulder;
  const c = (sederiFrontLength + 25) * d * 2;
  const sum = a + b + c;
  return thoobQuantity?  Math.round(sum / (fabricWidth * 10)) * thoobQuantity :  Math.round(sum / (fabricWidth * 10))
};

module.exports.calculateThoobSmall = function(fabric,thoobQuantity) {
  let fabricWidth;
  if (fabric == "double") {
    fabricWidth = 147.3;
  } else {
    fabricWidth = 96.5;
  }
  const armHole = 19;
  const bottom  = 57;
  const frontLength = 120;
  const shoulder = 35;
  const sleeveLength = 50;
  const sederiFrontLength = 0.44 * frontLength;
  const a = (frontLength + 20) * shoulder * 2;
  const b = (sleeveLength + 17) * armHole * 2;
  const d = bottom - shoulder;
  const c = (sederiFrontLength + 25) * d * 2;
  const sum = a + b + c;
  return thoobQuantity?  Math.round(sum / (fabricWidth * 10)) * thoobQuantity :  Math.round(sum / (fabricWidth * 10))
}

module.exports.calculateThoobMedium = function(fabric, thoobQuantity) {
  let fabricWidth;
  if (fabric == "double") {
    fabricWidth = 147.3;
  } else {
    fabricWidth = 96.5;
  }
  const armHole = 20;
  const bottom  = 65;
  const frontLength = 123;
  const shoulder = 36.5;
  const sleeveLength = 55;
  const sederiFrontLength = 0.44 * frontLength;
  const a = (frontLength + 20) * shoulder * 2;
  const b = (sleeveLength + 17) * armHole * 2;
  const d = bottom - shoulder;
  const c = (sederiFrontLength + 25) * d * 2;
  const sum = a + b + c;
  return thoobQuantity?  Math.round(sum / (fabricWidth * 10)) * thoobQuantity :  Math.round(sum / (fabricWidth * 10))
}


module.exports.calculateThoobLarge = function(fabric, thoobQuantity) {
  let fabricWidth;
  if (fabric == "double") {
    fabricWidth = 147.3;
  } else {
    fabricWidth = 96.5;
  }
  const armHole = 20;
  const bottom  = 66;
  const frontLength = 137;
  const shoulder = 39;
  const sleeveLength = 59;
  const sederiFrontLength = 0.44 * frontLength;
  const a = (frontLength + 20) * shoulder * 2;
  const b = (sleeveLength + 17) * armHole * 2;
  const d = bottom - shoulder;
  const c = (sederiFrontLength + 25) * d * 2;
  const sum = a + b + c;
  return thoobQuantity?  Math.round(sum / (fabricWidth * 10)) * thoobQuantity :  Math.round(sum / (fabricWidth * 10))
}
