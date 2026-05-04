import { initializeApp } from 'firebase/app';
import { getFirestore, collectionGroup, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);
async function run() {
  const snaps = await getDocs(collectionGroup(db, 'members'));
  console.log("total members:", snaps.docs.length);
  snaps.docs.forEach(d => {
      console.log(d.id, d.ref.path, d.data().fullName, d.data().level, d.data().districtId, d.data().branchId);
  });
}
run().catch(console.error);
