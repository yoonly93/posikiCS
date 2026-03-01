/**
 * 멀티테넌트 마이그레이션 스크립트
 *
 * 기존 flat 구조 → /users/{uid}/ 하위 구조로 데이터 이동
 *
 * 사용법:
 *   1. Firebase Admin SDK 서비스 계정 키 다운로드
 *   2. GOOGLE_APPLICATION_CREDENTIALS 환경변수 설정
 *   3. node scripts/migrate-to-multi-tenant.js
 *
 * 주의: 실행 전 Firestore 백업 권장
 */

const admin = require('firebase-admin');

const ADMIN_EMAIL = 'wildkindground@gmail.com';

// ── 초기화 ──
admin.initializeApp();
const db = admin.firestore();

async function main() {
  console.log('=== 멀티테넌트 마이그레이션 시작 ===\n');

  // 1. 기존 관리자 UID 조회
  console.log('1. 관리자 UID 조회...');
  let uid;
  try {
    const userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    uid = userRecord.uid;
    console.log(`   UID: ${uid}\n`);
  } catch (err) {
    console.error(`   관리자 계정을 찾을 수 없습니다: ${ADMIN_EMAIL}`);
    process.exit(1);
  }

  // 2. /users/{uid} 프로필 생성
  console.log('2. 유저 프로필 생성...');
  const userRef = db.doc(`users/${uid}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    await userRef.set({
      email: ADMIN_EMAIL,
      displayName: '',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('   생성 완료\n');
  } else {
    console.log('   이미 존재 — 스킵\n');
  }

  // 3. /apps → /users/{uid}/apps
  console.log('3. apps 컬렉션 마이그레이션...');
  const appsSnap = await db.collection('apps').get();
  let count = 0;
  for (const doc of appsSnap.docs) {
    await db.doc(`users/${uid}/apps/${doc.id}`).set(doc.data());
    count++;
  }
  console.log(`   ${count}개 문서 복사\n`);

  // 4. /contactForms → /users/{uid}/contactForms + formIndex 생성
  console.log('4. contactForms 컬렉션 마이그레이션...');
  const formsSnap = await db.collection('contactForms').get();
  count = 0;
  for (const doc of formsSnap.docs) {
    const data = doc.data();
    await db.doc(`users/${uid}/contactForms/${doc.id}`).set(data);
    // formIndex 엔트리 생성
    await db.doc(`formIndex/${doc.id}`).set({
      uid,
      status: data.status || 'active',
    });
    count++;
  }
  console.log(`   ${count}개 문서 복사 + formIndex 생성\n`);

  // 5. /contacts → /users/{uid}/contacts
  console.log('5. contacts 컬렉션 마이그레이션...');
  const contactsSnap = await db.collection('contacts').get();
  count = 0;
  for (const doc of contactsSnap.docs) {
    await db.doc(`users/${uid}/contacts/${doc.id}`).set(doc.data());
    count++;
  }
  console.log(`   ${count}개 문서 복사\n`);

  // 6. /legal → /users/{uid}/legal
  console.log('6. legal 컬렉션 마이그레이션...');
  count = 0;
  // legal 구조: /legal/{appId}/{docType}/{lang}
  const legalAppsSnap = await db.collection('legal').get();
  for (const appDoc of legalAppsSnap.docs) {
    const appId = appDoc.id;
    // 각 docType 서브컬렉션 순회
    for (const docType of ['privacy', 'terms']) {
      const langSnap = await db.collection(`legal/${appId}/${docType}`).get();
      for (const langDoc of langSnap.docs) {
        await db.doc(`users/${uid}/legal/${appId}/${docType}/${langDoc.id}`).set(langDoc.data());
        count++;
      }
    }
  }
  console.log(`   ${count}개 문서 복사\n`);

  // 7. /settings → /users/{uid}/settings
  console.log('7. settings 컬렉션 마이그레이션...');
  const settingsSnap = await db.collection('settings').get();
  count = 0;
  for (const doc of settingsSnap.docs) {
    await db.doc(`users/${uid}/settings/${doc.id}`).set(doc.data());
    count++;
  }
  console.log(`   ${count}개 문서 복사\n`);

  // 8. 검증
  console.log('=== 검증 ===');
  const verifyCollections = ['apps', 'contactForms', 'contacts', 'settings'];
  for (const col of verifyCollections) {
    const origCount = (await db.collection(col).get()).size;
    const newCount = (await db.collection(`users/${uid}/${col}`).get()).size;
    const match = origCount === newCount ? 'OK' : 'MISMATCH';
    console.log(`   ${col}: 원본 ${origCount} → 신규 ${newCount} [${match}]`);
  }

  const formIndexCount = (await db.collection('formIndex').get()).size;
  console.log(`   formIndex: ${formIndexCount}개 생성`);

  console.log('\n=== 마이그레이션 완료 ===');
  console.log('\n검증 후 원본 컬렉션을 수동으로 삭제해주세요:');
  console.log('  - /apps, /contactForms, /contacts, /legal, /settings');
  console.log('  - NEXT_PUBLIC_ADMIN_EMAIL 환경변수 삭제');
}

main().catch((err) => {
  console.error('마이그레이션 실패:', err);
  process.exit(1);
});
