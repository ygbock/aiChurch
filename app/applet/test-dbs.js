import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
const config = JSON.parse(readFileSync('./src/firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);
async function run() {
  const snaps = await getDocs(collection(db, 'districts'));
  console.log("districts:", snaps.docs.length);
  snaps.docs.forEach(d => console.log(d.id, d.data().name));
}
run().catch(console.error);
