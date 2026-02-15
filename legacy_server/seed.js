require('dotenv').config();
const db = require('./models/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

console.log('🌱 Seeding database...\n');

// Clear existing data
db.exec('DELETE FROM votes');
db.exec('DELETE FROM voters');
db.exec('DELETE FROM candidates');
db.exec('DELETE FROM positions');
db.exec('DELETE FROM elections');
db.exec('DELETE FROM admins');

// Create admin
const adminId = uuidv4();
const hashedPassword = bcrypt.hashSync('admin123', 12);
db.prepare('INSERT INTO admins (id, email, password, name) VALUES (?, ?, ?, ?)').run(
  adminId, 'admin@lasumsa.edu', hashedPassword, 'Election Admin'
);
console.log('✅ Admin created: admin@lasumsa.edu / admin123\n');

// Create election
const electionId = uuidv4();
db.prepare(`
  INSERT INTO elections (id, title, description, start_date, end_date, status, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  electionId,
  'LASUMSA Student Union Election 2026',
  'Annual student union elections for the 2025/2026 academic session. Vote for your preferred candidates across all positions.',
  new Date().toISOString(),
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  'active',
  adminId
);
console.log('✅ Election created: LASUMSA Student Union Election 2026\n');

// Create positions and candidates
const positions = [
  {
    title: 'President',
    description: 'The President leads the student union and represents students in all matters.',
    candidates: [
      { name: 'Adebayo Johnson', bio: '400L Medicine & Surgery. Former SUG Secretary with 3 years of leadership experience.' },
      { name: 'Fatimah Mohammed', bio: '500L Law. Human rights advocate and debate club president.' },
      { name: 'Chukwuemeka Obi', bio: '400L Engineering. Founder of TechVarsity student initiative.' }
    ]
  },
  {
    title: 'Vice President',
    description: 'The Vice President assists the President and oversees internal affairs.',
    candidates: [
      { name: 'Oluwaseun Adeyemi', bio: '300L Pharmacy. Student welfare committee chair.' },
      { name: 'Halima Bello', bio: '400L Sciences. Sports council coordinator and mentor.' }
    ]
  },
  {
    title: 'General Secretary',
    description: 'The General Secretary handles all administrative duties and record keeping.',
    candidates: [
      { name: 'Ifeanyi Nwankwo', bio: '300L Computer Science. IT support volunteer and coding club lead.' },
      { name: 'Aisha Suleiman', bio: '400L Arts. Editor of the campus magazine for 2 years.' },
      { name: 'Tunde Bakare', bio: '300L Business Admin. Model UN delegate and public speaker.' }
    ]
  },
  {
    title: 'Financial Secretary',
    description: 'The Financial Secretary manages the union\'s finances and budget.',
    candidates: [
      { name: 'Blessing Okoro', bio: '400L Accounting. Campus entrepreneur and financial literacy advocate.' },
      { name: 'Musa Danjuma', bio: '300L Economics. Former class treasurer with transparent leadership.' }
    ]
  },
  {
    title: 'Director of Socials',
    description: 'The Director of Socials plans and coordinates all social events and activities.',
    candidates: [
      { name: 'Zainab Yusuf', bio: '300L Mass Communication. Events coordinator and social media strategist.' },
      { name: 'David Okonkwo', bio: '400L Performing Arts. Drama club president and campus entertainer.' },
      { name: 'Grace Adeola', bio: '300L Fine Arts. Cultural week organizer for 2 consecutive years.' }
    ]
  }
];

positions.forEach((pos, index) => {
  const posId = uuidv4();
  db.prepare(`
    INSERT INTO positions (id, election_id, title, description, max_votes, display_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(posId, electionId, pos.title, pos.description, 1, index + 1);

  pos.candidates.forEach((cand, cIndex) => {
    const candId = uuidv4();
    db.prepare(`
      INSERT INTO candidates (id, position_id, election_id, name, bio, photo_url, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(candId, posId, electionId, cand.name, cand.bio, '', cIndex + 1);
  });

  console.log(`✅ Position: ${pos.title} (${pos.candidates.length} candidates)`);
});

// Create sample voters
const departments = ['Medicine', 'Law', 'Engineering', 'Sciences', 'Arts', 'Pharmacy', 'Education', 'Business Admin'];
const firstNames = ['Adeola', 'Bola', 'Chinedu', 'Dami', 'Emeka', 'Funmi', 'Gbenga', 'Hauwa', 'Ibrahim', 'Jumoke',
  'Kemi', 'Ladi', 'Miriam', 'Ngozi', 'Ope', 'Peter', 'Queen', 'Rasheed', 'Sade', 'Tola',
  'Uche', 'Victor', 'Wale', 'Xena', 'Yinka', 'Zara', 'Amara', 'Bamidele', 'Chiamaka', 'Dayo'];
const lastNames = ['Adeyemi', 'Balogun', 'Chukwu', 'Disu', 'Eze', 'Fashola', 'Garba', 'Hassan', 'Igwe', 'James',
  'Kalu', 'Lawal', 'Musa', 'Nnamdi', 'Ogundimu', 'Peters', 'Quadri', 'Rahman', 'Salami', 'Thomas',
  'Udoh', 'Vandi', 'Williams', 'Xavier', 'Yusuf', 'Zubair', 'Ajayi', 'Bankole', 'Clement', 'Dosunmu'];

console.log('\n📋 Creating voters...\n');

const voters = [];
for (let i = 1; i <= 50; i++) {
  const id = uuidv4();
  const matricNum = `MAT/2024/${String(i).padStart(3, '0')}`;
  const code = `VOTE-${String(i).padStart(3, '0')}-ABC`;
  const name = `${firstNames[(i - 1) % firstNames.length]} ${lastNames[(i - 1) % lastNames.length]}`;
  const dept = departments[(i - 1) % departments.length];

  db.prepare(`
    INSERT INTO voters (id, election_id, matric_number, voting_code, name, email, department)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, electionId, matricNum, code, name, `${matricNum.replace(/\//g, '').toLowerCase()}@student.lasumsa.edu`, dept);

  voters.push({ matricNum, code, name });
}

console.log('✅ 50 voters created\n');
console.log('📋 Sample voter credentials:');
console.log('┌──────────────────┬──────────────────┬──────────────────────────┐');
console.log('│ Matric Number    │ Voting Code      │ Name                     │');
console.log('├──────────────────┼──────────────────┼──────────────────────────┤');
voters.slice(0, 5).forEach(v => {
  console.log(`│ ${v.matricNum.padEnd(16)} │ ${v.code.padEnd(16)} │ ${v.name.padEnd(24)} │`);
});
console.log('└──────────────────┴──────────────────┴──────────────────────────┘');
console.log('\n🎉 Seeding complete!\n');
