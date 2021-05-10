module.exports = {
//fathy facebook
  facebook: {
    client_id: "477479046731131",
    client_secret: "885a3b919e78a477ecdc68920d0af4fb"
  },
// old facebook
  // facebook: {
  //   client_id: "750954715304923",
  //   client_secret: "47e7e473a70500af8730dc8dc2905ebe"
  // },
  twitter: {
    TWITTER_CONSUMER_KEY: "Ykq7ConBUM4q8iIcGzqokNBlg",
    TWITTER_CONSUMER_SECRET: "QihlHytxwSBVQ8rwGCMckxGLvXtstTSKgrStoZDrzN22I2qEPC"
  },
  // aya
  // twitter: {
  //   TWITTER_CONSUMER_KEY: "CAu7fwsykPrgcWAHptaV1YeV1",
  //   TWITTER_CONSUMER_SECRET: "b7W3gcElcqZsNs9CxqSHOabpd4qpdX7kTsRUbEh9ykmo6VUwJ6"
  // },
  //fathy
  google: {
    GOOGLE_CLIENT_ID: "1080585770342-cjqgkebfrc2oi1pikv6mapiv8ripijtk.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "I83ZNe_YqC63nruVcn1o5vDB"
  },
  // // marwa the last one
  // google: {
  //   GOOGLE_CLIENT_ID: "389067804915-74l3v9p0g97nvo1aadhgp31dlto892sk.apps.googleusercontent.com",
  //   GOOGLE_CLIENT_SECRET: "9fUd3yWufoj7tAL0TELpvvSX"
  // },
  // aya
  // google: {
  //   GOOGLE_CLIENT_ID: "714112002538-dvlo3tubqlili1dge3pq2fijmnmktq73.apps.googleusercontent.com",
  //   GOOGLE_CLIENT_SECRET: "iaCG-9f71Up4v0veqYwILvCl"
  // },
  secretKey: "secretsecret",
  // prod
  dbPassword: "vc2bh8hrml8j1b2i",
  //local
  // dbPassword: "ywZoLOg1Xf6p0ww8",
  mailKey: {
    host: "host.webkeyz.com",
    port: 465,
    user: 'doaamail@web-keyz.com',
    password: 'doaaMailPwd',
    from: 'ithoob@ithoob.com'
  },
  notificationKey: {
    fcm_api_key: 'AAAAk50LYYY:APA91bFOWGf-tZCddTzBLAw9itHj3HcBNz0NYifcCBVjYcsdqviAW1V9gIcvG5du0ad7wUVz-cdfMlgMqQS8B5K8h_AzlshiDR_Cw-GhBANlXMJImmsnYl2IiFIWh-p_AzUgnH8bWGq7'
  },
  smsKeys: {
    username: "966500900833",
    password: "iTh@20$19"
},

FTPconfig:{
    user: "jzluploader",        // NOTE that this was username in 1.x
    password: "kYj1q7PBD=X2",   // optional, prompted if none given
    host: "localhost",
    port: 21,
    localRoot: './tmp',  	// location: www/api/
    remoteRoot: './ithoob/assets/uploads',		// root folder of the FTP user!!
    include: ['*.jpg', '*.png', '*.gif','*.jpeg'],
    exclude: [],
    deleteRemote: false,              // delete ALL existing files at destination before uploading, if true
    forcePasv: true                 // Passive mode is forced (EPSV command is not sent)
},
fullUrl: "https://assets.ithoob.com/uploads/"

/*
FTPconfig:{
    user: "uploads@web-keyz.com",                   // NOTE that this was username in 1.x
    password: "kYj1q7PBD=X2",           // optional, prompted if none given
    host: "173.199.166.52",
    port: 21,
    localRoot: './tmp',
    remoteRoot: '/',
    include: ['*.jpg', '*.png', '*.gif','*.jpeg'],
    exclude: [],
    deleteRemote: false,              // delete ALL existing files at destination before uploading, if true
    forcePasv: true                 // Passive mode is forced (EPSV command is not sent)
}
*/
}
