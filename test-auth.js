const bcrypt = require('bcryptjs');

async function main() {
  const adminHash = '$2b$12$8dqbWo.bD7KEQB989tUz9uULGSXnkbSpcWkyDkQ.v44QrTVc019my';
  const isMatch = await bcrypt.compare('admin123', adminHash);
  console.log("admin123 matches:", isMatch);
  
  const testUserHash = '$2b$12$FVHg4/b6n4sSx6tvFtTiG.CDQizuFyw9gOEkW2v4e1qHb9pp587Si';
  const isMatch2 = await bcrypt.compare('testuser123', testUserHash);
  console.log("testuser123 matches:", isMatch2);
}

main();
