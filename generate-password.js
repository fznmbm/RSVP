const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔐 AHHC Admin Password Hash Generator\n');
console.log('This will generate a secure hash for your admin password.');
console.log('Store this hash in your .env.local file as ADMIN_PASSWORD_HASH\n');

rl.question('Enter your desired admin password: ', (password) => {
  if (!password || password.length < 6) {
    console.log('\n❌ Password must be at least 6 characters long!');
    rl.close();
    return;
  }

  console.log('\n⏳ Generating hash...\n');

  const hash = bcrypt.hashSync(password, 10);

  console.log('✅ Password hash generated successfully!\n');
  console.log('Copy this hash to your .env.local file:\n');
  console.log('─'.repeat(60));
  console.log(hash);
  console.log('─'.repeat(60));
  console.log('\nAdd to .env.local:');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
  console.log('⚠️  Keep this hash secure and never commit it to version control!\n');

  rl.close();
});

rl.on('close', () => {
  process.exit(0);
});
