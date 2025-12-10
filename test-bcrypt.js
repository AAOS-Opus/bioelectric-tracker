const bcrypt = require('bcryptjs');

async function testBcrypt() {
  const password = 'Test123!';
  const rounds = 12;
  
  console.log('Testing bcryptjs...');
  
  // Simulate Register
  const hashedPassword = await bcrypt.hash(password, rounds);
  console.log('Hashed:', hashedPassword);
  
  // Simulate Login
  const match = await bcrypt.compare(password, hashedPassword);
  console.log('Match:', match);
  
  if (!match) {
    console.error('Bcrypt failed to match!');
    process.exit(1);
  } else {
    console.log('Bcrypt verified successfully.');
  }

  // Test space trimming hypothesis
  const paswordWithSpace = 'Test123! ';
  const matchSpace = await bcrypt.compare(paswordWithSpace, hashedPassword);
  console.log('Match with space:', matchSpace);
}

testBcrypt();
