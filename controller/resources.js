var strings = {
 THE_EMAIL_YOU_ENTERED_IS_NOT_ELIGIBLE_FOR_DISCOUNT:{
	 en: "The email you entered is not eligible for discount",
	 ar: "هذا البريد الالكتروني غير صحيح.. برجاء المحاولة مرة أخرى"
 },
 ERROR_PLEASE_TRY_AGAIN_LATER:{
	 en: "Error please try again later",
	 ar: "خطأ يرجى المحاولة مرة أخرى في وقت لاحق"
 },
 KINDLY_CHECK_YOUR_EMAIL_TO_GET_YOUR_CODE:{
	 en: "Kindly check your email to get your code",
	 ar: "لقد تم إرسال كود الخصم إلى بريدك الالكتروني, يرجى إدخال كود الخصم"
 }
};
module.exports = { getStringVal : (x, txt) => {
  let lang = x == 1 ? "en" : "ar";
  return strings[txt][lang];
}
}
