const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'librory-print02.appspot.com'
});

async function configureCors() {
  try {
    const bucket = admin.storage().bucket();
    
    await bucket.setCorsConfiguration([
      {
        origin: ['*'],
        responseHeader: ['*'],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
        maxAgeSeconds: 3600
      }
    ]);

    console.log('Successfully updated CORS configuration for Firebase Storage!');
    process.exit(0);
  } catch (error) {
    console.error('Error configuring CORS:', error);
    process.exit(1);
  }
}

configureCors();
