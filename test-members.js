import { initializeApp } from 'firebase/app';
import { getFirestore, collectionGroup, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const configUrl = './firebase-applet-config.json';
const config = JSON.parse(readFileSync(configUrl, 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const q = collectionGroup(db, 'members');
  const snap = await getDocs(q);
  console.log(`Found ${snap.size} members.`);
  snap.docs.forEach(d => {
    console.log(d.id, d.data().fullName, '-> level:', d.data().level, 'baptizedSubLevel:', d.data().baptizedSubLevel, 'role:', d.data().role, 'membershipLevel:', d.data().membershipLevel, 'branch:', d.data().branchId, 'path:', d.ref.path);
  });
  process.exit(0);
}
run();
